const express = require('express');
const axios = require('axios');
const { resolveModelV2Payload } = require('../services/datasetV2/modelV2Resolver');

const router = express.Router();

// POST /api/predict -> The ML Prediction Bridge endpoint (Supports V1 & V2)
router.post('/predict', async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Invalid payload format. Expected a JSON object.' });
    }

    // Check for direct V2 feature signature
    const hasV2Signature = (
      req.body.CpuNumberOfCores !== undefined ||
      req.body.GpuNumberOfShadingUnits !== undefined ||
      req.body.GpuFP32Performance !== undefined ||
      req.body.GameSetting_Ordinal !== undefined
    );

    // Determine target model version
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

    // ==============================================================
    // MODEL V2 FLOW
    // ==============================================================
    if (requestedVersion === 'v2') {
      const { valid, missingFields, v2Payload } = await resolveModelV2Payload(req.body);

      if (!valid) {
        return res.status(400).json({
          error: 'MODEL_V2_HARDWARE_DATA_INCOMPLETE',
          message: 'Required physical hardware specifications could not be resolved.',
          missingFields,
        });
      }

      console.log(`Sending Model V2 payload to Aura AI (${v2Payload.GameName}, Setting: ${v2Payload.GameSetting_Ordinal})...`);
      const auraResponse = await axios.post(`${pythonAiUrl}/predict`, v2Payload, { timeout: 10000 });
      return res.json(auraResponse.data);
    }

    // ==============================================================
    // MODEL V1 FLOW (ROLLBACK / LEGACY)
    // ==============================================================
    const { CPU } = req.body;
    if (!CPU && !req.body.CPU_Model && !req.body.CPU_Make) {
      return res.status(400).json({ error: 'CPU information is required for prediction.' });
    }

    console.log('Sending Model V1 payload to Aura AI...');
    const legacyPayload = { ...req.body, modelVersion: 'v1' };
    const auraResponse = await axios.post(`${pythonAiUrl}/predict`, legacyPayload, { timeout: 10000 });

    return res.json(auraResponse.data);
  } catch (error) {
    console.error('Have an Error with Aura AI!', error.message);
    if (error.response && error.response.data && error.response.data.error) {
      return res.status(error.response.status || 500).json(error.response.data);
    }
    return res.status(500).json({ error: 'Failed to get prediction!' });
  }
});

module.exports = router;

