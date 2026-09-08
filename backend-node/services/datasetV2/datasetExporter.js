/**
 * Project Aura V2 — Milestone V2.1.3E
 * Dataset V2 Exporter Service
 *
 * Handles CSV serialization and machine-readable JSON build reports.
 */

const fs = require('fs');
const path = require('path');
const {
  DATASET_SCHEMA_VERSION,
  FEATURE_MANIFEST_VERSION,
  FEATURE_DEFINITIONS,
  TARGET_DEFINITIONS,
  AUDIT_COLUMNS,
} = require('./featureManifest');

const DEFAULT_OUTPUT_DIR = path.resolve(__dirname, '../../data/generated/dataset-v2');

/**
 * Converts a set of rows into CSV formatted string.
 *
 * @param {Array} rows - Array of validated rows { features, targets, audit, splitSet }
 * @returns {string}
 */
function rowsToCsv(rows = []) {
  if (!rows || rows.length === 0) {
    return '';
  }

  // Define strict ordered header layout
  const auditHeaders = [...AUDIT_COLUMNS];
  const featureHeaders = FEATURE_DEFINITIONS.map((f) => f.name);
  const targetHeaders = TARGET_DEFINITIONS.map((t) => t.name);
  const headers = [...auditHeaders, ...featureHeaders, ...targetHeaders, 'split_set'];

  const lines = [headers.join(',')];

  for (const row of rows) {
    const values = [];

    // 1. Audit Columns
    for (const col of auditHeaders) {
      const val = row.audit?.[col];
      values.push(formatCsvValue(val));
    }

    // 2. Feature Columns
    for (const col of featureHeaders) {
      const val = row.features?.[col];
      values.push(formatCsvValue(val));
    }

    // 3. Target Columns
    for (const col of targetHeaders) {
      const val = row.targets?.[col];
      values.push(formatCsvValue(val));
    }

    // 4. Split Set
    values.push(formatCsvValue(row.splitSet || 'unassigned'));

    lines.push(values.join(','));
  }

  return lines.join('\n');
}

/**
 * Formats a single value safely for CSV representation.
 * @param {*} val
 * @returns {string}
 */
function formatCsvValue(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : '';
  if (typeof val === 'boolean') return val ? '1' : '0';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates the standardized machine-readable build report object.
 *
 * @param {Object} params
 * @returns {Object}
 */
function generateBuildReport(params) {
  const {
    timestamp = new Date().toISOString(),
    totalInputObservations = 0,
    trainingEligibleObservations = 0,
    acceptedRowCount = 0,
    rejectedRowCount = 0,
    rejectionReasons = {},
    missingFeatureFrequencies = {},
    splitSummary = null,
    hardwareCoverage = {},
    gameCoverage = {},
    outputFiles = {},
  } = params;

  const status = acceptedRowCount === 0 ? 'INSUFFICIENT_REAL_DATA' : 'DATASET_V2_READY';

  return {
    reportTitle: 'Project Aura Dataset V2 Build Report',
    schemaVersion: DATASET_SCHEMA_VERSION,
    manifestVersion: FEATURE_MANIFEST_VERSION,
    builderVersion: '2.1.3E',
    generatedAt: timestamp,
    status,
    summary: {
      totalInputObservations,
      trainingEligibleObservations,
      acceptedRowCount,
      rejectedRowCount,
      featureCount: FEATURE_DEFINITIONS.length,
      targetCount: TARGET_DEFINITIONS.length,
    },
    rejectionBreakdown: rejectionReasons,
    missingFeatureFrequencies,
    featureManifest: FEATURE_DEFINITIONS.map((f) => ({
      name: f.name,
      category: f.category,
      type: f.type,
      unit: f.unit,
      required: f.required,
      usedInInitialModel: f.usedInInitialModel,
    })),
    targetManifest: TARGET_DEFINITIONS.map((t) => ({
      name: t.name,
      type: t.type,
      unit: t.unit,
      required: t.required,
    })),
    splitSummary,
    coverage: {
      uniqueGames: gameCoverage.count || 0,
      uniqueCpus: hardwareCoverage.uniqueCpus || 0,
      uniqueGpus: hardwareCoverage.uniqueGpus || 0,
    },
    artifacts: outputFiles,
    readyForModelTraining: false, // Model V2 training is blocked until sufficient data coverage exists
    trainingBlockers: acceptedRowCount === 0
      ? ['NO_ELIGIBLE_REAL_OBSERVATIONS', 'INSUFFICIENT_HARDWARE_COVERAGE', 'INSUFFICIENT_GAME_COVERAGE']
      : [],
  };
}

/**
 * Exports the dataset to CSV and JSON report files on disk.
 *
 * @param {Object} params
 * @param {Array} params.rows
 * @param {Object} params.report
 * @param {string} [params.outputDir]
 * @param {string} [params.customPrefix]
 * @returns {Object} { csvPath, reportPath, success: boolean }
 */
function exportDatasetFiles(params) {
  const {
    rows = [],
    report,
    outputDir = DEFAULT_OUTPUT_DIR,
    customPrefix,
  } = params;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
  const prefix = customPrefix || `dataset_v2_${timestampStr}`;

  let csvPath = null;
  if (rows.length > 0) {
    csvPath = path.join(outputDir, `${prefix}.csv`);
    const csvContent = rowsToCsv(rows);
    fs.writeFileSync(csvPath, csvContent, 'utf8');
  }

  const reportPath = path.join(outputDir, `${prefix}_build_report.json`);
  const finalReport = {
    ...report,
    artifacts: {
      csv: csvPath,
      report: reportPath,
    },
  };
  fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2), 'utf8');

  return {
    csvPath,
    reportPath,
    report: finalReport,
    success: true,
  };
}

module.exports = {
  DEFAULT_OUTPUT_DIR,
  rowsToCsv,
  formatCsvValue,
  generateBuildReport,
  exportDatasetFiles,
};
