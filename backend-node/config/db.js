const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.warn('⚠️ MONGO_URI environment variable is not defined.');
      return;
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Successfully connected to MongoDB Atlas!');
  } catch (err) {
    console.error('❌ MongoDB Connection Error. Retrying in 5 seconds...', err.message);
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
