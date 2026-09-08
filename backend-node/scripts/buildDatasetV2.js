#!/usr/bin/env node
/**
 * Project Aura V2 — Milestone V2.1.3E
 * Dataset V2 Builder CLI Script
 *
 * Usage:
 *   node scripts/buildDatasetV2.js [options]
 *   npm run dataset:v2:build -- [options]
 *
 * Options:
 *   --dry-run               Validate and build in-memory without writing files to disk
 *   --output <dir>          Custom output directory (default: data/generated/dataset-v2)
 *   --limit <n>             Limit the number of observations to process
 *   --protocol <name>       Split protocol: grouped_source (default), unseen_hardware, unseen_game
 *   --seed <n>              Deterministic random seed for splitting (default: 42)
 *   --help                  Show help message
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const { buildDatasetV2 } = require('../services/datasetV2/datasetV2Builder');
const { DEFAULT_OUTPUT_DIR } = require('../services/datasetV2/datasetExporter');

function parseArgs(args) {
  const options = {
    dryRun: false,
    outputDir: DEFAULT_OUTPUT_DIR,
    limit: 0,
    protocol: 'grouped_source',
    seed: 42,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--output' && i + 1 < args.length) {
      options.outputDir = path.resolve(process.cwd(), args[++i]);
    } else if (arg === '--limit' && i + 1 < args.length) {
      options.limit = parseInt(args[++i], 10) || 0;
    } else if (arg === '--protocol' && i + 1 < args.length) {
      options.protocol = args[++i];
    } else if (arg === '--seed' && i + 1 < args.length) {
      options.seed = parseInt(args[++i], 10) || 42;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
==================================================
 PROJECT AURA — DATASET V2 BUILDER CLI
==================================================

Usage:
  npm run dataset:v2:build -- [options]
  node scripts/buildDatasetV2.js [options]

Options:
  --dry-run               Validate pipeline without writing dataset files to disk
  --output <dir>          Output directory for generated dataset files
  --limit <n>             Maximum number of benchmark observations to process
  --protocol <name>       Split protocol: grouped_source | unseen_hardware | unseen_game
  --seed <n>              Deterministic random seed for data splitting (default: 42)
  --help, -h              Display this help message
`);
}

async function runCli() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  console.log('\n==================================================');
  console.log(' PROJECT AURA — DATASET V2 BUILDER');
  console.log('==================================================');
  console.log(`Mode:           ${options.dryRun ? 'DRY-RUN (0 files written)' : 'LIVE EXPORT'}`);
  console.log(`Split Protocol: ${options.protocol}`);
  console.log(`Random Seed:    ${options.seed}`);
  if (options.limit > 0) {
    console.log(`Limit:          ${options.limit} observations`);
  }
  console.log('--------------------------------------------------');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hardware_bottleneck';
  let connectedHere = false;

  try {
    if (mongoose.connection.readyState === 0) {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(mongoUri);
      connectedHere = true;
    }

    const result = await buildDatasetV2(options);

    console.log('\n==================================================');
    console.log(' DATASET V2 BUILD SUMMARY');
    console.log('==================================================');
    console.log(`Total input observations:        ${result.totalInputObservations}`);
    console.log(`Training-eligible observations:  ${result.trainingEligibleObservations}`);
    console.log(`Rows successfully built:         ${result.acceptedRowCount}`);
    console.log(`Rows rejected:                   ${result.rejectedRowCount}`);
    console.log(`Feature count per row:           ${result.report.summary.featureCount}`);
    console.log(`Target count per row:            ${result.report.summary.targetCount}`);
    console.log('--------------------------------------------------');

    if (result.rejectedRowCount > 0) {
      console.log('Rejection Breakdown:');
      for (const [reason, count] of Object.entries(result.report.rejectionBreakdown)) {
        if (count > 0) {
          console.log(`  - ${reason.padEnd(32)}: ${count}`);
        }
      }
      console.log('--------------------------------------------------');
    }

    if (Object.keys(result.report.missingFeatureFrequencies).length > 0) {
      console.log('Missing Required Features:');
      for (const [feat, count] of Object.entries(result.report.missingFeatureFrequencies)) {
        console.log(`  - ${feat.padEnd(32)}: ${count}`);
      }
      console.log('--------------------------------------------------');
    }

    if (result.report.splitSummary) {
      console.log('Split Summary:');
      console.log(`  Protocol: ${result.report.splitSummary.protocol}`);
      console.log(`  Seed:     ${result.report.splitSummary.seed}`);
      if (result.report.splitSummary.counts) {
        console.log(`  Train:    ${result.report.splitSummary.counts.train}`);
        console.log(`  Val:      ${result.report.splitSummary.counts.val}`);
        console.log(`  Test:     ${result.report.splitSummary.counts.test}`);
      }
      console.log('--------------------------------------------------');
    }

    console.log(`Status: ${result.report.status}`);

    if (result.acceptedRowCount === 0) {
      console.log('\nNOTICE:');
      console.log('Eligible observations: 0');
      console.log('Exported training rows: 0');
      console.log('\nStatus:');
      console.log('INSUFFICIENT_REAL_DATA');
      console.log('\nNo synthetic rows were generated.');
      console.log('Model V2 training remains blocked.\n');
    } else if (!options.dryRun) {
      console.log('\nArtifacts Created:');
      if (result.artifacts.csvPath) {
        console.log(`  CSV:    ${result.artifacts.csvPath}`);
      }
      if (result.artifacts.reportPath) {
        console.log(`  Report: ${result.artifacts.reportPath}`);
      }
    }

    console.log('==================================================\n');
  } catch (err) {
    console.error('\n[FATAL ERROR] Dataset V2 Build failed:', err.message);
    if (process.env.DEBUG) {
      console.error(err);
    }
    process.exitCode = 1;
  } finally {
    if (connectedHere && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  runCli();
}

module.exports = {
  parseArgs,
  runCli,
};
