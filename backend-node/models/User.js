// --------------------------------------------------------------------------
// USER DATABASE MODEL
// --------------------------------------------------------------------------
// This file defines the "blueprint" (Schema) for what a User looks like
// in our MongoDB database. 

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // The user's display name
    username:     { type: String, required: true, trim: true },
    
    // The user's email (must be unique so no two people can have the same account)
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    
    // The encrypted version of their password (never store real passwords!)
    passwordHash: { type: String, required: true },
  },
  // Automatically adds "createdAt" and "updatedAt" timestamps to every user
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
