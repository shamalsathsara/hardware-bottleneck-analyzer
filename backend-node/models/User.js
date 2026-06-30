

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // The user's display name
    username:     { type: String, required: true, trim: true },
    
    // The user's email (must be unique so no two people can have the same account)
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    
    // The encrypted version of their password (never store real passwords!)
    passwordHash: { type: String, required: true },
    
   
    // PASSWORD RECOVERY FIELDS

    // When a user forgets their password, we generate a random 6-digit number 
    // and save it here so we can check it later when they type it in.
    resetCode:        { type: String },
    
    // We also save the exact time the code should expire (15 minutes from creation).
    // If they try to use the code after this time, the system will reject it.
    resetCodeExpires: { type: Date },

    // --------------------------------------------------------------------------
    // SAVED HARDWARE PROFILES ("MY RIGS")
    // --------------------------------------------------------------------------
    // This allows the user to save different PC setups so they don't have to 
    // re-enter them manually every time they visit the site.
    savedRigs: [
      {
        name:       { type: String, required: true }, // e.g., "My Gaming PC" or "Living Room Build"
        cpu:        { type: String, required: true },
        gpu:        { type: String, required: true },
        ram:        { type: String, required: true },
        resolution: { type: String, required: true },
        // We save the exact date they added this rig to their profile
        createdAt:  { type: Date, default: Date.now }
      }
    ]
  },
  // Automatically adds "createdAt" and "updatedAt" timestamps to every user
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
