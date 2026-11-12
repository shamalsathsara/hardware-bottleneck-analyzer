const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async function globalSetup() {
  const mongo = await MongoMemoryServer.create();
  globalThis.__MONGO_SERVER__ = mongo;

  // Set before any test file loads, so config/env.js and dotenv never pick up the real .env values.
  process.env.NODE_ENV = 'test';
  process.env.MONGO_URI = mongo.getUri('aura_test');
  process.env.MONGODB_URI = process.env.MONGO_URI;
  process.env.JWT_SECRET = 'test-only-jwt-secret-0123456789abcdef0123456789';
  process.env.MODEL_VERSION = 'v2';
  process.env.AURA_AI_URL = 'http://127.0.0.1:5999';
  process.env.CORS_ORIGINS = '';
  // Present-but-empty keys are not overridden by dotenv: no real emails or paid API calls from tests.
  for (const key of ['EMAIL_USER', 'EMAIL_PASS', 'GEMINI_API_KEY', 'IGDB_CLIENT_ID', 'IGDB_CLIENT_SECRET']) {
    process.env[key] = '';
  }
};
