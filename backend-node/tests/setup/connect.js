const mongoose = require('mongoose');

if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)[:/]/.test(process.env.MONGO_URI || '')) {
  throw new Error('Refusing to run tests: MONGO_URI is not the in-memory test database.');
}

// Each Jest worker gets its own database so parallel suites can't wipe each other's fixtures.
const url = new URL(process.env.MONGO_URI);
url.pathname = `/aura_test_${process.env.JEST_WORKER_ID || '1'}`;
process.env.MONGO_URI = url.toString();
process.env.MONGODB_URI = process.env.MONGO_URI;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      // MongoDB driver >=7.7 loads `os` via dynamic import(), which fails inside Jest's VM
      // sandbox and yields an empty handshake. Inject it explicitly (tests only).
      runtimeAdapters: { os: require('os') },
    });
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});
