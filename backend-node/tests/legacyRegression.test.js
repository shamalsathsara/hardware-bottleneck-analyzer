const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const { CPU, GPU } = require('../models/Hardware');

describe('Project Aura V2.1.2B.1 Legacy Feature Regression Audit & Fix Test Suite', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Connect to database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    // Clean up any existing test user
    await User.deleteMany({ email: 'regression_test_user@aura.local' });

    testUser = await User.create({
      username: 'RegressionTester',
      email: 'regression_test_user@aura.local',
      passwordHash: 'hashed_password_123',
      savedRigs: [
        {
          name: 'Old Legacy Rig 2024',
          cpu: 'Intel Core i5-12400F',
          gpu: 'GeForce RTX 3060',
          ram: '16',
          resolution: '1920x1080',
          createdAt: new Date('2024-01-01'),
        },
      ],
    });

    authToken = jwt.sign(
      { id: testUser._id, username: testUser.username, email: testUser.email },
      process.env.JWT_SECRET || 'aura_jwt_secret_dev',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    if (testUser) {
      await User.deleteOne({ _id: testUser._id });
    }
  });

  // --------------------------------------------------------------------------
  // TEST 1: Saved Rigs Authentication & Security
  // --------------------------------------------------------------------------
  describe('1. Saved Rigs Authentication & Security', () => {
    it('GET /api/user/rigs should fail with 401 when no token is provided', async () => {
      const res = await request(app).get('/api/user/rigs');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('POST /api/user/rigs should fail with 401 when no token is provided', async () => {
      const res = await request(app).post('/api/user/rigs').send({
        name: 'Hacked Rig',
        cpu: 'Intel Core i5-12400F',
        gpu: 'NVIDIA GeForce RTX 4070',
        ram: '16',
        resolution: '1920x1080',
      });
      expect(res.status).toBe(401);
    });
  });

  // --------------------------------------------------------------------------
  // TEST 2: Retrieval & Legacy Shape Compatibility
  // --------------------------------------------------------------------------
  describe('2. Retrieval & Legacy Shape Compatibility', () => {
    it('GET /api/user/rigs should retrieve legacy rigs with read-time normalization', async () => {
      const res = await request(app)
        .get('/api/user/rigs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const legacyRig = res.body.find((r) => r.name === 'Old Legacy Rig 2024');
      expect(legacyRig).toBeDefined();
      expect(legacyRig.cpu).toBe('Intel Core i5-12400F');
      expect(legacyRig.gpu).toBe('GeForce RTX 3060');
      // Read-time normalization check
      expect(legacyRig.settings).toBe('High');
      expect(legacyRig).toHaveProperty('_id');
    });
  });

  // --------------------------------------------------------------------------
  // TEST 3: Save Rig with Normalized & Extended Fields
  // --------------------------------------------------------------------------
  describe('3. Save Rig with Normalized & Extended Fields', () => {
    it('POST /api/user/rigs should save a new rig with settings and optional hardwareId', async () => {
      const newRigPayload = {
        name: 'My Modern 4K Beast',
        cpu: 'AMD Ryzen 7 7800X3D',
        gpu: 'NVIDIA GeForce RTX 4070 SUPER',
        ram: '32',
        resolution: '3840x2160',
        settings: 'Ultra',
        cpuHardwareId: 'cpu_amd_ryzen_7_7800x3d_desktop',
        gpuHardwareId: 'gpu_nvidia_geforce_rtx_4070_super_desktop',
      };

      const res = await request(app)
        .post('/api/user/rigs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newRigPayload);

      expect(res.status).toBe(201);
      expect(Array.isArray(res.body)).toBe(true);

      const saved = res.body.find((r) => r.name === 'My Modern 4K Beast');
      expect(saved).toBeDefined();
      expect(saved.cpu).toBe('AMD Ryzen 7 7800X3D');
      expect(saved.gpu).toBe('NVIDIA GeForce RTX 4070 SUPER');
      expect(saved.settings).toBe('Ultra');
      expect(saved.cpuHardwareId).toBe('cpu_amd_ryzen_7_7800x3d_desktop');
    });

    it('POST /api/user/rigs should reject incomplete payloads missing required fields', async () => {
      const badPayload = {
        name: 'Incomplete Build',
        cpu: 'AMD Ryzen 7 7800X3D',
        // missing gpu, ram, resolution
      };

      const res = await request(app)
        .post('/api/user/rigs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(badPayload);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });
  });

  // --------------------------------------------------------------------------
  // TEST 4: Delete Saved Rig
  // --------------------------------------------------------------------------
  describe('4. Delete Saved Rig', () => {
    it('DELETE /api/user/rigs/:rigId should delete a saved rig', async () => {
      const getRes = await request(app)
        .get('/api/user/rigs')
        .set('Authorization', `Bearer ${authToken}`);

      const rigToDelete = getRes.body[0];
      expect(rigToDelete).toBeDefined();

      const delRes = await request(app)
        .delete(`/api/user/rigs/${rigToDelete._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(delRes.status).toBe(200);
      const remainingIds = delRes.body.map((r) => String(r._id));
      expect(remainingIds).not.toContain(String(rigToDelete._id));
    });
  });

  // --------------------------------------------------------------------------
  // TEST 5: Legacy Hardware Endpoints Contract Preservation
  // --------------------------------------------------------------------------
  describe('5. Legacy Hardware Endpoints Contract Preservation', () => {
    it('GET /api/cpus/search should return legacy cpuName, cpuMark, cores format', async () => {
      const res = await request(app).get('/api/cpus/search?q=12400');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('cpuName');
        expect(res.body[0]).toHaveProperty('cores');
      }
    });

    it('GET /api/gpus/search should return legacy Device, CUDA format', async () => {
      const res = await request(app).get('/api/gpus/search?q=3080');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('Device');
        expect(res.body[0]).toHaveProperty('CUDA');
      }
    });

    it('GET /api/hardware/stats should return both legacy anchors and master counts', async () => {
      const res = await request(app).get('/api/hardware/stats');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('maxCpuMark');
      expect(res.body).toHaveProperty('maxGpuCuda');
      expect(res.body).toHaveProperty('cpus');
      expect(res.body).toHaveProperty('gpus');
    });
  });
});
