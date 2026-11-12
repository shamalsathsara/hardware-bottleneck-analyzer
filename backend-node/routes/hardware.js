const express = require('express');
const { CPU, GPU } = require('../models/Hardware');
const { searchUnifiedCpus, searchUnifiedGpus, MAX_QUERY_LENGTH } = require('../services/hardware/hardwareSearchService');

const router = express.Router();

function readQuery(req, res) {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q.length > MAX_QUERY_LENGTH) {
    res.status(400).json({ error: `Search query exceeds ${MAX_QUERY_LENGTH} characters.` });
    return null;
  }
  return q;
}

// GET /api/cpus/search -> unified Hardware Master + legacy CPU search
router.get('/cpus/search', async (req, res) => {
  const q = readQuery(req, res);
  if (q === null) return undefined;
  try {
    return res.json(await searchUnifiedCpus(q, { limit: req.query.limit }));
  } catch (error) {
    console.error('CPU search error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch CPUs' });
  }
});

// GET /api/gpus/search -> unified Hardware Master + legacy GPU search
router.get('/gpus/search', async (req, res) => {
  const q = readQuery(req, res);
  if (q === null) return undefined;
  try {
    return res.json(await searchUnifiedGpus(q, { limit: req.query.limit }));
  } catch (error) {
    console.error('GPU search error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch GPUs' });
  }
});

// GET /api/cpus/all-lightweight (alias /api/cpus) -> compact list used for upgrade suggestions
router.get(['/cpus/all-lightweight', '/cpus'], async (req, res) => {
  try {
    const cpus = await CPU.find().select('cpuName cpuMark cores').sort({ cpuName: 1 }).lean();
    return res.json(cpus);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch CPUs' });
  }
});

// GET /api/gpus/all-lightweight (alias /api/gpus)
router.get(['/gpus/all-lightweight', '/gpus'], async (req, res) => {
  try {
    const gpus = await GPU.find().select('Device CUDA').sort({ Device: 1 }).lean();
    return res.json(gpus);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch GPUs' });
  }
});

module.exports = router;
