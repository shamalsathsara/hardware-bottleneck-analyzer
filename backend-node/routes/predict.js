const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const config = require('../config/env');
const { resolveModelV2Payload } = require('../services/datasetV2/modelV2Resolver');

const router = express.Router();

const predictLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'RATE_LIMITED', message: 'Too many prediction requests, please slow down.' },
});

// Only these fields are forwarded to the legacy V1 model.
const V1_FIELDS = [
  'CPU', 'CPU Cores', 'CPU Threads', 'CPU TDP (W)',
  'GPU', 'GPU Series', 'GPU VRAM (GB)', 'GPU Bandwidth (GB/s)', 'GPU TDP (W)',
  'RAM (GB)', 'Resolution', 'Graphics Settings',
];

function pick(obj, keys) {
  const out = {};
  for (const key of keys) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}

async function buildPayload(body) {
  if (config.modelVersion === 'v1') {
    const payload = pick(body, V1_FIELDS);
    if (!payload.CPU && !payload.GPU) {
      return { status: 400, body: { error: 'HARDWARE_REQUIRED', message: 'CPU or GPU information is required.' } };
    }
    return { payload };
  }

  const { unsupportedPreset, missingFields, v2Payload, valid } = await resolveModelV2Payload(body);
  if (unsupportedPreset) {
    return {
      status: 400,
      body: {
        error: 'UNSUPPORTED_PRESET',
        message: 'FPS prediction is only available for the Medium and Ultra presets.',
        supportedPresets: ['Medium', 'Ultra'],
      },
    };
  }
  if (!valid) {
    return {
      status: 400,
      body: {
        error: 'MODEL_V2_HARDWARE_DATA_INCOMPLETE',
        message: 'Required physical hardware specifications could not be resolved.',
        missingFields,
      },
    };
  }
  return { payload: v2Payload };
}

// POST /api/predict — model version is chosen by the server (MODEL_VERSION), never by the client.
router.post('/predict', predictLimiter, async (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Expected a JSON object.' });
  }

  let built;
  try {
    built = await buildPayload(req.body);
  } catch (err) {
    return next(err); // database failure while resolving hardware -> 500
  }
  if (!built.payload) return res.status(built.status).json(built.body);

  try {
    const { data } = await axios.post(`${config.aiUrl}/predict`, built.payload, { timeout: config.aiTimeoutMs });
    return res.json(data);
  } catch (error) {
    const upstream = error.response;
    if (upstream && upstream.status >= 400 && upstream.status < 500) {
      return res.status(upstream.status).json(upstream.data);
    }

    const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
    console.error('Prediction service error:', upstream ? `HTTP ${upstream.status}` : error.code || error.message);
    return res.status(timedOut ? 504 : 503).json({
      error: 'AI_SERVICE_UNAVAILABLE',
      message: 'The prediction service is temporarily unavailable. Please try again shortly.',
    });
  }
});

module.exports = router;
