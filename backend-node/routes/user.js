const express = require('express');
const User = require('../models/User');
const requireAuth = require('../middleware/auth'); // Our security checkpoint

const router = express.Router();

// --------------------------------------------------------------------------
// GET ALL SAVED RIGS
// --------------------------------------------------------------------------
// Route: GET /api/user/rigs
// Purpose: Fetch the saved PC profiles for the currently logged-in user.
router.get('/rigs', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Read-time normalization: ensure all rigs have expected fields
    const normalizedRigs = (user.savedRigs || []).map((rig) => {
      const doc = rig.toObject ? rig.toObject() : rig;
      return {
        _id: doc._id,
        name: doc.name || 'Unnamed PC',
        cpu: doc.cpu || '',
        gpu: doc.gpu || '',
        ram: doc.ram || '16',
        resolution: doc.resolution || '1920x1080',
        settings: doc.settings || 'High',
        cpuHardwareId: doc.cpuHardwareId || null,
        gpuHardwareId: doc.gpuHardwareId || null,
        cpuDisplayName: doc.cpuDisplayName || doc.cpu || '',
        gpuDisplayName: doc.gpuDisplayName || doc.gpu || '',
        createdAt: doc.createdAt || new Date(),
      };
    });

    res.json(normalizedRigs);
  } catch (err) {
    console.error('Error fetching rigs:', err.message);
    res.status(500).json({ error: 'Server error. Could not load saved PCs.' });
  }
});

// --------------------------------------------------------------------------
// SAVE A NEW RIG
// --------------------------------------------------------------------------
// Route: POST /api/user/rigs
// Purpose: Add a new PC profile to the user's saved list.
router.post('/rigs', requireAuth, async (req, res) => {
  try {
    const { 
      name, 
      cpu, 
      gpu, 
      ram, 
      resolution, 
      settings,
      cpuHardwareId,
      gpuHardwareId,
      cpuDisplayName,
      gpuDisplayName,
    } = req.body;

    // Basic validation
    if (!name || !cpu || !gpu || !ram || !resolution) {
      return res.status(400).json({ error: 'All fields (name, cpu, gpu, ram, resolution) are required to save a PC.' });
    }

    const cleanName = String(name).trim().substring(0, 80);
    const cleanCpu = String(cpu).trim().substring(0, 120);
    const cleanGpu = String(gpu).trim().substring(0, 120);
    const cleanRam = String(ram).trim().substring(0, 20);
    const cleanResolution = String(resolution).trim().substring(0, 30);
    const cleanSettings = settings ? String(settings).trim().substring(0, 20) : 'High';
    const cleanCpuId = cpuHardwareId ? String(cpuHardwareId).trim().substring(0, 100) : undefined;
    const cleanGpuId = gpuHardwareId ? String(gpuHardwareId).trim().substring(0, 100) : undefined;
    const cleanCpuDisplay = cpuDisplayName ? String(cpuDisplayName).trim().substring(0, 120) : undefined;
    const cleanGpuDisplay = gpuDisplayName ? String(gpuDisplayName).trim().substring(0, 120) : undefined;

    if (!cleanName || !cleanCpu || !cleanGpu) {
      return res.status(400).json({ error: 'Invalid component specifications provided.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Limit maximum saved rigs per user to protect database storage
    if (user.savedRigs && user.savedRigs.length >= 50) {
      return res.status(400).json({ error: 'Maximum limit of 50 saved PCs reached. Please delete an older rig first.' });
    }

    // Add the new rig to the list
    const newRig = { 
      name: cleanName, 
      cpu: cleanCpu, 
      gpu: cleanGpu, 
      ram: cleanRam, 
      resolution: cleanResolution,
      settings: cleanSettings,
      ...(cleanCpuId && { cpuHardwareId: cleanCpuId }),
      ...(cleanGpuId && { gpuHardwareId: cleanGpuId }),
      ...(cleanCpuDisplay && { cpuDisplayName: cleanCpuDisplay }),
      ...(cleanGpuDisplay && { gpuDisplayName: cleanGpuDisplay }),
    };
    user.savedRigs.push(newRig);
    
    await user.save();

    // Send back the newly updated list of rigs
    res.status(201).json(user.savedRigs);
  } catch (err) {
    console.error('Error saving rig:', err.message);
    res.status(500).json({ error: 'Server error. Could not save PC.' });
  }
});

// --------------------------------------------------------------------------
// DELETE A SAVED RIG
// --------------------------------------------------------------------------
// Route: DELETE /api/user/rigs/:rigId
// Purpose: Remove a saved PC profile from the user's account.
router.delete('/rigs/:rigId', requireAuth, async (req, res) => {
  try {
    const { rigId } = req.params;
    if (!rigId || typeof rigId !== 'string') {
      return res.status(400).json({ error: 'Invalid rig ID provided.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Filter out the rig with the matching ID
    // We use .toString() because MongoDB IDs are special objects
    user.savedRigs = user.savedRigs.filter(rig => rig._id && rig._id.toString() !== rigId);
    
    await user.save();

    // Send back the updated list of rigs
    res.json(user.savedRigs);
  } catch (err) {
    console.error('Error deleting rig:', err.message);
    res.status(500).json({ error: 'Server error. Could not delete PC.' });
  }
});

module.exports = router;
