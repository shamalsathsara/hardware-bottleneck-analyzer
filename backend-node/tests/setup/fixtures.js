/**
 * Loads the project's own hardware data (master seed JSON + legacy CSVs) into
 * the in-memory test database, so tests never depend on a live Atlas cluster.
 */
const HardwareCpu = require('../../models/HardwareCpu');
const HardwareGpu = require('../../models/HardwareGpu');
const { CPU, GPU } = require('../../models/Hardware');
const Game = require('../../models/Game');
const { loadLegacyHardware } = require('../../seed');
const cpuSeed = require('../../data/hardware/cpus.seed.json');
const gpuSeed = require('../../data/hardware/gpus.seed.json');
const gameSeed = require('../../seeds/games.json');

async function seedHardwareFixtures() {
  await Promise.all([HardwareCpu.deleteMany({}), HardwareGpu.deleteMany({}), CPU.deleteMany({}), GPU.deleteMany({})]);
  const { cpus, gpus } = await loadLegacyHardware();
  await Promise.all([
    HardwareCpu.insertMany(cpuSeed),
    HardwareGpu.insertMany(gpuSeed),
    CPU.insertMany(cpus),
    GPU.insertMany(gpus),
  ]);
}

async function seedGameFixtures() {
  await Game.deleteMany({ slug: { $in: gameSeed.map((g) => g.slug) } });
  await Game.insertMany(gameSeed);
}

module.exports = { seedHardwareFixtures, seedGameFixtures };
