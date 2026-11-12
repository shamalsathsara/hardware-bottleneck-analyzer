/**
 * Centralised, validated environment configuration.
 * The process refuses to start if a required secret is missing, so the API can
 * never run with a guessable JWT secret.
 */
require('dotenv').config();

const SUPPORTED_MODEL_VERSIONS = ['v1', 'v2'];

function list(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function loadConfig(env = process.env) {
  const errors = [];
  const nodeEnv = env.NODE_ENV || 'development';

  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be set and at least 32 characters long.');
  }
  if (!env.MONGO_URI) {
    errors.push('MONGO_URI must be set.');
  }

  const modelVersion = (env.MODEL_VERSION || 'v2').trim().toLowerCase();
  if (!SUPPORTED_MODEL_VERSIONS.includes(modelVersion)) {
    errors.push(`MODEL_VERSION must be one of ${SUPPORTED_MODEL_VERSIONS.join(', ')}.`);
  }

  const corsOrigins = list(env.CORS_ORIGINS);
  if (nodeEnv === 'production' && corsOrigins.length === 0) {
    errors.push('CORS_ORIGINS must list the allowed frontend origin(s) in production.');
  }

  if (errors.length) {
    throw new Error(`Invalid environment configuration:\n - ${errors.join('\n - ')}`);
  }

  return Object.freeze({
    nodeEnv,
    isProduction: nodeEnv === 'production',
    port: Number(env.PORT) || 4000,
    mongoUri: env.MONGO_URI,
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN || '7d',
    aiUrl: (env.AURA_AI_URL || 'http://127.0.0.1:5000').replace(/\/+$/, ''),
    aiTimeoutMs: Number(env.AURA_AI_TIMEOUT_MS) || 10000,
    modelVersion,
    // Empty list in development = allow any origin.
    corsOrigins,
    trustProxy: env.TRUST_PROXY === undefined ? 1 : Number(env.TRUST_PROXY),
    geminiApiKey: env.GEMINI_API_KEY || '',
    geminiModel: env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
    emailUser: env.EMAIL_USER || '',
    emailPass: env.EMAIL_PASS || '',
  });
}

module.exports = Object.freeze({ ...loadConfig(), loadConfig });
