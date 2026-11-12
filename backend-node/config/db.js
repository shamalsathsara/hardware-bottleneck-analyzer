const mongoose = require('mongoose');

const RETRY_DELAY_MS = 5000;
const MAX_ATTEMPTS = 10;

/**
 * Connects to MongoDB, retrying transient failures. Rejects after MAX_ATTEMPTS
 * so a misconfigured deployment fails loudly instead of serving without a DB.
 */
async function connectDB(uri, { attempts = MAX_ATTEMPTS } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
      console.log('MongoDB connected.');
      return mongoose.connection;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt}/${attempts} failed: ${err.message}`);
      if (attempt === attempts) throw err;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  return mongoose.connection;
}

module.exports = connectDB;
