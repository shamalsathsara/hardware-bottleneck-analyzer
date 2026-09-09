const fs = require('fs');
const path = require('path');
const { normalizeSkuKey } = require('../hardware/hardwareSearchService');

const CSV_PATH = path.join(__dirname, '../../../ai-python/ml-model-v2/data/processed/fps_dataset_v2_clean.csv');

let cache = null;

function loadCatalog() {
  if (cache) return cache;

  const cpusBySku = {};
  const cpusByName = {};
  const gpusBySku = {};
  const gpusByName = {};

  if (fs.existsSync(CSV_PATH)) {
    const content = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = content.split('\n');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',');

      const cName = cols[0];
      const gName = cols[1];

      const cSku = normalizeSkuKey(cName);
      const gSku = normalizeSkuKey(gName);

      if (!cpusByName[cName.toLowerCase()]) {
        const cpuSpecs = {
          CpuNumberOfCores: Number(cols[3]),
          CpuNumberOfThreads: Number(cols[4]),
          CpuFrequency: Number(cols[5]),
          CpuTurboClock: Number(cols[6]),
          CpuCacheL3: Number(cols[7]),
          CpuTDP: Number(cols[8]),
        };
        cpusByName[cName.toLowerCase()] = cpuSpecs;
        if (cSku && !cpusBySku[cSku]) {
          cpusBySku[cSku] = cpuSpecs;
        }
      }

      if (!gpusByName[gName.toLowerCase()]) {
        const gpuSpecs = {
          GpuMemorySize: Number(cols[9]),
          GpuBandwidth: Number(cols[10]),
          GpuMemoryBus: Number(cols[11]),
          GpuNumberOfShadingUnits: Number(cols[12]),
          GpuBaseClock: Number(cols[13]),
          GpuBoostClock: Number(cols[14]),
          GpuNumberOfROPs: Number(cols[15]),
          GpuFP32Performance: Number(cols[16]),
        };
        gpusByName[gName.toLowerCase()] = gpuSpecs;
        if (gSku && !gpusBySku[gSku]) {
          gpusBySku[gSku] = gpuSpecs;
        }
      }
    }
  }

  // Project-verified physical specifications from ai-python test suites and cpu_data2.csv
  const PROJECT_VERIFIED_CPUS = {
    'i59500': {
      CpuNumberOfCores: 6,
      CpuNumberOfThreads: 6,
      CpuFrequency: 3000,
      CpuTurboClock: 4400,
      CpuCacheL3: 9,
      CpuTDP: 65,
    },
    'i59500f': {
      CpuNumberOfCores: 6,
      CpuNumberOfThreads: 6,
      CpuFrequency: 3000,
      CpuTurboClock: 4400,
      CpuCacheL3: 9,
      CpuTDP: 65,
    },
    'i310105': {
      CpuNumberOfCores: 4,
      CpuNumberOfThreads: 8,
      CpuFrequency: 3700,
      CpuTurboClock: 4400,
      CpuCacheL3: 6,
      CpuTDP: 65,
    },
    'i310105f': {
      CpuNumberOfCores: 4,
      CpuNumberOfThreads: 8,
      CpuFrequency: 3700,
      CpuTurboClock: 4400,
      CpuCacheL3: 6,
      CpuTDP: 65,
    },
  };

  for (const [sku, specs] of Object.entries(PROJECT_VERIFIED_CPUS)) {
    if (!cpusBySku[sku]) {
      cpusBySku[sku] = specs;
    }
  }

  cache = { cpusBySku, cpusByName, gpusBySku, gpusByName };
  return cache;
}

function findDatasetCpu(name) {
  if (!name || typeof name !== 'string') return null;
  const { cpusByName, cpusBySku } = loadCatalog();
  const lower = name.toLowerCase().trim();
  if (cpusByName[lower]) return cpusByName[lower];

  const sku = normalizeSkuKey(name);
  if (sku && cpusBySku[sku]) return cpusBySku[sku];

  return null;
}

function findDatasetGpu(name) {
  if (!name || typeof name !== 'string') return null;
  const { gpusByName, gpusBySku } = loadCatalog();
  const lower = name.toLowerCase().trim();
  if (gpusByName[lower]) return gpusByName[lower];

  const sku = normalizeSkuKey(name);
  if (sku && gpusBySku[sku]) return gpusBySku[sku];

  return null;
}

module.exports = {
  findDatasetCpu,
  findDatasetGpu,
  loadCatalog,
};
