const express = require('express');
const Game = require('../models/Game');
const escapeRegex = require('../utils/escapeRegex');

const router = express.Router();

// 1. GET /api/games/search?q= -> Fast autocomplete search
router.get('/search', async (req, res) => {
  try {
    const rawQuery = (req.query.q || '').trim();
    if (!rawQuery) {
      return res.json([]);
    }

    if (rawQuery.length > 80) {
      return res.status(400).json({ error: 'Search query exceeds maximum length of 80 characters.' });
    }

    const safeQuery = escapeRegex(rawQuery);
    const regex = new RegExp(safeQuery, 'i');

    const games = await Game.find({
      $or: [
        { name: { $regex: regex } },
        { alternateNames: { $regex: regex } },
        { slug: { $regex: regex } },
      ],
    })
      .select('name slug releaseYear genres dataQuality thumbnailUrl developer publisher')
      .sort({ name: 1 })
      .limit(10)
      .lean();

    res.json(games);
  } catch (error) {
    console.error('Game search error:', error.message);
    res.status(500).json({ error: 'Failed to search games' });
  }
});

// 2. GET /api/games/:slug -> Retrieve detailed single game
router.get('/:slug', async (req, res) => {
  try {
    const slug = String(req.params.slug || '').trim().toLowerCase();
    if (!slug) {
      return res.status(400).json({ error: 'Invalid game slug.' });
    }

    const game = await Game.findOne({ slug }).lean();
    if (!game) {
      return res.status(404).json({ error: `Game "${slug}" not found.` });
    }

    res.json(game);
  } catch (error) {
    console.error('Game detail error:', error.message);
    res.status(500).json({ error: 'Failed to fetch game details' });
  }
});

// 3. GET /api/games -> Paginated game catalog
router.get('/', async (req, res) => {
  try {
    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 12;
    if (limit > 48) limit = 48;

    const filter = {};

    // Optional genre filter
    if (req.query.genre && req.query.genre.trim()) {
      filter.genres = { $regex: new RegExp(`^${escapeRegex(req.query.genre.trim())}$`, 'i') };
    }

    // Optional general text search filter
    if (req.query.search && req.query.search.trim()) {
      const safeSearch = escapeRegex(req.query.search.trim());
      const regex = new RegExp(safeSearch, 'i');
      filter.$or = [
        { name: { $regex: regex } },
        { alternateNames: { $regex: regex } },
      ];
    }

    const skip = (page - 1) * limit;

    const [games, total] = await Promise.all([
      Game.find(filter)
        .select('name slug developer publisher releaseYear genres platforms performanceProfile.rayTracingSupported performanceProfile.dlssSupported performanceProfile.fsrSupported dataQuality')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Game.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit) || 1;

    res.json({
      games,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error('Games catalog error:', error.message);
    res.status(500).json({ error: 'Failed to fetch games catalog' });
  }
});

module.exports = router;
