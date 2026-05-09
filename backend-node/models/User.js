// User Model — Project Aura Auth
//Defines the MongoDB database structure for user accounts. 

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username:     { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
