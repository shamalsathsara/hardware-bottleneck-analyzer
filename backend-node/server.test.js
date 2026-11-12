const request = require('supertest');
const mongoose = require('mongoose');
const axios = require('axios');
const app = require('./server');
const { seedHardwareFixtures, seedGameFixtures } = require('./tests/setup/fixtures');

// Mock axios so our backend tests don't require the Python server to be running!
jest.mock('axios');

describe('Hardware Analyzer Backend API Tests', () => {
  
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGO_URI);
    await seedHardwareFixtures();
    await seedGameFixtures();
  });

  afterEach(() => jest.clearAllMocks());

  describe('Platform behaviour', () => {
    it('GET /api/health reports db and ai status', async () => {
      axios.get.mockResolvedValueOnce({ data: { status: 'healthy' } });
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok', db: 'up', ai: 'up' });
    });

    it('GET /api/health is 503 when the AI service is down', async () => {
      axios.get.mockRejectedValueOnce(new Error('ECONNREFUSED'));
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(503);
      expect(res.body.ai).toBe('down');
    });

    it('unknown routes return a JSON 404', async () => {
      const res = await request(app).get('/api/does-not-exist');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NOT_FOUND');
    });

    it('malformed JSON returns 400, not 500', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": ');
      expect(res.status).toBe(400);
    });

    it('sets security headers and hides x-powered-by', async () => {
      const res = await request(app).get('/api/hardware/stats');
      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('GET /api/hardware/stats', () => {
    it('should return a 200 status and max scaling values', async () => {
      const res = await request(app).get('/api/hardware/stats');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('maxCpuMark');
      expect(res.body).toHaveProperty('maxGpuCuda');
      // Scores are compared numerically (legacy CSV values used to be strings).
      expect(typeof res.body.maxCpuMark).toBe('number');
      expect(res.body.maxCpuMark).toBeGreaterThan(50000);
    });
  });

  describe('GET /api/cpus/search', () => {
    it('should return an array of matching CPUs', async () => {
      const res = await request(app).get('/api/cpus/search?q=Intel');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('should safely handle regex special characters without crashing', async () => {
      const res = await request(app).get('/api/cpus/search?q=Intel (R) [Core] *+?');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });
  });

  describe('GET /api/gpus/search', () => {
    it('should safely handle regex special characters in GPU search', async () => {
      const res = await request(app).get('/api/gpus/search?q=RTX (4090) *+?');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });
  });

  describe('GET /api/cpus and /api/gpus aliases', () => {
    it('should support /api/cpus lightweight alias', async () => {
      const res = await request(app).get('/api/cpus');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('should support /api/gpus lightweight alias', async () => {
      const res = await request(app).get('/api/gpus');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });
  });

  describe('POST /api/predict', () => {
    it('should reject invalid payload with missing CPU', async () => {
      const res = await request(app)
        .post('/api/predict')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should forward resolved V2 features to the AI service and return its prediction', async () => {
      axios.post.mockResolvedValue({ data: { predictedFps: 144.5, modelVersion: 'v2' } });

      const res = await request(app)
        .post('/api/predict')
        .send({ CPU: 'Intel Core i5-9500 @ 3.00GHz', GPU: 'GeForce GTX 1660 SUPER', GameName: 'fortnite', settings: 'Medium' });

      expect(res.status).toBe(200);
      expect(res.body.predictedFps).toBe(144.5);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringMatching(/\/predict$/),
        expect.objectContaining({ GameName: 'fortnite', GameSetting_Ordinal: 2 }),
        expect.any(Object)
      );
    });

    it('should return 503 when the Python AI is offline', async () => {
      axios.post.mockRejectedValue(new Error('Network Error'));

      const res = await request(app)
        .post('/api/predict')
        .send({ CPU: 'Intel Core i5-9500 @ 3.00GHz', GPU: 'GeForce GTX 1660 SUPER', GameName: 'fortnite' });

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('AI_SERVICE_UNAVAILABLE');
    });
  });

  describe('Game Catalog & Search API Tests', () => {
    it('GET /api/games/search?q=cyber should return matching games', async () => {
      const res = await request(app).get('/api/games/search?q=cyber');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('name');
        expect(res.body[0]).toHaveProperty('slug');
      }
    });

    it('GET /api/games/search should handle regex special characters safely', async () => {
      const res = await request(app).get('/api/games/search?q=Cyber*+?^$()[]');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('GET /api/games/:slug should return 200 for valid game', async () => {
      const res = await request(app).get('/api/games/cyberpunk-2077');
      expect(res.status).toBe(200);
      expect(res.body.slug).toBe('cyberpunk-2077');
      expect(res.body).toHaveProperty('requirements');
    });

    it('GET /api/games/:slug should return 404 for non-existent game', async () => {
      const res = await request(app).get('/api/games/non-existent-game-slug-12345');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    it('GET /api/games should return paginated list with metadata', async () => {
      const res = await request(app).get('/api/games?page=1&limit=6');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('games');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(6);
      expect(typeof res.body.pagination.total).toBe('number');
    });
  });

});
