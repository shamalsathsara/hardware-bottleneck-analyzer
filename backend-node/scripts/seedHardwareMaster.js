/**
 * Idempotent Hardware Master Seeder for Project Aura V2.
 * 
 * Usage:
 *   # Dry run preview (no database writes)
 *   node scripts/seedHardwareMaster.js --dry-run
 * 
 *   # Live seed/upsert
 *   node scripts/seedHardwareMaster.js
 */

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const HardwareCpu = require('../models/HardwareCpu');
const HardwareGpu = require('../models/HardwareGpu');
const {
  validateCpuSpecs,
  validateGpuSpecs,
  detectAliasCollisions,
} = require('../services/hardware/hardwareNormalizer');

const CPU_SEED_FILE = path.join(__dirname, '..', 'data', 'hardware', 'cpus.seed.json');
const GPU_SEED_FILE = path.join(__dirname, '..', 'data', 'hardware', 'gpus.seed.json');

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
  };
}

async function seedHardware() {
  const options = parseArgs();
  const mongoUri = process.env.MONGO_URI;

  console.log('====================================================');
  console.log('🖥️  PROJECT AURA V2 — HARDWARE MASTER SEEDER');
  console.log('====================================================');
  console.log(` Mode:    ${options.dryRun ? 'DRY RUN (Preview only)' : 'LIVE SEED (Upserting to MongoDB)'}`);
  console.log('----------------------------------------------------');

  if (!fs.existsSync(CPU_SEED_FILE) || !fs.existsSync(GPU_SEED_FILE)) {
    console.error('❌ Seed files missing. Check data/hardware directory.');
    process.exit(1);
  }

  const rawCpus = JSON.parse(fs.readFileSync(CPU_SEED_FILE, 'utf-8'));
  const rawGpus = JSON.parse(fs.readFileSync(GPU_SEED_FILE, 'utf-8'));

  console.log(` Loaded ${rawCpus.length} CPU records and ${rawGpus.length} GPU records from seed files.`);

  // 1. Validation & Collision Audits
  console.log('\n🔍 Running pre-seed validation & alias collision audit...');
  
  const cpuValidationErrors = [];
  for (const cpu of rawCpus) {
    const res = validateCpuSpecs(cpu);
    if (!res.isValid) {
      cpuValidationErrors.push({ id: cpu.hardwareId, errors: res.errors });
    }
  }

  const gpuValidationErrors = [];
  for (const gpu of rawGpus) {
    const res = validateGpuSpecs(gpu);
    if (!res.isValid) {
      gpuValidationErrors.push({ id: gpu.hardwareId, errors: res.errors });
    }
  }

  const cpuCollisions = detectAliasCollisions(rawCpus);
  const gpuCollisions = detectAliasCollisions(rawGpus);

  if (cpuValidationErrors.length > 0 || gpuValidationErrors.length > 0) {
    console.error('❌ Validation Errors Detected:');
    console.error('CPU Errors:', cpuValidationErrors);
    console.error('GPU Errors:', gpuValidationErrors);
    process.exit(1);
  }

  if (cpuCollisions.length > 0 || gpuCollisions.length > 0) {
    console.error('❌ Alias Collisions Detected across distinct hardware SKUs:');
    console.error('CPU Collisions:', cpuCollisions);
    console.error('GPU Collisions:', gpuCollisions);
    process.exit(1);
  }

  console.log('✅ Validation passed: 0 validation errors, 0 alias collisions.\n');

  if (options.dryRun) {
    console.log('----------------------------------------------------');
    console.log('📊 DRY RUN SEED PREVIEW');
    console.log('----------------------------------------------------');
    console.log(` CPUs to insert/upsert: ${rawCpus.length}`);
    console.log(` GPUs to insert/upsert: ${rawGpus.length}`);
    console.log(' Status: DRY RUN COMPLETED SUCCESSFULLY (No database writes).');
    return;
  }

  if (!mongoUri) {
    console.error('❌ MONGO_URI is missing from environment.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas.\n');

    // 2. Upsert CPUs
    let cpuCreated = 0;
    let cpuUpdated = 0;
    for (const cpu of rawCpus) {
      const existing = await HardwareCpu.findOne({ hardwareId: cpu.hardwareId });
      if (existing) {
        await HardwareCpu.updateOne({ hardwareId: cpu.hardwareId }, { $set: cpu });
        cpuUpdated++;
      } else {
        await HardwareCpu.create(cpu);
        cpuCreated++;
      }
    }

    // 3. Upsert GPUs
    let gpuCreated = 0;
    let gpuUpdated = 0;
    for (const gpu of rawGpus) {
      const existing = await HardwareGpu.findOne({ hardwareId: gpu.hardwareId });
      if (existing) {
        await HardwareGpu.updateOne({ hardwareId: gpu.hardwareId }, { $set: gpu });
        gpuUpdated++;
      } else {
        await HardwareGpu.create(gpu);
        gpuCreated++;
      }
    }

    console.log('----------------------------------------------------');
    console.log('📊 HARDWARE MASTER SEED SUMMARY');
    console.log('----------------------------------------------------');
    console.log(` CPUs Processed: ${rawCpus.length} (Created: ${cpuCreated}, Updated: ${cpuUpdated})`);
    console.log(` GPUs Processed: ${rawGpus.length} (Created: ${gpuCreated}, Updated: ${gpuUpdated})`);
    console.log('----------------------------------------------------');
    console.log('✅ Hardware Master seed completed successfully.');
  } catch (error) {
    console.error('❌ Fatal Seeder Error:', error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('Database connection closed.');
    }
  }
}

if (require.main === module) {
  seedHardware();
}

module.exports = seedHardware;
