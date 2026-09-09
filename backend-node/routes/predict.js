const express = require('express');
const axios = require('axios');
const { resolveModelV2Payload } = require('../services/datasetV2/modelV2Resolver');

const router = express.Router();

// POST /api/predict
router.post('/predict', async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Invalid payload format. Expected a JSON object.' });
    }

    const hasV2Signature = (
      req.body.CpuNumberOfCores !== undefined ||
      req.body.GpuNumberOfShadingUnits !== undefined ||
      req.body.GpuFP32Performance !== undefined ||
      req.body.GameSetting_Ordinal !== undefined
    );

    let requestedVersion = (
      req.body.modelVersion ||
      req.query.modelVersion ||
      req.headers['x-model-version']
    );

    if (!requestedVersion) {
      if (hasV2Signature) {
        requestedVersion = 'v2';
      } else if (process.env.MODEL_VERSION) {
        requestedVersion = process.env.MODEL_VERSION;
      } else if (req.body.CPU_Make || req.body.GPU_Make || req.body['CPU Cores']) {
        requestedVersion = 'v1';
      } else {
        requestedVersion = 'v2';
      }
    }

    requestedVersion = requestedVersion.toString().toLowerCase().trim();

    const pythonAiUrl = process.env.AURA_AI_URL || 'http://127.0.0.1:5000';

    // Model V2: Physical specifications pipeline
    if (requestedVersion === 'v2') {
      const { valid, missingFields, v2Payload } = await resolveModelV2Payload(req.body);

      if (!valid) {
        return res.status(400).json({
          error: 'MODEL_V2_HARDWARE_DATA_INCOMPLETE',
          message: 'Required physical hardware specifications could not be resolved.',
          missingFields,
        });
      }

      const auraResponse = await axios.post(`${pythonAiUrl}/predict`, v2Payload, { timeout: 10000 });
      return res.json(auraResponse.data);
    }

    // Model V1: Legacy categorical rollback
    const { CPU } = req.body;
    if (!CPU && !req.body.CPU_Model && !req.body.CPU_Make) {
      return res.status(400).json({ error: 'CPU information is required for prediction.' });
    }

    const legacyPayload = { ...req.body, modelVersion: 'v1' };
    const auraResponse = await axios.post(`${pythonAiUrl}/predict`, legacyPayload, { timeout: 10000 });

    return res.json(auraResponse.data);
  } catch (error) {
    console.error('Prediction proxy error:', error.message);
    if (error.response && error.response.data && error.response.data.error) {
      return res.status(error.response.status || 500).json(error.response.data);
    }
    return res.status(500).json({ error: 'Failed to get prediction!' });
  }
});

module.exports = router;
