/**
 * CLI Runner for Project Aura IGDB Game Catalog Synchronization.
 * 
 * Usage:
 *   node scripts/syncIgdbGames.js --limit=50 --dry-run
 *   node scripts/syncIgdbGames.js --limit=50
 *   npm run games:sync -- --limit=50
 */

const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.IGDB_CLIENT_ID) {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
}

const { syncIgdbGames } = require('../services/igdb/igdbSyncService');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    limit: 50,
    offset: 0,
    dryRun: false,
    mode: 'initial',
  };

  for (const arg of args) {
    if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg.startsWith('--limit=')) {
      const val = parseInt(arg.split('=')[1], 10);
      if (!isNaN(val) && val > 0) options.limit = val;
    } else if (arg.startsWith('--offset=')) {
      const val = parseInt(arg.split('=')[1], 10);
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
  console.log('🎮 PROJECT AURA V2 — IGDB GAME CATALOG SYNC');
  console.log('====================================================');
  console.log(` Mode:     ${options.mode}`);
  console.log(` Limit:    ${options.limit}`);
  console.log(` Offset:   ${options.offset}`);
  console.log(` Dry Run:  ${options.dryRun ? 'YES (No database writes)' : 'NO (Live database upsert)'}`);
  console.log('----------------------------------------------------');

  if (!mongoUri) {
    console.error('❌ MONGO_URI is missing from environment.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.');

    const startTime = Date.now();
    const result = await syncIgdbGames(options);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n----------------------------------------------------');
    console.log('📊 SYNC EXECUTION RESULTS');
    console.log('----------------------------------------------------');
    console.log(` Fetched from IGDB:   ${result.fetched}`);
    console.log(` Successfully Mapped: ${result.mapped}`);
    console.log(` Created (New):       ${result.created}`);
    console.log(` Updated (Merged):    ${result.updated}`);
    console.log(` Skipped:             ${result.skipped}`);
    console.log(` Failed:              ${result.failed}`);
    console.log(` Execution Time:      ${duration}s`);
    console.log('----------------------------------------------------');

    if (result.details.length > 0) {
      console.log('\nSample Processed Records:');
      const sample = result.details.slice(0, 10);
      for (const item of sample) {
        console.log(` • [${item.action}] ${item.name} (IGDB ID: ${item.igdbId}) ${item.reason ? `-> Reason: ${item.reason}` : ''}`);
      }
      if (result.details.length > 10) {
        console.log(` ... and ${result.details.length - 10} more records.`);
      }
    }

    if (result.errors.length > 0) {
      console.log('\n⚠️ Errors encountered during sync:');
      for (const err of result.errors) {
        console.error(` - ${err}`);
      }
    }

    console.log('\n✅ Sync process finished successfully.');
  } catch (error) {
    console.error('\n❌ Fatal Sync Error:', error.message);
    process.exitCode = 1;
  } finally {
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
