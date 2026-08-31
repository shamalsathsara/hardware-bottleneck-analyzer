const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
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
    // Only allow alphanumeric characters, spaces, and basic punctuation
    const sanitize = (str) => String(str).replace(/[^a-zA-Z0-9\s\.\-]/g, '').trim().substring(0, 100);
    const safeCpu = sanitize(cpu);
    const safeGpu = sanitize(gpu);
    const safeRam = sanitize(ram);


    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is missing in .env!');
      return res.status(500).json({ error: 'Server configuration error (missing Gemini API key).' });
    }

    // Initialize the Gemini API client here so it always uses the latest .env
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    console.log(`Asking Gemini for prices -> CPU: ${safeCpu}, GPU: ${safeGpu}, RAM: ${safeRam}GB`);

    // We use the gemini-2.5-flash model as it's very fast for simple JSON responses
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // We give Gemini a very strict prompt so it ONLY returns JSON data
    // This allows our React frontend to read the numbers easily without parsing paragraphs of text.
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

    const result = await model.generateContent(prompt);
    let textResponse = result.response.text();
    
    // Clean up the response just in case Gemini accidentally includes markdown code blocks
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    const prices = JSON.parse(textResponse);

    console.log('Gemini pricing response:', prices);
    res.json(prices);

  } catch (err) {
    console.error('Error fetching dynamic prices from Gemini:', err);
    res.status(500).json({ error: 'Failed to estimate prices. The AI might be busy.' });
  }
});

module.exports = router;
