/**
 * Project Aura V2 — Milestone V2.1.3E
 * Dataset V2 Validator Service
 *
 * Implements strict training policy checks, required feature completeness,
 * target sanity verification, and strict target-leakage prevention.
 */

const {
  FEATURE_DEFINITIONS,
  TARGET_DEFINITIONS,
  PROHIBITED_LEAKAGE_FEATURES,
  AUDIT_COLUMNS,
} = require('./featureManifest');

/**
 * Validates whether a raw GameBenchmark document passes the strict training policy.
 *
 * @param {Object} benchmark
 * @returns {Object} { eligible: boolean, reasons: string[] }
 */
function validateBenchmarkEligibility(benchmark) {
  const reasons = [];

  if (!benchmark) {
    return { eligible: false, reasons: ['BENCHMARK_RECORD_NULL'] };
  }

  if (benchmark.trainingEligible !== true) {
    reasons.push('NOT_TRAINING_ELIGIBLE');
  }

  const allowedLicenses = ['approved', 'approved_with_conditions'];
  if (!allowedLicenses.includes(benchmark.licenseStatus)) {
    reasons.push('UNAPPROVED_LICENSE_STATUS');
  }

  const allowedGrades = ['verified', 'high'];
  const grade = benchmark.quality?.grade;
  if (!allowedGrades.includes(grade)) {
    reasons.push('QUALITY_GRADE_INSUFFICIENT');
  }

  if (benchmark.quality?.quarantineReason) {
    reasons.push('RECORD_QUARANTINED');
  }

  if (benchmark.frameGeneration?.enabled === true) {
    reasons.push('FRAME_GENERATION_NOT_NATIVE');
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

/**
 * Scans an object/feature dictionary for any prohibited target leakage features.
 *
 * @param {Object} features
 * @returns {Object} { hasLeakage: boolean, detectedKeys: string[] }
 */
function checkTargetLeakage(features) {
  if (!features || typeof features !== 'object') {
    return { hasLeakage: false, detectedKeys: [] };
  }

  const featureKeys = Object.keys(features);
  const detectedKeys = [];

  for (const key of featureKeys) {
    const lowerKey = key.toLowerCase();
    for (const prohibited of PROHIBITED_LEAKAGE_FEATURES) {
      if (lowerKey === prohibited.toLowerCase() || lowerKey.includes(prohibited.toLowerCase())) {
        detectedKeys.push(key);
        break;
      }
    }
  }

  return {
    hasLeakage: detectedKeys.length > 0,
    detectedKeys,
  };
}

/**
 * Validates extracted feature completeness against the required definitions in FeatureManifest.
 *
 * @param {Object} features
 * @returns {Object} { complete: boolean, missingRequired: string[], outOfBounds: string[] }
 */
function validateRequiredFeatures(features) {
  if (!features || typeof features !== 'object') {
    return { complete: false, missingRequired: ['ALL_FEATURES_NULL'], outOfBounds: [] };
  }

  const missingRequired = [];
  const outOfBounds = [];

  for (const def of FEATURE_DEFINITIONS) {
    const val = features[def.name];

    if (def.required) {
      if (val === null || val === undefined) {
        missingRequired.push(def.name);
        continue;
      }
    }

    if (val !== null && val !== undefined) {
      if (def.allowedValues && !def.allowedValues.includes(val)) {
        outOfBounds.push(`${def.name}_VALUE_NOT_ALLOWED (${val})`);
      }
      if (typeof def.min === 'number' && val < def.min) {
        outOfBounds.push(`${def.name}_BELOW_MIN (${val} < ${def.min})`);
      }
      if (typeof def.max === 'number' && val > def.max) {
        outOfBounds.push(`${def.name}_ABOVE_MAX (${val} > ${def.max})`);
      }
    }
  }

  return {
    complete: missingRequired.length === 0 && outOfBounds.length === 0,
    missingRequired,
    outOfBounds,
  };
}

/**
 * Validates primary and secondary targets.
 *
 * @param {Object} targets
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateTargets(targets) {
  const errors = [];
  if (!targets || typeof targets !== 'object') {
    return { valid: false, errors: ['TARGETS_NULL'] };
  }

  const avgFpsDef = TARGET_DEFINITIONS.find((t) => t.name === 'target_avg_fps');
  const avgFps = targets.target_avg_fps;

  if (avgFps === null || avgFps === undefined || typeof avgFps !== 'number' || !Number.isFinite(avgFps)) {
    errors.push('INVALID_TARGET_AVG_FPS_TYPE');
  } else if (avgFps < avgFpsDef.min || avgFps > avgFpsDef.max) {
    errors.push(`INVALID_TARGET_AVG_FPS_BOUNDS (${avgFps})`);
  }

  const onePctDef = TARGET_DEFINITIONS.find((t) => t.name === 'target_1pct_low_fps');
  const onePct = targets.target_1pct_low_fps;

  if (onePct !== null && onePct !== undefined) {
    if (typeof onePct !== 'number' || !Number.isFinite(onePct) || onePct < onePctDef.min || onePct > onePctDef.max) {
      errors.push(`INVALID_TARGET_1PCT_LOW_BOUNDS (${onePct})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an assembled dataset row before export.
 *
 * @param {Object} row - { features, targets, audit }
 * @returns {Object} { valid: boolean, errors: string[], missingFeatures: string[] }
 */
function validateDatasetRow(row) {
  const errors = [];
  const missingFeatures = [];

  if (!row || !row.features || !row.targets || !row.audit) {
    return { valid: false, errors: ['INCOMPLETE_ROW_STRUCTURE'], missingFeatures: [] };
  }

  // 1. Audit Target Leakage
  const leakage = checkTargetLeakage(row.features);
  if (leakage.hasLeakage) {
    errors.push(`TARGET_LEAKAGE_DETECTED: ${leakage.detectedKeys.join(', ')}`);
  }

  // 2. Validate Required Features
  const featureCheck = validateRequiredFeatures(row.features);
  if (!featureCheck.complete) {
    if (featureCheck.missingRequired.length > 0) {
      errors.push(`MISSING_REQUIRED_FEATURE: ${featureCheck.missingRequired.join(', ')}`);
      missingFeatures.push(...featureCheck.missingRequired);
    }
    if (featureCheck.outOfBounds.length > 0) {
      errors.push(`FEATURE_OUT_OF_BOUNDS: ${featureCheck.outOfBounds.join(', ')}`);
    }
  }

  // 3. Validate Targets
  const targetCheck = validateTargets(row.targets);
  if (!targetCheck.valid) {
    errors.push(...targetCheck.errors);
  }

  // 4. Ensure Audit Columns are present and separate from features
  for (const col of AUDIT_COLUMNS) {
    if (Object.prototype.hasOwnProperty.call(row.features, col)) {
      errors.push(`AUDIT_COLUMN_LEAKED_INTO_FEATURES (${col})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    missingFeatures,
  };
}

module.exports = {
  validateBenchmarkEligibility,
  checkTargetLeakage,
  validateRequiredFeatures,
  validateTargets,
  validateDatasetRow,
};
