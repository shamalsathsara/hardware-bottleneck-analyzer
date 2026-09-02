const express = require('express');
const HardwareCpu = require('../models/HardwareCpu');
const HardwareGpu = require('../models/HardwareGpu');
const escapeRegex = require('../utils/escapeRegex');

const router = express.Router();

/**
 * Helper to parse bounded limit from query.
 */
function getBoundedLimit(queryLimit, defaultLimit = 20, maxLimit = 50) {
  const parsed = parseInt(queryLimit, 10);
  if (isNaN(parsed) || parsed <= 0) return defaultLimit;
  return Math.min(parsed, maxLimit);
}

// ----------------------------------------------------------------------------
// 1. GET /api/hardware/cpus/search
// ----------------------------------------------------------------------------
router.get('/cpus/search', async (req, res) => {
  try {
    const rawQuery = (req.query.q || '').trim();
    const segment = (req.query.segment || '').trim().toLowerCase();
    const limit = getBoundedLimit(req.query.limit, 20, 50);

    const filter = {};
    if (segment && ['desktop', 'mobile', 'workstation', 'server'].includes(segment)) {
      filter.marketSegment = segment;
    }

    if (rawQuery) {
      const safeQuery = escapeRegex(rawQuery);
      filter.$or = [
        { canonicalName: { $regex: safeQuery, $options: 'i' } },
        { aliases: { $regex: `^${safeQuery}`, $options: 'i' } },
        { aliases: { $regex: safeQuery, $options: 'i' } },
      ];
    }

    const cpus = await HardwareCpu.find(filter)
      .select('hardwareId canonicalName slug manufacturer family releaseYear cores threads clocks power marketSegment quality')
      .sort({ canonicalName: 1 })
      .limit(limit)
      .lean();

    res.json({
      count: cpus.length,
      data: cpus,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search CPUs' });
  }
});

// ----------------------------------------------------------------------------
// 2. GET /api/hardware/gpus/search
// ----------------------------------------------------------------------------
router.get('/gpus/search', async (req, res) => {
  try {
    const rawQuery = (req.query.q || '').trim();
    const segment = (req.query.segment || '').trim().toLowerCase();
    const limit = getBoundedLimit(req.query.limit, 20, 50);

    const filter = {};
    if (segment && ['desktop', 'laptop', 'workstation'].includes(segment)) {
      filter.marketSegment = segment;
    }

    if (rawQuery) {
      const safeQuery = escapeRegex(rawQuery);
      filter.$or = [
        { canonicalName: { $regex: safeQuery, $options: 'i' } },
        { aliases: { $regex: `^${safeQuery}`, $options: 'i' } },
        { aliases: { $regex: safeQuery, $options: 'i' } },
      ];
    }

    const gpus = await HardwareGpu.find(filter)
      .select('hardwareId canonicalName slug manufacturer family releaseYear memory power features marketSegment quality')
      .sort({ canonicalName: 1 })
      .limit(limit)
      .lean();

    res.json({
      count: gpus.length,
      data: gpus,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search GPUs' });
  }
});

// ----------------------------------------------------------------------------
// 3. GET /api/hardware/cpus/summary
// ----------------------------------------------------------------------------
router.get('/cpus/summary', async (req, res) => {
  try {
    const cpus = await HardwareCpu.find()
      .select('hardwareId canonicalName slug manufacturer family releaseYear cores threads marketSegment quality.mlReady')
      .sort({ canonicalName: 1 })
      .lean();

    res.json({
      count: cpus.length,
      data: cpus,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch CPU summary' });
  }
});

// ----------------------------------------------------------------------------
// 4. GET /api/hardware/gpus/summary
// ----------------------------------------------------------------------------
router.get('/gpus/summary', async (req, res) => {
  try {
    const gpus = await HardwareGpu.find()
      .select('hardwareId canonicalName slug manufacturer family releaseYear memory.vramGB power.defaultTgpWatts marketSegment quality.mlReady')
      .sort({ canonicalName: 1 })
      .lean();

    res.json({
      count: gpus.length,
      data: gpus,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch GPU summary' });
  }
});

// ----------------------------------------------------------------------------
// 5. GET /api/hardware/cpus/:slug
// ----------------------------------------------------------------------------
router.get('/cpus/:slug', async (req, res) => {
  try {
    const slug = (req.params.slug || '').trim().toLowerCase();
    const cpu = await HardwareCpu.findOne({ slug }).lean();

    if (!cpu) {
      return res.status(404).json({ error: 'CPU not found' });
    }

    res.json(cpu);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch CPU details' });
  }
});

// ----------------------------------------------------------------------------
// 6. GET /api/hardware/gpus/:slug
// ----------------------------------------------------------------------------
router.get('/gpus/:slug', async (req, res) => {
  try {
    const slug = (req.params.slug || '').trim().toLowerCase();
    const gpu = await HardwareGpu.findOne({ slug }).lean();

    if (!gpu) {
      return res.status(404).json({ error: 'GPU not found' });
    }

    res.json(gpu);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch GPU details' });
  }
});

// ----------------------------------------------------------------------------
// 7. GET /api/hardware/stats (with legacy compatibility)
// ----------------------------------------------------------------------------
const { CPU, GPU } = require('../models/Hardware');

router.get('/stats', async (req, res) => {
  try {
    const totalCpus = await HardwareCpu.countDocuments();
    const totalGpus = await HardwareGpu.countDocuments();
    const verifiedSpecsCpus = await HardwareCpu.countDocuments({ 'quality.specQuality': 'verified' });
    const verifiedSpecsGpus = await HardwareGpu.countDocuments({ 'quality.specQuality': 'verified' });
    const mlReadyCpus = await HardwareCpu.countDocuments({ 'quality.mlReady': true });
    const mlReadyGpus = await HardwareGpu.countDocuments({ 'quality.mlReady': true });

    const topCpu = await CPU.findOne().sort({ cpuMark: -1 }).select('cpuMark').lean();
    const topGpu = await GPU.findOne().sort({ CUDA: -1 }).select('CUDA').lean();

    res.json({
      maxCpuMark: topCpu ? topCpu.cpuMark : 100000,
      maxGpuCuda: topGpu ? topGpu.CUDA : 500000,
      cpus: {
        total: totalCpus,
        verifiedSpecs: verifiedSpecsCpus,
        mlReady: mlReadyCpus,
      },
      gpus: {
        total: totalGpus,
        verifiedSpecs: verifiedSpecsGpus,
        mlReady: mlReadyGpus,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hardware stats' });
  }
});

module.exports = router;
