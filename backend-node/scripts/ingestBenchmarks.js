#!/usr/bin/env node

/**
 * Project Aura — First-Party Benchmark Ingestion CLI
 *
 * Safely validates, resolves, and ingests real first-party benchmark observations.
 *
 * Usage:
 *   node scripts/ingestBenchmarks.js --file ./path/to/results.csv --dry-run
 *   node scripts/ingestBenchmarks.js --file ./path/to/results.json
 */

require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const GameBenchmark = require('../models/GameBenchmark');
const { parseBenchmarkFile, normalizeAndResolveRow } = require('../services/benchmarks/benchmarkFileParser');
const { validateBenchmarkObservation } = require('../services/benchmarks/benchmarkValidator');
const { generateObservationFingerprint } = require('../services/benchmarks/benchmarkFingerprint');
const { ingestBenchmarkObservation } = require('../services/benchmarks/benchmarkIngestion');

function printUsage() {
  console.log(`
Project Aura — First-Party Benchmark Ingestion Tool
---------------------------------------------------
Usage:
  node scripts/ingestBenchmarks.js [options]

Options:
  -f, --file <path>        Path to .csv or .json benchmark file (required)
  -d, --dry-run            Validate and report without writing to database (recommended first)
  -s, --session <id>       Custom benchmark session ID (optional)
  -h, --help               Display this help message

Examples:
  node scripts/ingestBenchmarks.js --file ./data/my-run.csv --dry-run
  node scripts/ingestBenchmarks.js --file ./data/my-run.json
`);
}

function parseArgs(args) {
  const options = {
    file: null,
    dryRun: false,
    sessionId: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') {
      printUsage();
      process.exit(0);
    } else if (arg === '-f' || arg === '--file') {
      options.file = args[++i];
    } else if (arg === '-d' || arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '-s' || arg === '--session') {
      options.sessionId = args[++i];
    } else if (arg.startsWith('--file=')) {
      options.file = arg.split('=')[1];
    } else if (arg.startsWith('--session=')) {
      options.sessionId = arg.split('=')[1];
    }
  }

  return options;
}

