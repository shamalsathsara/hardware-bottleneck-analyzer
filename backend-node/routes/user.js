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
    // req.user.id comes from our authentication middleware!
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Send back the array of saved rigs
    res.json(user.savedRigs);
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
    const { name, cpu, gpu, ram, resolution } = req.body;

    // Basic validation
    if (!name || !cpu || !gpu || !ram || !resolution) {
      return res.status(400).json({ error: 'All fields (name, cpu, gpu, ram, resolution) are required to save a PC.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Add the new rig to the list
    const newRig = { name, cpu, gpu, ram, resolution };
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

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Filter out the rig with the matching ID
    // We use .toString() because MongoDB IDs are special objects
    user.savedRigs = user.savedRigs.filter(rig => rig._id.toString() !== rigId);
    
    await user.save();

    // Send back the updated list of rigs
    res.json(user.savedRigs);
  } catch (err) {
    console.error('Error deleting rig:', err.message);
    res.status(500).json({ error: 'Server error. Could not delete PC.' });
  }
});

module.exports = router;
