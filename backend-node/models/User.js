const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    contact: { type: String, trim: true },
    passwordHash: { type: String, required: true },

    resetCode: { type: String },
    resetCodeExpires: { type: Date },

    savedRigs: [
      {
        name: { type: String, required: true },
        cpu: { type: String, required: true },
        gpu: { type: String, required: true },
        ram: { type: String, required: true },
        resolution: { type: String, required: true },
        settings: { type: String, default: 'High' },
        cpuHardwareId: { type: String, trim: true },
        gpuHardwareId: { type: String, trim: true },
        cpuDisplayName: { type: String, trim: true },
        gpuDisplayName: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
