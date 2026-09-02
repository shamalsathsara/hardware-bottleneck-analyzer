const GameBenchmark = require('../../models/GameBenchmark');
const { validateBenchmarkObservation } = require('./benchmarkValidator');
const { generateObservationFingerprint, generateBenchmarkId } = require('./benchmarkFingerprint');

/**
 * Ingest a validated GameBenchmark observation into MongoDB.
 *
 * @param {Object} rawObservation Incoming raw observation payload
 * @param {Object} options Ingestion options & policy parameters
 * @returns {Promise<Object>} { isDuplicate: boolean, isRepeatedMeasurement: boolean, benchmark: Document }
 */
async function ingestBenchmarkObservation(rawObservation, options = {}) {
  // 1. Validate and normalize fields
  const normalizedData = await validateBenchmarkObservation(rawObservation, options);

  // 2. Compute deterministic observation fingerprint
  const observationFingerprint = generateObservationFingerprint(normalizedData);

  // 3. Check for exact duplicate vs repeated measurement
  const existingWithFingerprint = await GameBenchmark.findOne({
    observationFingerprint,
  });

  if (existingWithFingerprint) {
    // If exact same source record and exact same FPS, treat as exact duplicate
    if (
      existingWithFingerprint.provenance?.sourceRecordId === normalizedData.provenance?.sourceRecordId &&
      Math.abs(existingWithFingerprint.performance.avgFps - normalizedData.performance.avgFps) < 0.01
    ) {
      return {
        isDuplicate: true,
        isRepeatedMeasurement: false,
        benchmark: existingWithFingerprint,
      };
    }
  }

  // 4. Generate immutable Project Aura benchmark ID
  const benchmarkId = generateBenchmarkId();

  // 5. Create and save new document
  const benchmarkDoc = new GameBenchmark({
    ...normalizedData,
    benchmarkId,
    observationFingerprint,
  });

  await benchmarkDoc.save();

  return {
    isDuplicate: false,
    isRepeatedMeasurement: Boolean(existingWithFingerprint),
    benchmark: benchmarkDoc,
  };
}

module.exports = {
  ingestBenchmarkObservation,
};
