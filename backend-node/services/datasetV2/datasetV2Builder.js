/**
 * Project Aura V2 — Milestone V2.1.3E
 * Dataset V2 Builder Service (Main Orchestrator)
 *
 * Implements the full pipeline:
 * GameBenchmark -> Eligibility filtering -> Canonical joins -> Physical feature extraction
 * -> Workload feature engineering -> Target extraction -> Dataset validation -> Split strategy -> Export
 */

const GameBenchmark = require('../../models/GameBenchmark');
const HardwareCpu = require('../../models/HardwareCpu');
const HardwareGpu = require('../../models/HardwareGpu');
const Game = require('../../models/Game');

const { extractFeatures } = require('./featureBuilder');
const {
  validateBenchmarkEligibility,
  validateDatasetRow,
} = require('./datasetValidator');
const {
  splitGroupedSource,
  splitUnseenHardwareHoldout,
  splitUnseenGameHoldout,
} = require('./splitStrategy');
const {
  generateBuildReport,
  exportDatasetFiles,
  DEFAULT_OUTPUT_DIR,
} = require('./datasetExporter');

/**
 * Builds Dataset V2 from verified GameBenchmark observations and canonical masters.
 *
 * @param {Object} options
 * @param {boolean} [options.dryRun=false] - If true, performs all steps without writing output files
 * @param {number} [options.limit] - Max observations to inspect
 * @param {string} [options.outputDir] - Custom export directory
 * @param {string} [options.protocol='grouped_source'] - 'grouped_source' | 'unseen_hardware' | 'unseen_game'
 * @param {number} [options.seed=42] - Deterministic split seed
 * @param {boolean} [options.applySplit=true] - Whether to apply splitting strategy
 * @param {Array} [options.customBenchmarks] - Direct array of benchmark objects for test isolation
 * @param {Array} [options.customCpus] - Direct array of CPU master objects for test isolation
 * @param {Array} [options.customGpus] - Direct array of GPU master objects for test isolation
 * @param {Array} [options.customGames] - Direct array of Game objects for test isolation
 * @returns {Promise<Object>} Build result { success, acceptedRows, report, stats, artifacts }
 */
