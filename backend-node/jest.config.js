/**
 * Tests run against a throwaway in-memory MongoDB (mongodb-memory-server),
 * never against the MONGO_URI in .env.
 */
module.exports = {
  testEnvironment: 'node',
  globalSetup: '<rootDir>/tests/setup/globalSetup.js',
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.js',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/connect.js'],
  testTimeout: 30000,
};
