const mongoose = require('mongoose');
const Game = require('../../models/Game');
const HardwareCpu = require('../../models/HardwareCpu');
const HardwareGpu = require('../../models/HardwareGpu');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Resolves a human-friendly string or ID into a definitive canonical Game record.
 *
 * @param {string} input Game name, slug, or MongoDB ObjectId
 * @returns {Promise<{ resolved: Object|null, errorCode: string|null, reason: string|null }>}
 */
async function resolveCanonicalGame(input) {
  if (!input || typeof input !== 'string' || !input.trim()) {
    return {
      resolved: null,
      errorCode: 'MISSING_GAME',
      reason: 'Game identifier is required.',
    };
  }

  const clean = input.trim();

  // 1. Direct MongoDB ObjectId match
  if (mongoose.Types.ObjectId.isValid(clean)) {
    const docById = await Game.findById(clean).lean();
    if (docById) {
      return { resolved: docById, errorCode: null, reason: null };
    }
  }

  // 2. Exact slug match
  const docBySlug = await Game.findOne({ slug: clean.toLowerCase() }).lean();
  if (docBySlug) {
    return { resolved: docBySlug, errorCode: null, reason: null };
  }

  // 3. Exact case-insensitive name match
  const matchesByName = await Game.find({
    name: new RegExp(`^${escapeRegex(clean)}$`, 'i'),
  }).lean();

  if (matchesByName.length === 1) {
    return { resolved: matchesByName[0], errorCode: null, reason: null };
  }
  if (matchesByName.length > 1) {
    return {
      resolved: null,
      errorCode: 'GAME_AMBIGUOUS',
      reason: `Game "${clean}" matched multiple catalog entries (${matchesByName.length}). Specify gameSlug or gameId.`,
    };
  }

  // 4. Exact case-insensitive alternateNames match
  const matchesByAlt = await Game.find({
    alternateNames: new RegExp(`^${escapeRegex(clean)}$`, 'i'),
  }).lean();

  if (matchesByAlt.length === 1) {
    return { resolved: matchesByAlt[0], errorCode: null, reason: null };
  }
  if (matchesByAlt.length > 1) {
    return {
      resolved: null,
      errorCode: 'GAME_AMBIGUOUS',
      reason: `Game alias "${clean}" matched multiple catalog entries (${matchesByAlt.length}). Specify gameSlug or gameId.`,
    };
  }

  return {
    resolved: null,
    errorCode: 'GAME_NOT_FOUND',
    reason: `Game "${clean}" was not found in the catalog.`,
  };
}

/**
 * Resolves a human-friendly string or ID into a definitive canonical HardwareCpu record.
 *
 * @param {string} input CPU canonical name, slug, alias, or hardwareId
 * @returns {Promise<{ resolved: Object|null, errorCode: string|null, reason: string|null }>}
 */
async function resolveCanonicalCpu(input) {
  if (!input || typeof input !== 'string' || !input.trim()) {
    return {
      resolved: null,
      errorCode: 'MISSING_CPU',
      reason: 'CPU identifier is required.',
    };
  }

  const clean = input.trim();

  // 1. Direct hardwareId match
  const docByHwId = await HardwareCpu.findOne({ hardwareId: clean.toLowerCase() }).lean();
  if (docByHwId) {
    return { resolved: docByHwId, errorCode: null, reason: null };
  }

  // 2. Direct slug match
  const docBySlug = await HardwareCpu.findOne({ slug: clean.toLowerCase() }).lean();
  if (docBySlug) {
    return { resolved: docBySlug, errorCode: null, reason: null };
  }

  // 3. Exact case-insensitive canonicalName match
  const matchesByName = await HardwareCpu.find({
    canonicalName: new RegExp(`^${escapeRegex(clean)}$`, 'i'),
  }).lean();

  if (matchesByName.length === 1) {
    return { resolved: matchesByName[0], errorCode: null, reason: null };
  }
  if (matchesByName.length > 1) {
    return {
      resolved: null,
      errorCode: 'CPU_AMBIGUOUS',
      reason: `CPU "${clean}" matched multiple hardware variants (${matchesByName.length}). Use the exact canonical hardware name or hardwareId.`,
    };
  }

  // 4. Exact case-insensitive alias match
  const matchesByAlias = await HardwareCpu.find({
    aliases: new RegExp(`^${escapeRegex(clean)}$`, 'i'),
  }).lean();

  if (matchesByAlias.length === 1) {
    return { resolved: matchesByAlias[0], errorCode: null, reason: null };
  }
  if (matchesByAlias.length > 1) {
    return {
      resolved: null,
      errorCode: 'CPU_AMBIGUOUS',
      reason: `CPU alias "${clean}" matched multiple hardware variants (${matchesByAlias.length}). Use the exact canonical hardware name or hardwareId.`,
    };
  }

  return {
    resolved: null,
    errorCode: 'CPU_NOT_FOUND',
    reason: `CPU "${clean}" was not found in HardwareCpu master catalog.`,
  };
}

/**
 * Resolves a human-friendly string or ID into a definitive canonical HardwareGpu record.
 *
 * @param {string} input GPU canonical name, slug, alias, or hardwareId
 * @returns {Promise<{ resolved: Object|null, errorCode: string|null, reason: string|null }>}
 */
async function resolveCanonicalGpu(input) {
  if (!input || typeof input !== 'string' || !input.trim()) {
    return {
      resolved: null,
      errorCode: 'MISSING_GPU',
      reason: 'GPU identifier is required.',
    };
  }

  const clean = input.trim();

  // 1. Direct hardwareId match
  const docByHwId = await HardwareGpu.findOne({ hardwareId: clean.toLowerCase() }).lean();
  if (docByHwId) {
    return { resolved: docByHwId, errorCode: null, reason: null };
  }

  // 2. Direct slug match
  const docBySlug = await HardwareGpu.findOne({ slug: clean.toLowerCase() }).lean();
  if (docBySlug) {
    return { resolved: docBySlug, errorCode: null, reason: null };
  }

  // 3. Exact case-insensitive canonicalName match
  const matchesByName = await HardwareGpu.find({
    canonicalName: new RegExp(`^${escapeRegex(clean)}$`, 'i'),
  }).lean();

  if (matchesByName.length === 1) {
    return { resolved: matchesByName[0], errorCode: null, reason: null };
  }
  if (matchesByName.length > 1) {
    return {
      resolved: null,
      errorCode: 'GPU_AMBIGUOUS',
      reason: `GPU "${clean}" matched multiple hardware variants (${matchesByName.length}). Use the exact canonical hardware name or hardwareId.`,
    };
  }

  // 4. Exact case-insensitive alias match
  const matchesByAlias = await HardwareGpu.find({
    aliases: new RegExp(`^${escapeRegex(clean)}$`, 'i'),
  }).lean();

  if (matchesByAlias.length === 1) {
    return { resolved: matchesByAlias[0], errorCode: null, reason: null };
  }
  if (matchesByAlias.length > 1) {
    return {
      resolved: null,
      errorCode: 'GPU_AMBIGUOUS',
      reason: `GPU alias "${clean}" matched multiple hardware variants (${matchesByAlias.length}). Use the exact canonical hardware name or hardwareId.`,
    };
  }

  return {
    resolved: null,
    errorCode: 'GPU_NOT_FOUND',
    reason: `GPU "${clean}" was not found in HardwareGpu master catalog.`,
  };
}

module.exports = {
  resolveCanonicalGame,
  resolveCanonicalCpu,
  resolveCanonicalGpu,
};
