/**
 * Production-Ready CLI Runner for Project Aura IGDB Game Catalog Synchronization.
 * 
 * Usage:
 *   # Dry run for 200 games in batches of 50
 *   npm run games:sync -- --limit=200 --batch-size=50 --dry-run
 * 
 *   # Live sync for 200 games
 *   npm run games:sync -- --limit=200 --batch-size=50
 * 
 *   # Resume an interrupted sync
 *   npm run games:sync -- --resume
 * 
 *   # Force fresh start
 *   npm run games:sync -- --limit=200 --fresh
 */

const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.IGDB_CLIENT_ID) {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
}

const { syncIgdbGames } = require('../services/igdb/igdbSyncService');
const { loadCheckpoint } = require('../services/igdb/igdbCheckpoint');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    limit: 50,
    batchSize: 50,
    offset: 0,
    dryRun: false,
    resume: false,
    fresh: false,
    mode: 'initial',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--resume' || arg === '-r') {
      options.resume = true;
    } else if (arg === '--fresh' || arg === '-f') {
      options.fresh = true;
    } else if (arg.startsWith('--limit=')) {
      const val = parseInt(arg.split('=')[1], 10);
      if (!isNaN(val) && val > 0) options.limit = val;
    } else if (arg === '--limit' && args[i + 1]) {
      const val = parseInt(args[++i], 10);
      if (!isNaN(val) && val > 0) options.limit = val;
    } else if (arg.startsWith('--batch-size=')) {
      const val = parseInt(arg.split('=')[1], 10);
      if (!isNaN(val) && val > 0) options.batchSize = val;
    } else if (arg === '--batch-size' && args[i + 1]) {
      const val = parseInt(args[++i], 10);
      if (!isNaN(val) && val > 0) options.batchSize = val;
    } else if (arg.startsWith('--offset=')) {
      const val = parseInt(arg.split('=')[1], 10);
      if (!isNaN(val) && val >= 0) options.offset = val;
    } else if (arg === '--offset' && args[i + 1]) {
      const val = parseInt(args[++i], 10);
      if (!isNaN(val) && val >= 0) options.offset = val;
    } else if (arg.startsWith('--mode=')) {
      options.mode = arg.split('=')[1].trim();
    }
  }

  return options;
}

async function run() {
  const options = parseArgs();
  const mongoUri = process.env.MONGO_URI;

  console.log('====================================================');
  console.log('🎮 PROJECT AURA V2 — IGDB LARGE CATALOG SYNC');
  console.log('====================================================');

  if (options.resume) {
    const saved = loadCheckpoint();
    if (saved) {
      console.log(` 🔄 Resuming Sync Run: ${saved.syncRunId}`);
      console.log(`    Last Offset: ${saved.currentOffset} | Processed: ${saved.processedTotal}/${saved.requestedLimit}`);
    } else {
      console.log(' ℹ️ No active checkpoint found to resume. Starting fresh sync.');
    }
  } else {
    console.log(` Mode:        ${options.mode}`);
    console.log(` Total Limit: ${options.limit}`);
    console.log(` Batch Size:  ${options.batchSize}`);
    console.log(` Start Offset:${options.offset}`);
    console.log(` Dry Run:     ${options.dryRun ? 'YES (No database writes)' : 'NO (Live database upsert)'}`);
  }
  console.log('----------------------------------------------------');

  if (!mongoUri) {
    console.error('❌ MONGO_URI is missing from environment.');
    process.exit(1);
  }

  let isInterrupted = false;

  const handleInterrupt = () => {
    if (isInterrupted) {
      console.log('\n⚠️ Force terminating process...');
      process.exit(1);
    }
    isInterrupted = true;
    console.log('\n🛑 Graceful shutdown requested (SIGINT/SIGTERM).');
    console.log('   Completing the active batch and saving checkpoint...');
  };

  process.on('SIGINT', handleInterrupt);
  process.on('SIGTERM', handleInterrupt);

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas.\n');

    const startTime = Date.now();

    const result = await syncIgdbGames({
      ...options,
      shouldStop: () => isInterrupted,
      onBatchComplete: (batchInfo, state) => {
        const pct = Math.min(100, Math.round((state.processedTotal / state.requestedLimit) * 100));
        console.log(
          ` [Batch ${batchInfo.batchIndex}] Fetched: ${batchInfo.fetched} | Processed: ${state.processedTotal}/${state.requestedLimit} (${pct}%) | ` +
          `Created: ${batchInfo.created} | Updated: ${batchInfo.updated} | Offset: ${state.currentOffset}`
        );
      },
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n----------------------------------------------------');
    console.log('📊 FINAL SYNC EXECUTION SUMMARY');
    console.log('----------------------------------------------------');
    console.log(` Run ID:            ${result.syncRunId}`);
    console.log(` Status:            ${result.status.toUpperCase()}`);
    console.log(` Mode:              ${result.mode}`);
    console.log(` Requested Limit:   ${result.requestedLimit}`);
    console.log(` Total Processed:   ${result.fetched}`);
    console.log(` Created (New):     ${result.created}`);
    console.log(` Updated (Merged):  ${result.updated}`);
    console.log(` Skipped:           ${result.skipped}`);
    console.log(` Failed:            ${result.failed}`);
    console.log(` Batches Completed: ${result.batchesCompleted}`);
    console.log(` Execution Time:    ${duration}s`);
    console.log('----------------------------------------------------');

    if (result.status === 'interrupted') {
      console.log('\n⚠️ Synchronization was interrupted before completion.');
      console.log('   You can resume from this exact point by running:');
      console.log('   npm run games:sync -- --resume\n');
    } else if (result.status === 'failed') {
      console.error(`\n❌ Synchronization stopped with error: ${result.lastError}`);
      console.log('   You can resume once the issue is resolved by running:');
      console.log('   npm run games:sync -- --resume\n');
      process.exitCode = 1;
    } else {
      console.log('\n✅ All requested batches completed successfully.');
    }
  } catch (error) {
    console.error('\n❌ Fatal Sync Error:', error.message);
    process.exitCode = 1;
  } finally {
    process.removeListener('SIGINT', handleInterrupt);
    process.removeListener('SIGTERM', handleInterrupt);

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('Database connection closed.');
    }
  }
}

if (require.main === module) {
  run();
}

module.exports = run;
