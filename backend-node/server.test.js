const request = require('supertest');
const mongoose = require('mongoose');
const axios = require('axios');
const app = require('./server');

// Mock axios so our backend tests don't require the Python server to be running!
jest.mock('axios');

describe('Hardware Analyzer Backend API Tests', () => {
  
  // Close the MongoDB connection after all tests finish so Jest doesn't hang
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/hardware/stats', () => {
    it('should return a 200 status and max scaling values', async () => {
      const res = await request(app).get('/api/hardware/stats');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('maxCpuMark');
      expect(res.body).toHaveProperty('maxGpuCuda');
    });
  });

  describe('GET /api/cpus/search', () => {
    it('should return an array of matching CPUs', async () => {
      const res = await request(app).get('/api/cpus/search?q=Intel');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      // Even if no CPUs exist, it should be an empty array, not an error
    });
  });

  describe('POST /api/predict', () => {
    it('should forward data to python AI and return prediction successfully', async () => {
      // Mock the successful response from the Python backend
      axios.post.mockResolvedValue({ data: { predicted_fps: 144.5 } });

      const res = await request(app)
        .post('/api/predict')
        .send({ CPU_Make: 'AMD', GPU_Make: 'NVIDIA' });

      expect(res.status).toBe(200);
      expect(res.body.predicted_fps).toBe(144.5);
    });

    it('should gracefully handle if the Python AI is offline', async () => {
      // Mock a connection timeout/error
      axios.post.mockRejectedValue(new Error('Network Error'));

      const res = await request(app)
        .post('/api/predict')
        .send({ CPU_Make: 'AMD', GPU_Make: 'NVIDIA' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to get prediction!');
    });
  });

});
