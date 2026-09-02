const Game = require('../../models/Game');
const HardwareCpu = require('../../models/HardwareCpu');
const HardwareGpu = require('../../models/HardwareGpu');
const { resolveLicenseStatus } = require('./sourcePolicy');

/**
 * Normalizes standard and ultrawide resolutions and computes exact pixel load.
 *
 * @param {number|string} rawWidth
 * @param {number|string} rawHeight
 * @returns {Object} Normalized display object
 */
function normalizeDisplay(rawWidth, rawHeight) {
  const width = parseInt(rawWidth, 10);
  const height = parseInt(rawHeight, 10);

  if (!Number.isFinite(width) || width < 640 || width > 15360) {
    throw new Error(`Invalid display width: "${rawWidth}". Must be an integer between 640 and 15360.`);
  }
  if (!Number.isFinite(height) || height < 480 || height > 8640) {
    throw new Error(`Invalid display height: "${rawHeight}". Must be an integer between 480 and 8640.`);
  }

  const pixelCount = width * height;

  // Derive standard friendly label without rejecting custom resolutions
  let label = `${width}x${height}`;
  let aspectRatio = '16:9';

  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.05) {
    aspectRatio = '16:9';
    if (width === 1280 && height === 720) label = '720p';
    else if (width === 1920 && height === 1080) label = '1080p';
    else if (width === 2560 && height === 1440) label = '1440p';
    else if (width === 3840 && height === 2160) label = '4K';
  } else if (Math.abs(ratio - 21 / 9) < 0.1 || Math.abs(ratio - 64 / 27) < 0.1) {
    aspectRatio = '21:9';
    if (width === 2560 && height === 1080) label = '1080p Ultrawide';
    else if (width === 3440 && height === 1440) label = '1440p Ultrawide';
    else if (width === 5120 && height === 2160) label = '4K Ultrawide';
  } else if (Math.abs(ratio - 32 / 9) < 0.1) {
    aspectRatio = '32:9';
    if (width === 5120 && height === 1440) label = 'Super Ultrawide (1440p)';
    else if (width === 7680 && height === 2160) label = 'Super Ultrawide (4K)';
  }

  return {
    width,
    height,
    label,
    pixelCount,
    aspectRatio,
  };
}

/**
 * Computes a transparent, provisional data-quality score (0-100).
 *
 * @param {Object} obs Validated observation fields
 * @param {string} licenseStatus Authoritative license status
 * @returns {number} Score from 0 to 100
 */
