const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();

const MAX_RIGS = 50;

const clean = (value, max) => (value === undefined || value === null ? '' : String(value).trim().slice(0, max));

function normalizeRig(rig) {
  const doc = rig && typeof rig.toObject === 'function' ? rig.toObject() : rig;
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
    createdAt: doc.createdAt || null,
  };
}

const rigsResponse = (user) => (user.savedRigs || []).map(normalizeRig);

router.use(requireAuth);

// GET /api/user/rigs
router.get('/rigs', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('savedRigs').lean();
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json(rigsResponse(user));
  } catch (err) {
    console.error('Error fetching rigs:', err.message);
    return res.status(500).json({ error: 'Server error. Could not load saved PCs.' });
  }
});

// POST /api/user/rigs
router.post('/rigs', async (req, res) => {
  try {
    const body = req.body || {};
    const rig = {
      name: clean(body.name, 80),
      cpu: clean(body.cpu, 120),
      gpu: clean(body.gpu, 120),
      ram: clean(body.ram, 20),
      resolution: clean(body.resolution, 30),
      settings: clean(body.settings, 20) || 'High',
      cpuHardwareId: clean(body.cpuHardwareId, 100) || undefined,
      gpuHardwareId: clean(body.gpuHardwareId, 100) || undefined,
      cpuDisplayName: clean(body.cpuDisplayName, 120) || undefined,
      gpuDisplayName: clean(body.gpuDisplayName, 120) || undefined,
    };

    if (!rig.name || !rig.cpu || !rig.gpu || !rig.ram || !rig.resolution) {
      return res.status(400).json({ error: 'All fields (name, cpu, gpu, ram, resolution) are required to save a PC.' });
    }

    // Atomic push guarded by the rig cap (index MAX_RIGS-1 must not exist yet).
    const updated = await User.findOneAndUpdate(
      { _id: req.user.id, [`savedRigs.${MAX_RIGS - 1}`]: { $exists: false } },
      { $push: { savedRigs: rig } },
      { returnDocument: 'after', projection: { savedRigs: 1 }, runValidators: true }
    ).lean();

    if (!updated) {
      const exists = await User.exists({ _id: req.user.id });
      return exists
        ? res.status(400).json({ error: `Maximum limit of ${MAX_RIGS} saved PCs reached. Please delete an older rig first.` })
        : res.status(404).json({ error: 'User not found.' });
    }

    return res.status(201).json(rigsResponse(updated));
  } catch (err) {
    console.error('Error saving rig:', err.message);
    return res.status(500).json({ error: 'Server error. Could not save PC.' });
  }
});

// DELETE /api/user/rigs/:rigId
router.delete('/rigs/:rigId', async (req, res) => {
  try {
    const { rigId } = req.params;
    if (!mongoose.isValidObjectId(rigId)) {
      return res.status(400).json({ error: 'Invalid rig ID provided.' });
    }

    const updated = await User.findOneAndUpdate(
      { _id: req.user.id, 'savedRigs._id': rigId },
      { $pull: { savedRigs: { _id: rigId } } },
      { returnDocument: 'after', projection: { savedRigs: 1 } }
    ).lean();

    if (!updated) return res.status(404).json({ error: 'Saved PC not found.' });
    return res.json(rigsResponse(updated));
  } catch (err) {
    console.error('Error deleting rig:', err.message);
    return res.status(500).json({ error: 'Server error. Could not delete PC.' });
  }
});

module.exports = router;
