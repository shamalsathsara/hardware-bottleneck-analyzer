const crypto = require('crypto');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const { loadConfig } = require('../config/env');

const EMAIL = 'auth_suite_user@aura.local';
const PASSWORD = 'correct horse battery';

async function register() {
  return request(app).post('/api/auth/register').send({ username: 'Auth Suite', email: EMAIL, password: PASSWORD });
}

describe('Auth hardening', () => {
  beforeEach(async () => {
    await User.deleteMany({ email: EMAIL });
  });

  test('config refuses to start without a strong JWT secret', () => {
    expect(() => loadConfig({ MONGO_URI: 'mongodb://x' })).toThrow(/JWT_SECRET/);
    expect(() => loadConfig({ MONGO_URI: 'mongodb://x', JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
    expect(() => loadConfig({ JWT_SECRET: 'x'.repeat(40) })).toThrow(/MONGO_URI/);
    expect(() => loadConfig({ MONGO_URI: 'mongodb://x', JWT_SECRET: 'x'.repeat(40), MODEL_VERSION: 'v3' })).toThrow(/MODEL_VERSION/);
    expect(() => loadConfig({ MONGO_URI: 'mongodb://x', JWT_SECRET: 'x'.repeat(40), NODE_ENV: 'production' })).toThrow(/CORS_ORIGINS/);
  });

  test('register validates input types and email format (400, not 500)', async () => {
    const noBody = await request(app).post('/api/auth/register');
    expect(noBody.status).toBe(400);

    const objectEmail = await request(app).post('/api/auth/register')
      .send({ username: 'x1', email: { $gt: '' }, password: PASSWORD });
    expect(objectEmail.status).toBe(400);

    const badEmail = await request(app).post('/api/auth/register')
      .send({ username: 'x1', email: 'not-an-email', password: PASSWORD });
    expect(badEmail.status).toBe(400);
  });

  test('register + login issue HS256 tokens; wrong password and unknown email both 401', async () => {
    const reg = await register();
    expect(reg.status).toBe(201);
    expect(reg.body.token).toBeTruthy();

    const dup = await register();
    expect(dup.status).toBe(409);

    const ok = await request(app).post('/api/auth/login').send({ email: EMAIL.toUpperCase(), password: PASSWORD });
    expect(ok.status).toBe(200);
    expect(jwt.decode(ok.body.token, { complete: true }).header.alg).toBe('HS256');

    const wrong = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'nope-nope' });
    expect(wrong.status).toBe(401);
    const unknown = await request(app).post('/api/auth/login').send({ email: 'ghost@aura.local', password: PASSWORD });
    expect(unknown.status).toBe(401);
  });

  test('tokens signed with another secret are rejected', async () => {
    const forged = jwt.sign({ id: '507f1f77bcf86cd799439011' }, 'aura_fallback_jwt_development_secret');
    const res = await request(app).get('/api/user/rigs').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  test('password reset stores only a hash and locks after repeated wrong codes', async () => {
    await register();
    const forgot = await request(app).post('/api/auth/forgot-password').send({ email: EMAIL });
    expect(forgot.status).toBe(200);

    let user = await User.findOne({ email: EMAIL });
    expect(user.resetCodeHash).toMatch(/^[a-f0-9]{64}$/);
    expect(user.toObject()).not.toHaveProperty('resetCode');

    // Replace the emailed code with a known one for the test.
    user.resetCodeHash = crypto.createHash('sha256').update('123456').digest('hex');
    await user.save();

    const good = await request(app).post('/api/auth/verify-code').send({ email: EMAIL, code: '123456' });
    expect(good.status).toBe(200);

    for (let i = 0; i < 5; i += 1) {
      const bad = await request(app).post('/api/auth/verify-code').send({ email: EMAIL, code: '000000' });
      expect(bad.status).toBe(400);
    }

    // Locked: even the right code no longer works.
    const locked = await request(app).post('/api/auth/reset-password')
      .send({ email: EMAIL, code: '123456', newPassword: 'brand new password' });
    expect(locked.status).toBe(400);

    user = await User.findOne({ email: EMAIL });
    expect(user.resetAttempts).toBe(5);
  });

  test('successful reset changes the password and clears the code', async () => {
    await register();
    await request(app).post('/api/auth/forgot-password').send({ email: EMAIL });
    await User.updateOne(
      { email: EMAIL },
      { resetCodeHash: crypto.createHash('sha256').update('654321').digest('hex') }
    );

    const reset = await request(app).post('/api/auth/reset-password')
      .send({ email: EMAIL, code: '654321', newPassword: 'brand new password' });
    expect(reset.status).toBe(200);

    const user = await User.findOne({ email: EMAIL });
    expect(user.resetCodeHash).toBeUndefined();

    const login = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'brand new password' });
    expect(login.status).toBe(200);
  });
});

describe('Saved rigs', () => {
  let token;

  beforeEach(async () => {
    await User.deleteMany({ email: EMAIL });
    token = (await register()).body.token;
  });

  const auth = (req) => req.set('Authorization', `Bearer ${token}`);
  const rig = {
    name: 'Main PC',
    cpu: 'Ryzen 5 5600X',
    gpu: 'RTX 3060',
    ram: '16',
    resolution: '1920x1080',
    settings: 'Medium',
    cpuHardwareId: 'cpu_amd_ryzen_5_5600x_desktop',
  };

  test('save returns the same normalized shape as list, delete is atomic and 404s on unknown rigs', async () => {
    const saved = await auth(request(app).post('/api/user/rigs')).send(rig);
    expect(saved.status).toBe(201);
    expect(saved.body).toHaveLength(1);
    expect(saved.body[0]).toMatchObject({ name: 'Main PC', cpuHardwareId: 'cpu_amd_ryzen_5_5600x_desktop', gpuHardwareId: null });

    const listed = await auth(request(app).get('/api/user/rigs'));
    expect(Object.keys(listed.body[0]).sort()).toEqual(Object.keys(saved.body[0]).sort());

    const id = String(saved.body[0]._id);
    const deleted = await auth(request(app).delete(`/api/user/rigs/${id}`));
    expect(deleted.status).toBe(200);
    expect(deleted.body).toHaveLength(0);

    const again = await auth(request(app).delete(`/api/user/rigs/${id}`));
    expect(again.status).toBe(404);

    const invalid = await auth(request(app).delete('/api/user/rigs/not-an-id'));
    expect(invalid.status).toBe(400);
  });

  test('enforces the 50-rig cap', async () => {
    const rigs = Array.from({ length: 50 }, (_, i) => ({ ...rig, name: `PC ${i}` }));
    await User.updateOne({ email: EMAIL }, { $set: { savedRigs: rigs } });

    const res = await auth(request(app).post('/api/user/rigs')).send(rig);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Maximum limit/);
  });
});
