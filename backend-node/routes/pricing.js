const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const router = express.Router();

const pricingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many price estimation requests, please try again in a few minutes.' },
});

const PRICE_KEYS = ['cpuPriceLkr', 'gpuPriceLkr', 'ramPriceLkr'];
const MAX_PRICE_LKR = 50_000_000;

const sanitize = (value) => String(value ?? '').replace(/[^a-zA-Z0-9\s.\-]/g, '').trim().slice(0, 100);

/** Extracts and validates the price object from the model's text output. */
function parsePrices(text) {
  const json = String(text).replace(/```(?:json)?/g, '').trim();
  const start = json.indexOf('{');
  const end = json.lastIndexOf('}');
  if (start === -1 || end <= start) return null;

  let parsed;
  try {
    parsed = JSON.parse(json.slice(start, end + 1));
  } catch (_) {
    return null;
  }

  const prices = {};
  for (const key of PRICE_KEYS) {
    const n = Number(String(parsed?.[key] ?? '').replace(/[,\s]/g, ''));
    if (!Number.isFinite(n) || n <= 0 || n > MAX_PRICE_LKR) return null;
    prices[key] = Math.round(n);
  }
  return prices;
}

// POST /api/pricing/estimate
router.post('/estimate', pricingLimiter, async (req, res) => {
  const body = req.body || {};
  const cpu = sanitize(body.cpu);
  const gpu = sanitize(body.gpu);
  const ram = sanitize(body.ram) || '16';

  if (!cpu || !gpu) {
    return res.status(400).json({ error: 'CPU and GPU are required to estimate price.' });
  }
  if (!config.geminiApiKey) {
    console.error('GEMINI_API_KEY is not configured.');
    return res.status(503).json({ error: 'Price estimation is currently unavailable.' });
  }

  const prompt = `You are a PC hardware pricing expert in Sri Lanka. Estimate the current average retail price in Sri Lankan Rupees (LKR) for the following components if they were bought today in Colombo:
    CPU: ${cpu}
    GPU: ${gpu}
    RAM: ${ram} GB DDR4/DDR5

    IMPORTANT: Return ONLY a valid JSON object with the following exact keys and integer values. Do not wrap it in markdown.
    {
      "cpuPriceLkr": 120000,
      "gpuPriceLkr": 250000,
      "ramPriceLkr": 25000
    }`;

  try {
    const { data } = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.geminiModel)}:generateContent`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { timeout: 20000, headers: { 'x-goog-api-key': config.geminiApiKey } }
    );

    const prices = parsePrices(data?.candidates?.[0]?.content?.parts?.[0]?.text || '');
    if (!prices) {
      console.error('Gemini pricing: unexpected response format.');
      return res.status(502).json({ error: 'Could not estimate prices right now. Please try again.' });
    }
    return res.json(prices);
  } catch (err) {
    const timedOut = err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT';
    console.error('Gemini pricing error:', err.response?.data?.error?.message || err.message);
    return res.status(timedOut ? 504 : 502).json({
      error: timedOut ? 'Pricing request timed out.' : 'Could not estimate prices right now. Please try again.',
    });
  }
});

module.exports = router;
module.exports.parsePrices = parsePrices;