async function buildDatasetV2(options = {}) {
  const {
    dryRun = false,
    limit = 0,
    outputDir = DEFAULT_OUTPUT_DIR,
    protocol = 'grouped_source',
    seed = 42,
    applySplit = true,
    customBenchmarks,
    customCpus,
    customGpus,
    customGames,
  } = options;

  const timestamp = new Date().toISOString();

  // 1. Fetch benchmark observations
  let benchmarks = [];
  if (customBenchmarks) {
    benchmarks = limit > 0 ? customBenchmarks.slice(0, limit) : customBenchmarks;
  } else {
    let query = GameBenchmark.find().sort({ createdAt: -1 });
    if (limit > 0) {
      query = query.limit(limit);
    }
    benchmarks = await query.lean();
  }

  const totalInputObservations = benchmarks.length;
  let trainingEligibleObservations = 0;

  // Track rejection statistics
  const rejectionReasons = {
    NOT_TRAINING_ELIGIBLE: 0,
    UNAPPROVED_LICENSE_STATUS: 0,
    QUALITY_GRADE_INSUFFICIENT: 0,
    RECORD_QUARANTINED: 0,
    FRAME_GENERATION_NOT_NATIVE: 0,
    GAME_NOT_FOUND: 0,
    CPU_NOT_FOUND: 0,
    GPU_NOT_FOUND: 0,
    MISSING_REQUIRED_FEATURE: 0,
    INVALID_RESOLUTION: 0,
    UNSUPPORTED_PRESET: 0,
    MISSING_INTERNAL_RESOLUTION: 0,
    INVALID_TARGET: 0,
    TARGET_LEAKAGE_DETECTED: 0,
    OTHER: 0,
  };

  const missingFeatureFrequencies = {};

  // Build Master lookup caches if not supplied
  const cpuCache = new Map();
  const gpuCache = new Map();
  const gameCache = new Map();

  if (customCpus) {
    customCpus.forEach((c) => cpuCache.set(c.hardwareId, c));
  }
  if (customGpus) {
    customGpus.forEach((g) => gpuCache.set(g.hardwareId, g));
  }
  if (customGames) {
    customGames.forEach((g) => gameCache.set(g.slug, g));
  }

  const acceptedRows = [];

  // 2. Process observations
  for (const bm of benchmarks) {
    // A. Eligibility policy check
    const eligibility = validateBenchmarkEligibility(bm);
    if (!eligibility.eligible) {
      eligibility.reasons.forEach((r) => {
        if (Object.prototype.hasOwnProperty.call(rejectionReasons, r)) {
          rejectionReasons[r]++;
        } else {
          rejectionReasons.OTHER++;
        }
      });
      continue;
    }

    trainingEligibleObservations++;

    // B. Resolve Master CPU
    let cpuDoc = cpuCache.get(bm.cpuHardwareId);
    if (!cpuDoc && !customCpus) {
      cpuDoc = await HardwareCpu.findOne({ hardwareId: bm.cpuHardwareId }).lean();
      if (cpuDoc) cpuCache.set(bm.cpuHardwareId, cpuDoc);
    }

    if (!cpuDoc) {
      rejectionReasons.CPU_NOT_FOUND++;
      continue;
    }

    // C. Resolve Master GPU
    let gpuDoc = gpuCache.get(bm.gpuHardwareId);
    if (!gpuDoc && !customGpus) {
      gpuDoc = await HardwareGpu.findOne({ hardwareId: bm.gpuHardwareId }).lean();
      if (gpuDoc) gpuCache.set(bm.gpuHardwareId, gpuDoc);
    }

    if (!gpuDoc) {
      rejectionReasons.GPU_NOT_FOUND++;
      continue;
    }

    // D. Resolve Game
    let gameDoc = gameCache.get(bm.gameSlug);
    if (!gameDoc && !customGames) {
      gameDoc = await Game.findOne({ slug: bm.gameSlug }).lean();
      if (gameDoc) gameCache.set(bm.gameSlug, gameDoc);
    }

    if (!gameDoc) {
      rejectionReasons.GAME_NOT_FOUND++;
      continue;
    }

    // E. Extract physical and workload features
    const extracted = extractFeatures({
      benchmark: bm,
      cpu: cpuDoc,
      gpu: gpuDoc,
      game: gameDoc,
    });

    if (extracted.errors.length > 0) {
      extracted.errors.forEach((err) => {
        if (Object.prototype.hasOwnProperty.call(rejectionReasons, err)) {
          rejectionReasons[err]++;
        } else {
          rejectionReasons.OTHER++;
        }
      });
      continue;
    }

    // F. Validate assembled dataset row
    const rowCandidate = {
      features: extracted.features,
      targets: extracted.targets,
      audit: extracted.audit,
    };

    const rowValidation = validateDatasetRow(rowCandidate);
    if (!rowValidation.valid) {
      rowValidation.errors.forEach((err) => {
        if (err.startsWith('MISSING_REQUIRED_FEATURE')) {
          rejectionReasons.MISSING_REQUIRED_FEATURE++;
        } else if (err.startsWith('TARGET_LEAKAGE_DETECTED')) {
          rejectionReasons.TARGET_LEAKAGE_DETECTED++;
        } else {
          rejectionReasons.OTHER++;
        }
      });

      rowValidation.missingFeatures.forEach((feat) => {
        missingFeatureFrequencies[feat] = (missingFeatureFrequencies[feat] || 0) + 1;
      });
      continue;
    }

    acceptedRows.push(rowCandidate);
  }

  // 3. Multi-Protocol Splitting
  let splitSummary = null;
  if (applySplit && acceptedRows.length > 0) {
    let splitResult;
    if (protocol === 'unseen_hardware') {
      splitResult = splitUnseenHardwareHoldout(acceptedRows, { seed });
    } else if (protocol === 'unseen_game') {
      splitResult = splitUnseenGameHoldout(acceptedRows, { seed });
    } else {
      splitResult = splitGroupedSource(acceptedRows, { seed });
    }

    // Tag split sets onto rows
    splitResult.train.forEach((r) => { r.splitSet = 'train'; });
    splitResult.val.forEach((r) => { r.splitSet = 'val'; });
    splitResult.test.forEach((r) => { r.splitSet = 'test'; });

    splitSummary = splitResult.metadata;
  } else if (acceptedRows.length === 0) {
    splitSummary = {
      protocol,
      seed,
      counts: { total: 0, train: 0, val: 0, test: 0 },
      note: 'Zero eligible rows to split',
    };
  }

  // 4. Coverage Statistics
  const uniqueGames = new Set(acceptedRows.map((r) => r.audit.gameSlug));
  const uniqueCpus = new Set(acceptedRows.map((r) => r.audit.cpuHardwareId));
  const uniqueGpus = new Set(acceptedRows.map((r) => r.audit.gpuHardwareId));

  const gameCoverage = { count: uniqueGames.size, slugs: Array.from(uniqueGames) };
  const hardwareCoverage = {
    uniqueCpus: uniqueCpus.size,
    uniqueGpus: uniqueGpus.size,
    cpuIds: Array.from(uniqueCpus),
    gpuIds: Array.from(uniqueGpus),
  };

  // 5. Generate Build Report
  const acceptedRowCount = acceptedRows.length;
  const rejectedRowCount = totalInputObservations - acceptedRowCount;

  const report = generateBuildReport({
    timestamp,
    totalInputObservations,
    trainingEligibleObservations,
    acceptedRowCount,
    rejectedRowCount,
    rejectionReasons,
    missingFeatureFrequencies,
    splitSummary,
    hardwareCoverage,
    gameCoverage,
  });

  // 6. Export or Dry Run
  let artifacts = {};
  if (!dryRun) {
    const exportResult = exportDatasetFiles({
      rows: acceptedRows,
      report,
      outputDir,
    });
    artifacts = exportResult;
  }

  return {
    success: true,
    status: report.status,
    totalInputObservations,
    trainingEligibleObservations,
    acceptedRowCount,
    rejectedRowCount,
    acceptedRows,
    report,
    artifacts,
    dryRun,
  };
}

module.exports = {
  buildDatasetV2,
};
