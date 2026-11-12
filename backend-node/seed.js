// --------------------------------------------------------------------------
// LEGACY HARDWARE SEEDING SCRIPT
// --------------------------------------------------------------------------
// Loads the 4 legacy CPU/GPU CSV files into the `cpus` / `gpus` collections.
// WARNING: replaces all existing legacy CPU/GPU documents.
// Usage: node seed.js

const path = require('path');
const mongoose = require('mongoose');
const csv = require('csvtojson');
if (require.main === module) require('dotenv').config({ path: path.join(__dirname, '.env') });

const { CPU, GPU } = require('./models/Hardware');

const NUMERIC_CPU_FIELDS = ['price', 'cpuMark', 'cpuValue', 'threadMark', 'threadValue', 'TDP', 'powerPerf',
  'cores', 'threads', 'singleScore', 'multiScore', 'baseClock', 'turboClock', 'testDate'];
const NUMERIC_GPU_FIELDS = ['G3Dmark', 'G2Dmark', 'price', 'gpuValue', 'TDP', 'powerPerformance', 'testDate',
  'CUDA', 'Metal', 'OpenCL', 'Vulkan'];

/** CSV values arrive as strings; store numbers so sorting / max queries work. */
function coerceNumbers(row, fields) {
  const out = { ...row };
  for (const field of fields) {
    if (out[field] === undefined || out[field] === '') {
      delete out[field];
      continue;
    }
    const n = Number(out[field]);
    if (Number.isFinite(n)) out[field] = n;
  }
  return out;
}

const fromData = (...parts) => csv().fromFile(path.join(__dirname, ...parts));

/** Reads and normalizes the legacy CSV catalogs. */
async function loadLegacyHardware() {
  const cpus = [
    ...(await fromData('CPU', 'cpu_data1.csv')),
    ...(await fromData('CPU', 'cpu_data2.csv')),
  ].map((row) => coerceNumbers(row, NUMERIC_CPU_FIELDS));

  const gpuData1 = (await fromData('GPU', 'gpu_data1.csv')).map((g) => ({
    ...g,
    Device: g.gpuName,
    // gpu_data1 has no compute score; approximate it from G3Dmark on the CUDA scale.
    CUDA: g.CUDA || (Number(g.G3Dmark) ? Number(g.G3Dmark) * 10 : ''),
  }));
  const gpus = [...gpuData1, ...(await fromData('GPU', 'gpu_data2.csv'))]
    .map((row) => coerceNumbers(row, NUMERIC_GPU_FIELDS));

  return { cpus, gpus };
}

async function seedDatabase() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set.');

  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);

  const { cpus, gpus } = await loadLegacyHardware();

  console.log('Replacing legacy hardware collections...');
  await CPU.deleteMany({});
  await GPU.deleteMany({});
  await CPU.insertMany(cpus);
  await GPU.insertMany(gpus);

  console.log(`Seeded ${cpus.length} CPUs and ${gpus.length} GPUs.`);
}

if (require.main === module) {
  seedDatabase()
    .then(() => mongoose.disconnect())
    .catch(async (error) => {
      console.error('Seeding failed:', error.message);
      await mongoose.disconnect();
      process.exit(1);
    });
}

module.exports = { loadLegacyHardware };
