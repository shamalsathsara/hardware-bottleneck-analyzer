const express = require('express');
const axios   = require('axios');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Limit pricing queries to 20 per 10 minutes per IP
const pricingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { error: 'Too many price estimation requests, please try again in a few minutes.' }
});

// --------------------------------------------------------------------------
// DYNAMIC SRI LANKAN PRICING (VIA GEMINI AI)
// --------------------------------------------------------------------------
// Route: POST /api/pricing/estimate
// Purpose: Fetch real-time estimated Sri Lankan market prices for PC parts.
router.post('/estimate', pricingLimiter, async (req, res) => {
  try {
    const { cpu, gpu, ram } = req.body;

    if (!cpu || !gpu) {
      return res.status(400).json({ error: 'CPU and GPU are required to estimate price.' });
    }

    // Sanitize inputs to prevent LLM prompt injection
    const sanitize = (str) => String(str).replace(/[^a-zA-Z0-9\s\.\-]/g, '').trim().substring(0, 100);
    const safeCpu = sanitize(cpu);
    const safeGpu = sanitize(gpu);
    const safeRam = sanitize(ram);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is missing in .env!');
      return res.status(500).json({ error: 'Server configuration error (missing Gemini API key).' });
    }

    console.log(`Asking Gemini for prices -> CPU: ${safeCpu}, GPU: ${safeGpu}, RAM: ${safeRam}GB`);

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

    // Use gemini-3.1-flash-lite as it is the most stable/available free-tier model right now
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      { timeout: 15000 }
    );

    let textResponse = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Clean up markdown code fences if Gemini accidentally adds them
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    const prices = JSON.parse(textResponse);

    console.log('Gemini pricing response:', prices);
    res.json(prices);

  } catch (err) {
    const isTimeout = err.code === 'ECONNABORTED' || (err.message || '').includes('timeout');
    const apiError  = err?.response?.data?.error?.message || err.message;
    console.error('Error fetching dynamic prices from Gemini:', apiError);
    const userMsg = isTimeout
      ? 'Request timed out — your GEMINI_API_KEY may be invalid. Get a valid key from aistudio.google.com/apikey (it should start with AIza).'
      : `Failed to estimate prices: ${apiError}`;
    res.status(500).json({ error: userMsg });
  }
});

module.exports = router;
