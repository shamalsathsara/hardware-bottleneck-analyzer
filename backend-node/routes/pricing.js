const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const pricingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { error: 'Too many price estimation requests, please try again in a few minutes.' }
});

// POST /api/pricing/estimate
router.post('/estimate', pricingLimiter, async (req, res) => {
  try {
    const { cpu, gpu, ram } = req.body;

    if (!cpu || !gpu) {
      return res.status(400).json({ error: 'CPU and GPU are required to estimate price.' });
    }

    // Sanitize input strings
    const sanitize = (str) => String(str).replace(/[^a-zA-Z0-9\s\.\-]/g, '').trim().substring(0, 100);
    const safeCpu = sanitize(cpu);
    const safeGpu = sanitize(gpu);
    const safeRam = sanitize(ram);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is missing in .env');
      return res.status(500).json({ error: 'Server configuration error (missing Gemini API key).' });
    }

    const prompt = `You are a PC hardware pricing expert in Sri Lanka. Estimate the current average retail price in Sri Lankan Rupees (LKR) for the following components if they were bought today in Colombo:
    CPU: ${safeCpu}
    GPU: ${safeGpu}
    RAM: ${safeRam} GB DDR4/DDR5
    
    IMPORTANT: Return ONLY a valid JSON object with the following exact keys and integer values. Do not wrap it in markdown block quotes (no \`\`\`json). Just the raw JSON object.
    {
      "cpuPriceLkr": 120000,
      "gpuPriceLkr": 250000,
      "ramPriceLkr": 25000
    }`;

    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      { timeout: 15000 }
    );

    let textResponse = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Strip markdown formatting if returned
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    const prices = JSON.parse(textResponse);
    res.json(prices);

  } catch (err) {
    const isTimeout = err.code === 'ECONNABORTED' || (err.message || '').includes('timeout');
    const apiError = err?.response?.data?.error?.message || err.message;
    console.error('Gemini pricing error:', apiError);
    const userMsg = isTimeout
      ? 'Pricing request timed out.'
      : `Failed to estimate prices: ${apiError}`;
    res.status(500).json({ error: userMsg });
  }
});

module.exports = router;
