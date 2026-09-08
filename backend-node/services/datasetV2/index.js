/**
 * Project Aura V2 — Milestone V2.1.3E
 * Dataset V2 Package Exports
 */

const {
  DATASET_SCHEMA_VERSION,
  FEATURE_MANIFEST_VERSION,
  PRESET_NUMERIC_MAP,
  PROHIBITED_LEAKAGE_FEATURES,
  AUDIT_COLUMNS,
  FEATURE_DEFINITIONS,
  TARGET_DEFINITIONS,
} = require('./featureManifest');

const { extractFeatures, isValidNumber } = require('./featureBuilder');
const {
  validateBenchmarkEligibility,
  checkTargetLeakage,
  validateRequiredFeatures,
  validateTargets,
  validateDatasetRow,
} = require('./datasetValidator');

const {
  createSeededRandom,
  seededShuffle,
  splitGroupedSource,
  splitUnseenHardwareHoldout,
  splitUnseenGameHoldout,
} = require('./splitStrategy');

const {
  DEFAULT_OUTPUT_DIR,
  rowsToCsv,
  formatCsvValue,
  generateBuildReport,
  exportDatasetFiles,
} = require('./datasetExporter');

const { buildDatasetV2 } = require('./datasetV2Builder');

module.exports = {
  // Manifest
  DATASET_SCHEMA_VERSION,
  FEATURE_MANIFEST_VERSION,
  PRESET_NUMERIC_MAP,
  PROHIBITED_LEAKAGE_FEATURES,
  AUDIT_COLUMNS,
  FEATURE_DEFINITIONS,
  TARGET_DEFINITIONS,

  // Feature Builder
  extractFeatures,
  isValidNumber,

  // Validator
  validateBenchmarkEligibility,
  checkTargetLeakage,
  validateRequiredFeatures,
  validateTargets,
  validateDatasetRow,

  // Split Strategy
  createSeededRandom,
  seededShuffle,
  splitGroupedSource,
  splitUnseenHardwareHoldout,
  splitUnseenGameHoldout,

  // Exporter
  DEFAULT_OUTPUT_DIR,
  rowsToCsv,
  formatCsvValue,
  generateBuildReport,
  exportDatasetFiles,

  // Orchestrator
  buildDatasetV2,
};
