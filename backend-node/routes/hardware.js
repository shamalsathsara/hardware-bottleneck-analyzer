const express = require('express');
const { CPU, GPU } = require('../models/Hardware');
const { searchUnifiedCpus, searchUnifiedGpus } = require('../services/hardware/hardwareSearchService');

const router = express.Router();

// 1. GET /api/cpus/search -> Searches CPUs by name (Unified Hardware Master + Legacy with Master priority)
router.get('/cpus/search', async (req, res) => {
  try {
    const searchQuery = (req.query.q || '').trim();
    const limit = req.query.limit;
    const cpus = await searchUnifiedCpus(searchQuery, { limit });
    res.json(cpus);
  } catch (error) {
    console.error('CPU search error:', error.message);
    res.status(500).json({ error: 'Failed to fetch CPUs' });
  }
});

// 2. GET /api/gpus/search -> Searches GPUs by name (Unified Hardware Master + Legacy with Master priority)
router.get('/gpus/search', async (req, res) => {
  try {
    const searchQuery = (req.query.q || '').trim();
    const limit = req.query.limit;
    const gpus = await searchUnifiedGpus(searchQuery, { limit });
    res.json(gpus);
  } catch (error) {
    console.error('GPU search error:', error.message);
    res.status(500).json({ error: 'Failed to fetch GPUs' });
  }
});

// 3. GET /api/hardware/stats -> Returns the maximum performance scores to allow dynamic tiering
router.get('/hardware/stats', async (req, res) => {
  try {
    const topCpu = await CPU.findOne().sort({ cpuMark: -1 }).select('cpuMark').lean();
    const topGpu = await GPU.findOne().sort({ CUDA: -1 }).select('CUDA').lean();

    res.json({
      maxCpuMark: topCpu ? topCpu.cpuMark : 100000,
      maxGpuCuda: topGpu ? topGpu.CUDA : 500000,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hardware stats' });
  }
});

// 4. GET /api/cpus/all-lightweight (and alias /api/cpus)
router.get(['/cpus/all-lightweight', '/cpus'], async (req, res) => {
  try {
    const cpus = await CPU.find().select('cpuName cpuMark cores').sort({ cpuName: 1 }).lean();
    res.json(cpus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch CPUs' });
  }
});

// 5. GET /api/gpus/all-lightweight (and alias /api/gpus)
router.get(['/gpus/all-lightweight', '/gpus'], async (req, res) => {
  try {
    const gpus = await GPU.find().select('Device CUDA').sort({ Device: 1 }).lean();
    res.json(gpus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch GPUs' });
  }
});

module.exports = router;