async function runIngestion(options = {}) {
  const isDryRun = Boolean(options.dryRun);
  const filePath = options.file;

  if (!filePath) {
    console.error('\n❌ ERROR: --file argument is required.\n');
    printUsage();
    return { success: false, exitCode: 1 };
  }

  const startTime = Date.now();
  const sessionId = options.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const sessionContext = {
    benchmarkSessionId: sessionId,
    sessionTime: new Date(),
  };

  console.log('\n==================================================');
  console.log(' PROJECT AURA — FIRST-PARTY BENCHMARK INGESTION');
  console.log('==================================================');
  console.log(`Target File:   ${path.resolve(process.cwd(), filePath)}`);
  console.log(`Mode:          ${isDryRun ? 'DRY-RUN (Validation only — 0 DB writes)' : 'LIVE INGESTION'}`);
  console.log(`Session ID:    ${sessionId}`);
  console.log('--------------------------------------------------');

  // 1. Parse File
  let parseResult;
  try {
    parseResult = await parseBenchmarkFile(filePath);
  } catch (err) {
    console.error(`\n❌ FILE PARSE ERROR [${err.code || 'PARSE_ERROR'}]: ${err.message}\n`);
    return { success: false, exitCode: 1 };
  }

  const rawRows = parseResult.rows;
  console.log(`Found ${rawRows.length} record(s) in file (${parseResult.fileExtension}).\n`);

  if (rawRows.length === 0) {
    console.log('File is empty. Nothing to ingest.');
    return { success: true, exitCode: 0 };
  }

  // 2. Connect to MongoDB
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hardware_bottleneck';
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  } catch (err) {
    console.error(`\n❌ SYSTEM FAILURE: Could not connect to MongoDB: ${err.message}\n`);
    return { success: false, exitCode: 1 };
  }

  // 3. Process Rows
  const stats = {
    rowsRead: rawRows.length,
    accepted: 0,
    rejected: 0,
    duplicates: 0,
    repeatedMeasurements: 0,
    trainingEligible: 0,
    evaluationEligible: 0,
    inserted: 0,
    databaseWrites: 0,
  };

  const previewTable = [];
  const rejectedReport = [];

  for (let idx = 0; idx < rawRows.length; idx++) {
    const rowNum = idx + 1;
    const rawRow = rawRows[idx];

    // Step A: Parse, normalize, and resolve canonical references
    const normRes = await normalizeAndResolveRow(rawRow, idx, sessionContext);
    if (!normRes.valid) {
      stats.rejected++;
      rejectedReport.push({
        row: rowNum,
        code: normRes.error.code,
        reason: normRes.error.message,
      });
      continue;
    }

    // Step B: Validate with benchmarkValidator
    let validatedData;
    try {
      validatedData = await validateBenchmarkObservation(normRes.payload, { isFirstParty: true });
    } catch (err) {
      stats.rejected++;
      rejectedReport.push({
        row: rowNum,
        code: 'VALIDATION_FAILED',
        reason: err.message,
      });
      continue;
    }

    // Step C: Check duplicate vs repeated measurement
    const fingerprint = generateObservationFingerprint(validatedData);
    const existingWithFingerprint = await GameBenchmark.findOne({ observationFingerprint: fingerprint }).lean();
    const existingConfig = await GameBenchmark.findOne({
      gameId: validatedData.gameId,
      cpuHardwareId: validatedData.cpuHardwareId,
      gpuHardwareId: validatedData.gpuHardwareId,
      'display.width': validatedData.display.width,
      'display.height': validatedData.display.height,
      'graphics.normalizedPreset': validatedData.graphics.normalizedPreset,
      'rayTracing.enabled': validatedData.rayTracing.enabled,
      'upscaling.enabled': validatedData.upscaling.enabled,
      'frameGeneration.enabled': validatedData.frameGeneration.enabled,
    }).lean();

    let isDuplicate = false;
    let isRepeated = false;

    if (existingWithFingerprint) {
      if (
        existingWithFingerprint.provenance?.sourceRecordId === validatedData.provenance?.sourceRecordId &&
        Math.abs(existingWithFingerprint.performance.avgFps - validatedData.performance.avgFps) < 0.01
      ) {
        isDuplicate = true;
        stats.duplicates++;
      }
    }

    if (!isDuplicate && existingConfig) {
      isRepeated = true;
      stats.repeatedMeasurements++;
    }

    stats.accepted++;
    if (validatedData.trainingEligible) stats.trainingEligible++;
    if (validatedData.evaluationEligible) stats.evaluationEligible++;

    previewTable.push({
      Row: rowNum,
      Game: validatedData.rawGameName || validatedData.gameSlug,
      CPU: (validatedData.rawCpuString || validatedData.cpuHardwareId).substring(0, 16),
      GPU: (validatedData.rawGpuString || validatedData.gpuHardwareId).substring(0, 16),
      Res: `${validatedData.display.width}x${validatedData.display.height}`,
      Preset: validatedData.graphics.normalizedPreset,
      RT: validatedData.rayTracing.enabled ? 'YES' : 'NO',
      DLSS: validatedData.upscaling.enabled ? validatedData.upscaling.technology : 'OFF',
      FG: validatedData.frameGeneration.enabled ? 'YES' : 'NO',
      AvgFPS: `${validatedData.performance.avgFps}`,
      Train: validatedData.trainingEligible ? 'YES' : 'NO',
      Status: isDuplicate ? 'DUPLICATE' : isRepeated ? 'REPEATED' : 'NEW',
    });

    // Step D: Write to DB if not dry-run and not duplicate
    if (!isDryRun) {
      if (!isDuplicate) {
        try {
          const ingestRes = await ingestBenchmarkObservation(normRes.payload, { isFirstParty: true });
          if (!ingestRes.isDuplicate) {
            stats.inserted++;
            stats.databaseWrites++;
          }
        } catch (dbErr) {
          console.error(`\n❌ SYSTEM FAILURE on row ${rowNum}: ${dbErr.message}`);
          throw dbErr;
        }
      }
    }
  }

  // 4. Output Summary & Reports
  if (previewTable.length > 0) {
    console.log('ACCEPTED OBSERVATIONS PREVIEW:');
    console.table(previewTable);
  }

  if (rejectedReport.length > 0) {
    console.log('\nREJECTED ROWS REPORT:');
    console.log('--------------------------------------------------');
    rejectedReport.forEach((r) => {
      console.log(`  Row ${r.row}: [${r.code}] ${r.reason}`);
    });
    console.log('--------------------------------------------------');
  }

  const durationMs = Date.now() - startTime;

  console.log('\n==================================================');
  console.log(' INGESTION SUMMARY');
  console.log('==================================================');
  console.log(`File:                  ${path.basename(filePath)}`);
  console.log(`Mode:                  ${isDryRun ? 'DRY-RUN (0 DB writes)' : 'LIVE INGESTION'}`);
  console.log(`Rows read:             ${stats.rowsRead}`);
  console.log(`Accepted:              ${stats.accepted}`);
  console.log(`Rejected:              ${stats.rejected}`);
  console.log(`Duplicates:            ${stats.duplicates}`);
  console.log(`Repeated measurements: ${stats.repeatedMeasurements}`);
  console.log(`Training eligible:     ${stats.trainingEligible}`);
  console.log(`Evaluation eligible:   ${stats.evaluationEligible}`);
  console.log(`Inserted:              ${stats.inserted}`);
  console.log(`Database writes:       ${stats.databaseWrites}`);
  console.log(`Time taken:            ${durationMs}ms`);
  console.log('==================================================\n');

  return {
    success: stats.rejected === 0,
    stats,
    exitCode: 0,
  };
}

// Execute if run directly from CLI
if (require.main === module) {
  const options = parseArgs(process.argv.slice(2));
  runIngestion(options)
    .then(async (res) => {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      process.exit(res.exitCode);
    })
    .catch(async (err) => {
      console.error('\n❌ FATAL INGESTION ERROR:', err);
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      process.exit(1);
    });
}

module.exports = {
  runIngestion,
  parseArgs,
};