function computeDataQualityScore(obs, licenseStatus) {
  let score = 50; // base

  // 1. Source Trust
  if (licenseStatus === 'approved') score += 15;
  else if (licenseStatus === 'approved_with_conditions') score += 10;
  else if (licenseStatus === 'permission_required') score -= 10;

  // 2. Identity Completeness
  if (obs.gameId && obs.cpuHardwareId && obs.gpuHardwareId) score += 15;

  // 3. Settings Completeness
  if (obs.graphics?.normalizedPreset && obs.graphics.normalizedPreset !== 'unknown') score += 5;
  if (obs.system?.driverVersion && obs.system?.operatingSystem) score += 5;
  if (typeof obs.rayTracing?.enabled === 'boolean' && typeof obs.upscaling?.enabled === 'boolean') score += 5;

  // 4. Test Methodology Rigor
  if (obs.testConditions?.runCount && obs.testConditions.runCount >= 3) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Evaluates whether an observation passes all gates for Model V2 Native Training.
 *
 * @param {Object} params
 * @returns {boolean}
 */
function isTrainingEligible(params) {
  const {
    gameResolved,
    cpuResolved,
    gpuResolved,
    display,
    graphics,
    rayTracing,
    upscaling,
    frameGeneration,
    performance,
    licenseStatus,
    quality,
  } = params;

  // 1. Canonical Game, CPU, GPU must resolve definitively
  if (!gameResolved || !cpuResolved || !gpuResolved) return false;

  // 2. Display dimensions must be valid
  if (!display || display.width < 640 || display.height < 480 || !display.pixelCount) return false;

  // 3. Normalized preset must not be unknown
  if (!graphics || !graphics.normalizedPreset || graphics.normalizedPreset === 'unknown') return false;

  // 4. Ray Tracing & Upscaling must be explicitly known booleans
  if (!rayTracing || typeof rayTracing.enabled !== 'boolean') return false;
  if (!upscaling || typeof upscaling.enabled !== 'boolean') return false;

  // 5. Native Training Gate: Frame Generation must be FALSE
  if (!frameGeneration || frameGeneration.enabled === true) return false;

  // 6. Measured avgFps must be finite and within valid physical bounds
  if (!performance || !Number.isFinite(performance.avgFps) || performance.avgFps < 5 || performance.avgFps > 1200) {
    return false;
  }

  // 7. Licensing Status must be approved
  if (licenseStatus !== 'approved' && licenseStatus !== 'approved_with_conditions') return false;

  // 8. Quality Grade must be high or verified
  if (!quality || (quality.grade !== 'verified' && quality.grade !== 'high')) return false;

  // 9. Must not have quarantine reasons
  if (quality.quarantineReason && quality.quarantineReason.trim().length > 0) return false;

  return true;
}

/**
 * Evaluates whether an observation is valid for validation/evaluation tasks.
 *
 * @param {Object} params
 * @returns {boolean}
 */
function isEvaluationEligible(params) {
  const {
    gameResolved,
    cpuResolved,
    gpuResolved,
    display,
    graphics,
    performance,
    licenseStatus,
    quality,
  } = params;

  if (!gameResolved || !cpuResolved || !gpuResolved) return false;
  if (!display || !display.width || !display.height) return false;
  if (!graphics || graphics.normalizedPreset === 'unknown') return false;
  if (!performance || !Number.isFinite(performance.avgFps) || performance.avgFps < 5 || performance.avgFps > 1200) {
    return false;
  }
  if (quality?.grade === 'rejected' || quality?.grade === 'quarantined') return false;
  if (licenseStatus === 'unknown') return false;

  return true;
}

/**
 * Full validation and canonical normalization of a raw benchmark observation.
 *
 * @param {Object} raw Raw input observation
 * @param {Object} options Options including policy overrides for registered sources
 * @returns {Promise<Object>} Validated and normalized GameBenchmark document data
 */
async function validateBenchmarkObservation(raw, options = {}) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Observation payload must be a non-empty object.');
  }

  // 1. Resolve Canonical Game
  let gameDoc = null;
  if (raw.gameId) {
    gameDoc = await Game.findById(raw.gameId).lean();
  } else if (raw.gameSlug) {
    gameDoc = await Game.findOne({ slug: String(raw.gameSlug).trim().toLowerCase() }).lean();
  }

  if (!gameDoc) {
    throw new Error(`Canonical Game could not be resolved for slug/id: "${raw.gameSlug || raw.gameId}". Ambiguous or missing game title.`);
  }

  // 2. Resolve Canonical Hardware Master CPU
  const rawCpu = String(raw.rawCpuString || raw.cpuHardwareId || '').trim();
  const cpuHardwareId = String(raw.cpuHardwareId || '').trim();
  if (!cpuHardwareId) {
    throw new Error('cpuHardwareId is required.');
  }

  const cpuDoc = await HardwareCpu.findOne({ hardwareId: cpuHardwareId }).lean();
  if (!cpuDoc) {
    throw new Error(`Canonical HardwareCpu could not be found for hardwareId: "${cpuHardwareId}".`);
  }

  // 3. Resolve Canonical Hardware Master GPU
  const rawGpu = String(raw.rawGpuString || raw.gpuHardwareId || '').trim();
  const gpuHardwareId = String(raw.gpuHardwareId || '').trim();
  if (!gpuHardwareId) {
    throw new Error('gpuHardwareId is required.');
  }

  const gpuDoc = await HardwareGpu.findOne({ hardwareId: gpuHardwareId }).lean();
  if (!gpuDoc) {
    throw new Error(`Canonical HardwareGpu could not be found for hardwareId: "${gpuHardwareId}".`);
  }

  // 4. Display Normalization & Server-side pixelCount computation
  const display = normalizeDisplay(raw.display?.width, raw.display?.height);

  // 5. Graphics Preset Normalization
  const rawPreset = raw.graphics?.rawPreset ? String(raw.graphics.rawPreset).trim() : null;
  const validPresets = ['low', 'medium', 'high', 'ultra', 'custom', 'unknown'];
  let normalizedPreset = String(raw.graphics?.normalizedPreset || 'unknown').trim().toLowerCase();
  if (!validPresets.includes(normalizedPreset)) {
    normalizedPreset = 'unknown';
  }

  const graphics = {
    rawPreset,
    normalizedPreset,
    renderScale: typeof raw.graphics?.renderScale === 'number' ? raw.graphics.renderScale : 1.0,
  };

  // 6. Ray Tracing, Upscaling, Frame Generation
  const rayTracing = {
    enabled: Boolean(raw.rayTracing?.enabled),
    preset: raw.rayTracing?.preset || 'off',
    pathTracing: Boolean(raw.rayTracing?.pathTracing),
  };

  const upscaling = {
    enabled: Boolean(raw.upscaling?.enabled),
    technology: raw.upscaling?.technology || 'None',
    mode: raw.upscaling?.mode || null,
    internalResolution: {
      width: raw.upscaling?.internalResolution?.width ? parseInt(raw.upscaling.internalResolution.width, 10) : null,
      height: raw.upscaling?.internalResolution?.height ? parseInt(raw.upscaling.internalResolution.height, 10) : null,
    },
  };

  const frameGeneration = {
    enabled: Boolean(raw.frameGeneration?.enabled),
    technology: raw.frameGeneration?.technology || 'None',
  };

  // 7. Performance Metrics
  const avgFps = parseFloat(raw.performance?.avgFps);
  if (!Number.isFinite(avgFps) || avgFps < 5 || avgFps > 1200) {
    throw new Error(`Invalid performance.avgFps: "${raw.performance?.avgFps}". Must be a finite number between 5 and 1200 FPS.`);
  }

  const performance = {
    avgFps: Math.round(avgFps * 100) / 100,
    onePercentLowFps: Number.isFinite(raw.performance?.onePercentLowFps) ? Math.round(raw.performance.onePercentLowFps * 100) / 100 : null,
    pointOnePercentLowFps: Number.isFinite(raw.performance?.pointOnePercentLowFps) ? Math.round(raw.performance.pointOnePercentLowFps * 100) / 100 : null,
    minFps: Number.isFinite(raw.performance?.minFps) ? Math.round(raw.performance.minFps * 100) / 100 : null,
    maxFps: Number.isFinite(raw.performance?.maxFps) ? Math.round(raw.performance.maxFps * 100) / 100 : null,
    medianFps: Number.isFinite(raw.performance?.medianFps) ? Math.round(raw.performance.medianFps * 100) / 100 : null,
    frameTimeMs: {
      avg: Number.isFinite(raw.performance?.frameTimeMs?.avg) ? raw.performance.frameTimeMs.avg : null,
      p99: Number.isFinite(raw.performance?.frameTimeMs?.p99) ? raw.performance.frameTimeMs.p99 : null,
    },
  };

  // 8. Provenance & Authoritative Licensing
  const sourceType = raw.provenance?.sourceType || 'legacy_dataset';
  const sourceName = raw.provenance?.sourceName ? String(raw.provenance.sourceName).trim() : 'Unspecified Source';
  const licenseStatus = resolveLicenseStatus(sourceType, options);

  const provenance = {
    sourceType,
    sourceName,
    sourceUrl: raw.provenance?.sourceUrl || null,
    sourceRecordId: raw.provenance?.sourceRecordId || null,
    sourceGroupId: raw.provenance?.sourceGroupId || null,
    benchmarkSessionId: raw.provenance?.benchmarkSessionId || null,
    collectedAt: raw.provenance?.collectedAt ? new Date(raw.provenance.collectedAt) : new Date(),
    verifiedAt: raw.provenance?.verifiedAt ? new Date(raw.provenance.verifiedAt) : null,
    ingestionMethod: raw.provenance?.ingestionMethod || 'manual_verification',
  };

  // 9. System Configuration
  const system = {
    ramGB: Number.isFinite(raw.system?.ramGB) ? raw.system.ramGB : null,
    ramChannels: raw.system?.ramChannels || null,
    ramType: raw.system?.ramType || null,
    ramSpeedMTs: Number.isFinite(raw.system?.ramSpeedMTs) ? raw.system.ramSpeedMTs : null,
    operatingSystem: raw.system?.operatingSystem || null,
    driverVersion: raw.system?.driverVersion || null,
    gameVersion: raw.system?.gameVersion || null,
    api: raw.system?.api || null,
    resizableBarEnabled: typeof raw.system?.resizableBarEnabled === 'boolean' ? raw.system.resizableBarEnabled : null,
    cpuOverclocked: typeof raw.system?.cpuOverclocked === 'boolean' ? raw.system.cpuOverclocked : null,
    gpuOverclocked: typeof raw.system?.gpuOverclocked === 'boolean' ? raw.system.gpuOverclocked : null,
  };

  // 10. Test Conditions
  const testConditions = {
    sampleDurationSeconds: Number.isFinite(raw.testConditions?.sampleDurationSeconds) ? raw.testConditions.sampleDurationSeconds : null,
    runCount: Number.isFinite(raw.testConditions?.runCount) ? raw.testConditions.runCount : 1,
    benchmarkScene: raw.testConditions?.benchmarkScene || null,
    benchmarkType: raw.testConditions?.benchmarkType || 'unknown',
    captureTool: raw.testConditions?.captureTool || null,
    captureToolVersion: raw.testConditions?.captureToolVersion || null,
  };

  // 11. Quality & Provisional Quality Score
  const qualityGrade = raw.quality?.grade || (sourceType === 'project_aura_test' ? 'verified' : 'medium');
  const quality = {
    grade: qualityGrade,
    dataQualityScore: computeDataQualityScore({ gameId: gameDoc._id, cpuHardwareId, gpuHardwareId, graphics, system, rayTracing, upscaling, testConditions }, licenseStatus),
    flags: Array.isArray(raw.quality?.flags) ? raw.quality.flags : [],
    quarantineReason: raw.quality?.quarantineReason || null,
  };

  // 12. Compute Training & Evaluation Eligibility
  const eligibilityParams = {
    gameResolved: true,
    cpuResolved: true,
    gpuResolved: true,
    display,
    graphics,
    rayTracing,
    upscaling,
    frameGeneration,
    performance,
    licenseStatus,
    quality,
  };

  const trainingEligible = isTrainingEligible(eligibilityParams);
  const evaluationEligible = isEvaluationEligible(eligibilityParams);

  return {
    gameId: gameDoc._id,
    gameSlug: gameDoc.slug,
    rawGameName: raw.rawGameName || gameDoc.name,
    cpuHardwareId,
    rawCpuString: rawCpu || cpuDoc.canonicalName,
    gpuHardwareId,
    rawGpuString: rawGpu || gpuDoc.canonicalName,
    system,
    display,
    graphics,
    rayTracing,
    upscaling,
    frameGeneration,
    performance,
    testConditions,
    provenance,
    licenseStatus,
    quality,
    trainingEligible,
    evaluationEligible,
  };
}

module.exports = {
  normalizeDisplay,
  computeDataQualityScore,
  isTrainingEligible,
  isEvaluationEligible,
  validateBenchmarkObservation,
};
