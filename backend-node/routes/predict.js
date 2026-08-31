const express = require('express');
const axios = require('axios');

const router = express.Router();

// POST /api/predict -> The ML Prediction Bridge endpoint
router.post('/predict', async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Invalid payload format. Expected a JSON object.' });
    }

    const { CPU } = req.body;
    if (!CPU && !req.body.CPU_Model && !req.body.CPU_Make) {
      return res.status(400).json({ error: 'CPU information is required for prediction.' });
    }

    console.log('Received Hardware Data from Frontend...');

    const pythonAiUrl = process.env.AURA_AI_URL || 'http://127.0.0.1:5000';
    const auraResponse = await axios.post(`${pythonAiUrl}/predict`, req.body, { timeout: 10000 });

    res.json(auraResponse.data);
  } catch (error) {
    console.error('Have an Error with Aura AI!', error.message);
    if (error.response && error.response.data && error.response.data.error) {
      return res.status(error.response.status || 500).json({ error: error.response.data.error });
    }
    res.status(500).json({ error: 'Failed to get prediction!' });
  }
});

module.exports = router;
