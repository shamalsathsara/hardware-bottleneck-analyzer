const crypto = require('crypto');

/**
 * Generate a deterministic observation fingerprint for duplicate detection.
 * Uses a standardized canonical delimiter format to prevent false collisions.
 *
 * @param {Object} obs Normalized observation fields
 * @returns {string} SHA-256 hexadecimal digest
 */
function generateObservationFingerprint(obs) {
  if (!obs) throw new Error('Observation data is required for fingerprinting');

  const gameSlug = String(obs.gameSlug || '').trim().toLowerCase();
  const cpuHardwareId = String(obs.cpuHardwareId || '').trim();
  const gpuHardwareId = String(obs.gpuHardwareId || '').trim();
  const width = parseInt(obs.display?.width, 10) || 0;
  const height = parseInt(obs.display?.height, 10) || 0;
  const preset = String(obs.graphics?.normalizedPreset || 'unknown').trim().toLowerCase();
  const rtEnabled = obs.rayTracing?.enabled === true ? 'rt_on' : 'rt_off';
  const rtPreset = String(obs.rayTracing?.preset || 'none').trim().toLowerCase();
  const upscalingEnabled = obs.upscaling?.enabled === true ? 'up_on' : 'up_off';
  const upscalingTech = String(obs.upscaling?.technology || 'none').trim().toLowerCase();
  const upscalingMode = String(obs.upscaling?.mode || 'none').trim().toLowerCase();
  const fgEnabled = obs.frameGeneration?.enabled === true ? 'fg_on' : 'fg_off';
  const sourceType = String(obs.provenance?.sourceType || 'unknown').trim().toLowerCase();
  const sourceName = String(obs.provenance?.sourceName || 'unknown').trim().toLowerCase();
  const sourceRecordId = String(obs.provenance?.sourceRecordId || 'none').trim();
  const sessionOrRun = String(obs.provenance?.benchmarkSessionId || obs.testConditions?.runCount || 'run1').trim();

  // Canonical serialized string with pipe delimiters
  const canonicalString = [
    `game:${gameSlug}`,
    `cpu:${cpuHardwareId}`,
    `gpu:${gpuHardwareId}`,
    `res:${width}x${height}`,
    `preset:${preset}`,
    `rt:${rtEnabled}:${rtPreset}`,
    `upscaling:${upscalingEnabled}:${upscalingTech}:${upscalingMode}`,
    `fg:${fgEnabled}`,
    `source:${sourceType}:${sourceName}:${sourceRecordId}`,
    `session:${sessionOrRun}`,
  ].join('|');

  return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}

/**
 * Generate an immutable, unique Project Aura benchmark ID.
 * Format: bm_<timestamp_epoch>_<8_char_random_hex>
 *
 * @returns {string} Unique benchmarkId
 */
function generateBenchmarkId() {
  const timestamp = Date.now().toString(36);
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  return `bm_${timestamp}_${randomSuffix}`;
}

module.exports = {
  generateObservationFingerprint,
  generateBenchmarkId,
};
