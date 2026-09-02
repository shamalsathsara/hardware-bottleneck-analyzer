const express = require('express');
const GameBenchmark = require('../models/GameBenchmark');

const router = express.Router();

/**
 * GET /api/benchmarks/:benchmarkId
 * Retrieve a specific benchmark observation by immutable benchmarkId.
 */
router.get('/:benchmarkId', async (req, res) => {
  try {
    const { benchmarkId } = req.params;
    if (!benchmarkId || !benchmarkId.startsWith('bm_')) {
      return res.status(400).json({ error: 'Invalid benchmarkId format.' });
    }

    const benchmark = await GameBenchmark.findOne({ benchmarkId }).lean();
    if (!benchmark) {
      return res.status(404).json({ error: 'Benchmark observation not found.' });
    }

    res.json(benchmark);
  } catch (err) {
    console.error('Error fetching benchmark:', err.message);
    res.status(500).json({ error: 'Failed to retrieve benchmark observation.' });
  }
});

/**
 * GET /api/benchmarks/game/:slug
 * Retrieve bounded paginated benchmarks for a canonical game slug.
 */
router.get('/game/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const cleanSlug = String(slug || '').trim().toLowerCase();

    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);

    const filter = { gameSlug: cleanSlug };
    if (req.query.resolution) {
      filter['display.label'] = req.query.resolution;
    }
    if (req.query.preset) {
      filter['graphics.normalizedPreset'] = req.query.preset;
    }
    if (req.query.trainingOnly === 'true') {
      filter.trainingEligible = true;
    }

    const [benchmarks, total] = await Promise.all([
      GameBenchmark.find(filter)
        .sort({ 'performance.avgFps': -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      GameBenchmark.countDocuments(filter),
    ]);

    res.json({
      gameSlug: cleanSlug,
      total,
      limit,
      skip,
      benchmarks,
    });
  } catch (err) {
    console.error('Error fetching game benchmarks:', err.message);
    res.status(500).json({ error: 'Failed to retrieve game benchmarks.' });
  }
});

module.exports = router;
