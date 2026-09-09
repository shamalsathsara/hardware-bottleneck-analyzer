const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const axios = require('axios');
const HardwareCpu = require('../models/HardwareCpu');
const HardwareGpu = require('../models/HardwareGpu');
const { CPU, GPU } = require('../models/Hardware');
const { resolveCpuSpecs, resolveGpuSpecs, normalizeHardwareSku, buildHardwareCatalog } = require('../services/datasetV2/hardwareCatalogIndex');
const { resolveModelV2Payload } = require('../services/datasetV2/modelV2Resolver');
const { normalizeSkuKey } = require('../services/hardware/hardwareSearchService');

const PYTHON_AI_URL = process.env.AURA_AI_URL || 'http://127.0.0.1:5000';

async function runAudit() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB.');

  // Pre-build hardware catalog
  buildHardwareCatalog();

  // 1. Fetch all CPUs
  const masterCpus = await HardwareCpu.find().lean();
  const legacyCpus = await CPU.find().lean();

  const searchableCpus = [];
  const seenCpuSkus = new Set();

  for (const m of masterCpus) {
    const sku = normalizeSkuKey(m.canonicalName);
    if (sku) seenCpuSkus.add(sku);
    searchableCpus.push({
      name: m.canonicalName,
      source: 'master',
      segment: m.marketSegment || 'desktop',
      raw: m,
    });
  }

  for (const l of legacyCpus) {
    const name = l.cpuName || '';
    const sku = normalizeSkuKey(name);
    if (sku && !seenCpuSkus.has(sku)) {
      seenCpuSkus.add(sku);
      searchableCpus.push({
        name,
        source: 'legacy',
        segment: 'desktop',
        raw: l,
      });
    }
  }

  console.log(`Total Searchable Unique CPUs: ${searchableCpus.length}`);

  // 2. Fetch all GPUs
  const masterGpus = await HardwareGpu.find().lean();
  const legacyGpus = await GPU.find().lean();

  const searchableGpus = [];
  const seenGpuSkus = new Set();

  for (const m of masterGpus) {
    const sku = normalizeSkuKey(m.canonicalName);
    if (sku) seenGpuSkus.add(sku);
    searchableGpus.push({
      name: m.canonicalName,
      source: 'master',
      segment: m.marketSegment || 'desktop',
      raw: m,
    });
  }

  for (const l of legacyGpus) {
    const name = l.gpuName || '';
    const sku = normalizeSkuKey(name);
    if (sku && !seenGpuSkus.has(sku)) {
      seenGpuSkus.add(sku);
      searchableGpus.push({
        name,
        source: 'legacy',
        segment: 'desktop',
        raw: l,
      });
    }
  }

  console.log(`Total Searchable Unique GPUs: ${searchableGpus.length}`);

  // 3. Audit CPUs
  let cpuMlReadyCount = 0;
  let cpuMlUnreadyCount = 0;
  const cpuMissingCounts = {};
  const cpuFamilyStats = {};

  for (const cpu of searchableCpus) {
    const res = resolveCpuSpecs(cpu.name, cpu.raw);
    
    // Categorize family
    let family = 'Other / Legacy';
    const n = cpu.name.toLowerCase();
    if (/i[3579]-?14\d+/i.test(n)) family = 'Intel Core 14th Gen';
    else if (/i[3579]-?13\d+/i.test(n)) family = 'Intel Core 13th Gen';
    else if (/i[3579]-?12\d+/i.test(n)) family = 'Intel Core 12th Gen';
    else if (/i[3579]-?11\d+/i.test(n)) family = 'Intel Core 11th Gen';
    else if (/i[3579]-?10\d+/i.test(n)) family = 'Intel Core 10th Gen';
    else if (/i[3579]-?9\d+/i.test(n)) family = 'Intel Core 9th Gen';
    else if (/i[3579]-?8\d+/i.test(n)) family = 'Intel Core 8th Gen';
    else if (/i[3579]-?7\d+/i.test(n)) family = 'Intel Core 7th Gen';
    else if (/ryzen\s*[3579]\s*9\d+/i.test(n)) family = 'AMD Ryzen 9000 Series';
    else if (/ryzen\s*[3579]\s*7\d+/i.test(n)) family = 'AMD Ryzen 7000 Series';
    else if (/ryzen\s*[3579]\s*5\d+/i.test(n)) family = 'AMD Ryzen 5000 Series';
    else if (/ryzen\s*[3579]\s*3\d+/i.test(n)) family = 'AMD Ryzen 3000 Series';
    else if (/ryzen\s*[3579]\s*2\d+/i.test(n)) family = 'AMD Ryzen 2000 Series';
    else if (/ryzen\s*[3579]\s*1\d+/i.test(n)) family = 'AMD Ryzen 1000 Series';
    else if (/core\s*2|pentium|celeron|phenom|athlon/i.test(n)) family = 'Older Legacy (Core 2 / Athlon / Phenom)';

    if (!cpuFamilyStats[family]) {
      cpuFamilyStats[family] = { total: 0, mlReady: 0, unready: 0 };
    }
    cpuFamilyStats[family].total++;

    if (res.mlReady) {
      cpuMlReadyCount++;
      cpuFamilyStats[family].mlReady++;
    } else {
      cpuMlUnreadyCount++;
      cpuFamilyStats[family].unready++;
      for (const f of res.missingFields) {
        cpuMissingCounts[f] = (cpuMissingCounts[f] || 0) + 1;
      }
    }
  }

  // 4. Audit GPUs
  let gpuMlReadyCount = 0;
  let gpuMlUnreadyCount = 0;
  const gpuMissingCounts = {};
  const gpuFamilyStats = {};

  for (const gpu of searchableGpus) {
    const res = resolveGpuSpecs(gpu.name, gpu.raw);

    let family = 'Other / Legacy';
    const n = gpu.name.toLowerCase();
    if (/rtx\s*40\d+/i.test(n)) family = 'GeForce RTX 40 Series';
    else if (/rtx\s*30\d+/i.test(n)) family = 'GeForce RTX 30 Series';
    else if (/rtx\s*20\d+/i.test(n)) family = 'GeForce RTX 20 Series';
    else if (/gtx\s*16\d+/i.test(n)) family = 'GeForce GTX 16 Series';
    else if (/gtx\s*10\d+/i.test(n)) family = 'GeForce GTX 10 Series';
    else if (/rx\s*7\d+/i.test(n)) family = 'Radeon RX 7000 Series';
    else if (/rx\s*6\d+/i.test(n)) family = 'Radeon RX 6000 Series';
    else if (/rx\s*5\d+/i.test(n)) family = 'Radeon RX 5000 / 500 Series';

    if (!gpuFamilyStats[family]) {
      gpuFamilyStats[family] = { total: 0, mlReady: 0, unready: 0 };
    }
    gpuFamilyStats[family].total++;

    if (res.mlReady) {
      gpuMlReadyCount++;
      gpuFamilyStats[family].mlReady++;
    } else {
      gpuMlUnreadyCount++;
      gpuFamilyStats[family].unready++;
      for (const f of res.missingFields) {
        gpuMissingCounts[f] = (gpuMissingCounts[f] || 0) + 1;
      }
    }
  }

  console.log('\n--- CPU AUDIT RESULTS ---');
  console.log(`Searchable CPUs: ${searchableCpus.length}`);
  console.log(`ML-Ready: ${cpuMlReadyCount} (${((cpuMlReadyCount / searchableCpus.length) * 100).toFixed(2)}%)`);
  console.log(`Unready: ${cpuMlUnreadyCount} (${((cpuMlUnreadyCount / searchableCpus.length) * 100).toFixed(2)}%)`);
  console.log('Missing Fields Breakdown:', cpuMissingCounts);
  console.log('CPU Family Breakdown:', cpuFamilyStats);

  console.log('\n--- GPU AUDIT RESULTS ---');
  console.log(`Searchable GPUs: ${searchableGpus.length}`);
  console.log(`ML-Ready: ${gpuMlReadyCount} (${((gpuMlReadyCount / searchableGpus.length) * 100).toFixed(2)}%)`);
  console.log(`Unready: ${gpuMlUnreadyCount} (${((gpuMlUnreadyCount / searchableGpus.length) * 100).toFixed(2)}%)`);
  console.log('Missing Fields Breakdown:', gpuMissingCounts);
  console.log('GPU Family Breakdown:', gpuFamilyStats);

  // 5. Representative Hardware Matrix
  console.log('\n--- REPRESENTATIVE HARDWARE SPEC RESOLUTION ---');
  const testCases = [
    { cpu: 'Intel Core i3-330M', gpu: 'NVIDIA GeForce GTX 1660 SUPER' },
    { cpu: 'Intel Core i5-8400', gpu: 'NVIDIA GeForce GTX 1660 SUPER' },
    { cpu: 'Intel Core i5-9500', gpu: 'NVIDIA GeForce GTX 1660 SUPER' },
    { cpu: 'Intel Core i3-10105', gpu: 'NVIDIA GeForce GTX 1660 SUPER' },
    { cpu: 'Intel Core i5-10400F', gpu: 'NVIDIA GeForce RTX 3060 Ti' },
    { cpu: 'AMD Ryzen 5 3600', gpu: 'NVIDIA GeForce RTX 2060' },
    { cpu: 'AMD Ryzen 7 7800X3D', gpu: 'NVIDIA GeForce RTX 4080' },
    { cpu: 'Intel Core i5-12400F', gpu: 'NVIDIA GeForce RTX 4070' },
    { cpu: 'Intel Core i7-8700K', gpu: 'NVIDIA GeForce GTX 1060 6GB' },
    { cpu: 'AMD Ryzen 5 5600X', gpu: 'AMD Radeon RX 7800 XT' },
  ];

  const representativeResults = [];

  for (const tc of testCases) {
    const cpuRes = resolveCpuSpecs(tc.cpu);
    const gpuRes = resolveGpuSpecs(tc.gpu);
    const isReady = cpuRes.mlReady && gpuRes.mlReady;

    representativeResults.push({
      cpuName: tc.cpu,
      cpuSku: cpuRes.sku,
      cpuMlReady: cpuRes.mlReady,
      cpuMissing: cpuRes.missingFields,
      cpuProvenance: cpuRes.provenance,
      gpuName: tc.gpu,
      gpuSku: gpuRes.sku,
      gpuMlReady: gpuRes.mlReady,
      gpuMissing: gpuRes.missingFields,
      gpuProvenance: gpuRes.provenance,
      comboMlReady: isReady,
    });
  }

  console.log(JSON.stringify(representativeResults, null, 2));

  // 6. Live Model V2 Prediction Matrix on Games
  console.log('\n--- LIVE MODEL V2 PREDICTION MATRIX ---');
  const gamesToTest = [
    { game: 'grandTheftAuto5', display: 'Grand Theft Auto V', setting: 3 }, // High
    { game: 'fortnite', display: 'Fortnite', setting: 3 },                  // High
    { game: 'apexLegends', display: 'Apex Legends', setting: 2 },            // Medium
  ];

  const predictionMatrix = [];

  for (const tc of testCases) {
    const cpuRes = resolveCpuSpecs(tc.cpu);
    const gpuRes = resolveGpuSpecs(tc.gpu);

    if (!cpuRes.mlReady || !gpuRes.mlReady) {
      predictionMatrix.push({
        hardware: `${tc.cpu} + ${tc.gpu}`,
        status: 'UNREADY_CLEAN_FALLBACK',
        gtaV: 'N/A (Bottleneck only)',
        fortnite: 'N/A (Bottleneck only)',
        apex: 'N/A (Bottleneck only)',
      });
      continue;
    }

    const row = {
      hardware: `${tc.cpu} + ${tc.gpu}`,
      status: 'ML_READY',
    };

    for (const g of gamesToTest) {
      const payload = {
        modelVersion: 'v2',
        GameName: g.game,
        GameSetting_Ordinal: g.setting,
        ...cpuRes.specs,
        ...gpuRes.specs,
      };

      try {
        const resp = await axios.post(`${PYTHON_AI_URL}/predict`, payload, { timeout: 10000 });
        const fps = resp.data.predicted_fps;
        row[g.game] = `${fps.toFixed(1)} FPS`;
      } catch (err) {
        row[g.game] = `ERROR: ${err.message}`;
      }
    }
    predictionMatrix.push(row);
  }

  console.table(predictionMatrix);

  await mongoose.disconnect();
  console.log('\nAudit complete and DB disconnected.');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
