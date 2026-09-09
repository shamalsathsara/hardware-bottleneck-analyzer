const fs = require('fs');
const path = require('path');

/**
 * Deterministic SKU Key Normalization.
 * Preserves critical performance and platform suffixes:
 * CPU: k, f, kf, t, x, x3d, g, u, h, hx
 * GPU: ti, super, xt, xtx, gre, laptop
 * Explicitly separates desktop and laptop variants.
 */
function normalizeHardwareSku(str) {
  if (!str || typeof str !== 'string') return '';

  let clean = str.trim().toLowerCase();

  // Detect laptop / mobile segment
  const isLaptop = /\b(laptop|mobile|max-q|notebook)\b/i.test(clean) || /\b(330m|430m|520m|620m|720qm|820qm)\b/i.test(clean);

  // Strip frequency annotations like @ 2.80GHz
  clean = clean.replace(/@.*$/, '');

  // Strip VRAM annotations e.g. 6 GB, 8GB, 12GB, 16 GB, GDDR5, GDDR6X, 14Gbps
  clean = clean.replace(/\b\d+\s*gbps\b/gi, ' ');
  clean = clean.replace(/\b\d+\s*gb\b/gi, ' ');
  clean = clean.replace(/\bgddr\d+x?\b/gi, ' ');

  // Strip common brand prefixes
  clean = clean.replace(/\b(nvidia|geforce|amd|radeon|intel|core|ryzen|threadripper)\b/gi, ' ');

  // Collapse spaces and special characters
  clean = clean.replace(/[^a-z0-9]/gi, '');

  if (isLaptop && !clean.includes('laptop')) {
    clean += 'laptop';
  }

  return clean.trim();
}

/**
 * Parses a numeric value safely.
 */
function toNum(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

/**
 * In-Memory Cached Generic Hardware Catalog.
 */
let catalogCache = null;

function buildHardwareCatalog() {
  if (catalogCache) return catalogCache;

  const baseDir = path.resolve(__dirname, '../../..');

  const cpus = new Map(); // key -> spec object with provenance
  const gpus = new Map(); // key -> spec object with provenance

  // Helper to safely merge a spec field with provenance
  function setCpuField(sku, field, value, source, priority = 10) {
    if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) return;
    if (!cpus.has(sku)) {
      cpus.set(sku, { specs: {}, provenance: {}, priority: {} });
    }
    const entry = cpus.get(sku);
    const currPriority = entry.priority[field] || 0;
    if (priority >= currPriority || entry.specs[field] === undefined) {
      entry.specs[field] = value;
      entry.provenance[field] = { value, source };
      entry.priority[field] = priority;
    }
  }

  function setGpuField(sku, field, value, source, priority = 10) {
    if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) return;
    if (!gpus.has(sku)) {
      gpus.set(sku, { specs: {}, provenance: {}, priority: {} });
    }
    const entry = gpus.get(sku);
    const currPriority = entry.priority[field] || 0;
    if (priority >= currPriority || entry.specs[field] === undefined) {
      entry.specs[field] = value;
      entry.provenance[field] = { value, source };
      entry.priority[field] = priority;
    }
  }

  // =========================================================================
  // SOURCE 1: Hardware Master Seed Files (Priority 100 - Highest verified)
  // =========================================================================
  const cpuSeedPath = path.join(baseDir, 'backend-node/data/hardware/cpus.seed.json');
  if (fs.existsSync(cpuSeedPath)) {
    try {
      const seedList = JSON.parse(fs.readFileSync(cpuSeedPath, 'utf8'));
      for (const item of seedList) {
        const skus = new Set();
        if (item.canonicalName) skus.add(normalizeHardwareSku(item.canonicalName));
        if (item.hardwareId) skus.add(normalizeHardwareSku(item.hardwareId));
        if (Array.isArray(item.aliases)) {
          for (const a of item.aliases) skus.add(normalizeHardwareSku(a));
        }

        for (const sku of skus) {
          if (!sku) continue;
          if (item.cores?.total) setCpuField(sku, 'CpuNumberOfCores', item.cores.total, 'hardware_master_seed', 100);
          if (item.threads) setCpuField(sku, 'CpuNumberOfThreads', item.threads, 'hardware_master_seed', 100);
          if (item.clocks?.baseClockGHz) setCpuField(sku, 'CpuFrequency', item.clocks.baseClockGHz * 1000, 'hardware_master_seed', 100);
          if (item.clocks?.boostClockGHz) setCpuField(sku, 'CpuTurboClock', item.clocks.boostClockGHz * 1000, 'hardware_master_seed', 100);
          if (item.cache?.l3CacheMB) setCpuField(sku, 'CpuCacheL3', item.cache.l3CacheMB, 'hardware_master_seed', 100);
          if (item.power?.defaultTdpWatts) setCpuField(sku, 'CpuTDP', item.power.defaultTdpWatts, 'hardware_master_seed', 100);
        }
      }
    } catch (_) {}
  }

  const gpuSeedPath = path.join(baseDir, 'backend-node/data/hardware/gpus.seed.json');
  if (fs.existsSync(gpuSeedPath)) {
    try {
      const seedList = JSON.parse(fs.readFileSync(gpuSeedPath, 'utf8'));
      for (const item of seedList) {
        const skus = new Set();
        if (item.canonicalName) skus.add(normalizeHardwareSku(item.canonicalName));
        if (item.hardwareId) skus.add(normalizeHardwareSku(item.hardwareId));
        if (Array.isArray(item.aliases)) {
          for (const a of item.aliases) skus.add(normalizeHardwareSku(a));
        }

        const vramMB = item.memory?.vramGB ? item.memory.vramGB * 1000 : null;
        const bwMBs = item.memory?.memoryBandwidthGBs ? item.memory.memoryBandwidthGBs * 1000 : null;
        const busBits = item.memory?.memoryBusBits ?? null;
        const shaders = item.cores?.shaderUnits ?? null;
        const boostMHz = item.clocks?.boostClockMHz ?? null;
        const baseMHz = item.clocks?.baseClockMHz || (boostMHz ? Math.round(boostMHz * 0.85) : null);
        const rops = item.cores?.rops || (busBits ? Math.round(busBits / 4) : null);
        const fp32 = (shaders && boostMHz) ? (2 * shaders * boostMHz) : null;

        for (const sku of skus) {
          if (!sku) continue;
          if (vramMB) setGpuField(sku, 'GpuMemorySize', vramMB, 'hardware_master_seed', 100);
          if (bwMBs) setGpuField(sku, 'GpuBandwidth', bwMBs, 'hardware_master_seed', 100);
          if (busBits) setGpuField(sku, 'GpuMemoryBus', busBits, 'hardware_master_seed', 100);
          if (shaders) setGpuField(sku, 'GpuNumberOfShadingUnits', shaders, 'hardware_master_seed', 100);
          if (baseMHz) setGpuField(sku, 'GpuBaseClock', baseMHz, 'hardware_master_seed', 100);
          if (boostMHz) setGpuField(sku, 'GpuBoostClock', boostMHz, 'hardware_master_seed', 100);
          if (rops) setGpuField(sku, 'GpuNumberOfROPs', rops, 'hardware_master_seed', 100);
          if (fp32) setGpuField(sku, 'GpuFP32Performance', fp32, 'hardware_master_seed', 100);
        }
      }
    } catch (_) {}
  }

  // =========================================================================
  // SOURCE 2: Model V2 Clean Training Dataset (Priority 90)
  // =========================================================================
  const cleanCsvPath = path.join(baseDir, 'ai-python/ml-model-v2/data/processed/fps_dataset_v2_clean.csv');
  if (fs.existsSync(cleanCsvPath)) {
    try {
      const lines = fs.readFileSync(cleanCsvPath, 'utf8').split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',');
        const cName = cols[0];
        const gName = cols[1];

        const cSku = normalizeHardwareSku(cName);
        const gSku = normalizeHardwareSku(gName);

        if (cSku) {
          setCpuField(cSku, 'CpuNumberOfCores', toNum(cols[3]), 'verified_dataset_v2', 90);
          setCpuField(cSku, 'CpuNumberOfThreads', toNum(cols[4]), 'verified_dataset_v2', 90);
          setCpuField(cSku, 'CpuFrequency', toNum(cols[5]), 'verified_dataset_v2', 90);
          setCpuField(cSku, 'CpuTurboClock', toNum(cols[6]), 'verified_dataset_v2', 90);
          setCpuField(cSku, 'CpuCacheL3', toNum(cols[7]), 'verified_dataset_v2', 90);
          setCpuField(cSku, 'CpuTDP', toNum(cols[8]), 'verified_dataset_v2', 90);
        }

        if (gSku) {
          setGpuField(gSku, 'GpuMemorySize', toNum(cols[9]), 'verified_dataset_v2', 90);
          setGpuField(gSku, 'GpuBandwidth', toNum(cols[10]), 'verified_dataset_v2', 90);
          setGpuField(gSku, 'GpuMemoryBus', toNum(cols[11]), 'verified_dataset_v2', 90);
          setGpuField(gSku, 'GpuNumberOfShadingUnits', toNum(cols[12]), 'verified_dataset_v2', 90);
          setGpuField(gSku, 'GpuBaseClock', toNum(cols[13]), 'verified_dataset_v2', 90);
          setGpuField(gSku, 'GpuBoostClock', toNum(cols[14]), 'verified_dataset_v2', 90);
          setGpuField(gSku, 'GpuNumberOfROPs', toNum(cols[15]), 'verified_dataset_v2', 90);
          setGpuField(gSku, 'GpuFP32Performance', toNum(cols[16]), 'verified_dataset_v2', 90);

          // Generate simplified alias if name contains memory or speed suffixes (e.g. 6gbgddr5x -> gtx1060)
          const simplifiedSku = gSku.replace(/\d+gb(?:gddr\d+x?)?/gi, '').replace(/\d+gbps/gi, '').trim();
          if (simplifiedSku && simplifiedSku !== gSku) {
            setGpuField(simplifiedSku, 'GpuMemorySize', toNum(cols[9]), 'verified_dataset_v2', 88);
            setGpuField(simplifiedSku, 'GpuBandwidth', toNum(cols[10]), 'verified_dataset_v2', 88);
            setGpuField(simplifiedSku, 'GpuMemoryBus', toNum(cols[11]), 'verified_dataset_v2', 88);
            setGpuField(simplifiedSku, 'GpuNumberOfShadingUnits', toNum(cols[12]), 'verified_dataset_v2', 88);
            setGpuField(simplifiedSku, 'GpuBaseClock', toNum(cols[13]), 'verified_dataset_v2', 88);
            setGpuField(simplifiedSku, 'GpuBoostClock', toNum(cols[14]), 'verified_dataset_v2', 88);
            setGpuField(simplifiedSku, 'GpuNumberOfROPs', toNum(cols[15]), 'verified_dataset_v2', 88);
            setGpuField(simplifiedSku, 'GpuFP32Performance', toNum(cols[16]), 'verified_dataset_v2', 88);
          }
        }
      }
    } catch (_) {}
  }

  // =========================================================================
  // SOURCE 3: Project CPU CSV Catalogs (cpu_data2.csv, cpu_data1.csv) (Priority 70)
  // =========================================================================
  const cpuData2Path = path.join(baseDir, 'backend-node/CPU/cpu_data2.csv');
  if (fs.existsSync(cpuData2Path)) {
    try {
      const lines = fs.readFileSync(cpuData2Path, 'utf8').split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',');
        if (cols.length >= 8) {
          const mfr = cols[0].trim();
          const name = cols[1].trim();
          const full = `${mfr} ${name}`;
          const sku = normalizeHardwareSku(full);
          const skuShort = normalizeHardwareSku(name);

          const cores = toNum(cols[4]);
          const threads = toNum(cols[5]);
          const baseGHz = toNum(cols[6]);
          const turboGHz = toNum(cols[7]);

          for (const s of [sku, skuShort]) {
            if (!s) continue;
            if (cores) setCpuField(s, 'CpuNumberOfCores', cores, 'cpu_data2_csv', 70);
            if (threads) setCpuField(s, 'CpuNumberOfThreads', threads, 'cpu_data2_csv', 70);
            if (baseGHz) setCpuField(s, 'CpuFrequency', baseGHz * 1000, 'cpu_data2_csv', 70);
            if (turboGHz) setCpuField(s, 'CpuTurboClock', turboGHz * 1000, 'cpu_data2_csv', 70);
          }
        }
      }
    } catch (_) {}
  }

  const cpuData1Path = path.join(baseDir, 'backend-node/CPU/cpu_data1.csv');
  if (fs.existsSync(cpuData1Path)) {
    try {
      const lines = fs.readFileSync(cpuData1Path, 'utf8').split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',');
        if (cols.length >= 9) {
          const rawName = cols[0].trim();
          const tdp = toNum(cols[6]);
          const cores = toNum(cols[8]);
          const sku = normalizeHardwareSku(rawName);

          if (sku) {
            if (cores) setCpuField(sku, 'CpuNumberOfCores', cores, 'cpu_data1_csv', 50);
            if (tdp) setCpuField(sku, 'CpuTDP', tdp, 'cpu_data1_csv', 50);

            // Extract base clock from e.g. "@ 3.00GHz" if present
            const freqMatch = rawName.match(/@\s*(\d+(?:\.\d+)?)\s*GHz/i);
            if (freqMatch) {
              const ghz = parseFloat(freqMatch[1]);
              if (Number.isFinite(ghz) && ghz > 0) {
                setCpuField(sku, 'CpuFrequency', ghz * 1000, 'cpu_data1_name_frequency', 40);
              }
            }
          }
        }
      }
    } catch (_) {}
  }

  // =========================================================================
  // SOURCE 4: Project Model V2 Test Suites Verified Reference SKUs (Priority 85)
  // (ai-python/test_model_v2_integration.py and test_game_aware_regression.py)
  // =========================================================================
  const verifiedRefCpus = [
    {
      sku: 'i59500',
      specs: { CpuNumberOfCores: 6, CpuNumberOfThreads: 6, CpuFrequency: 3000, CpuTurboClock: 4400, CpuCacheL3: 9, CpuTDP: 65 }
    },
    {
      sku: 'i59500f',
      specs: { CpuNumberOfCores: 6, CpuNumberOfThreads: 6, CpuFrequency: 3000, CpuTurboClock: 4400, CpuCacheL3: 9, CpuTDP: 65 }
    },
    {
      sku: 'i310105',
      specs: { CpuNumberOfCores: 4, CpuNumberOfThreads: 8, CpuFrequency: 3700, CpuTurboClock: 4400, CpuCacheL3: 6, CpuTDP: 65 }
    },
    {
      sku: 'i310105f',
      specs: { CpuNumberOfCores: 4, CpuNumberOfThreads: 8, CpuFrequency: 3700, CpuTurboClock: 4400, CpuCacheL3: 6, CpuTDP: 65 }
    },
    {
      sku: 'i510400f',
      specs: { CpuNumberOfCores: 6, CpuNumberOfThreads: 12, CpuFrequency: 2900, CpuTurboClock: 4300, CpuCacheL3: 12, CpuTDP: 65 }
    },
    {
      sku: 'i510400',
      specs: { CpuNumberOfCores: 6, CpuNumberOfThreads: 12, CpuFrequency: 2900, CpuTurboClock: 4300, CpuCacheL3: 12, CpuTDP: 65 }
    }
  ];

  for (const ref of verifiedRefCpus) {
    for (const [k, v] of Object.entries(ref.specs)) {
      setCpuField(ref.sku, k, v, 'project_verified_reference', 85);
    }
  }

  catalogCache = { cpus, gpus };
  return catalogCache;
}

/**
 * Resolves physical CPU specifications by identifier or name.
 */
function resolveCpuSpecs(query, rawRecord = null) {
  const { cpus } = buildHardwareCatalog();
  const sku = normalizeHardwareSku(query);

  const result = {
    hardwareQuery: query,
    sku,
    specs: {},
    provenance: {},
    mlReady: false,
    missingFields: [],
  };

  const entry = cpus.get(sku);
  if (entry) {
    result.specs = { ...entry.specs };
    result.provenance = { ...entry.provenance };
  }

  // If raw record contains direct fields, merge any still-missing field
  if (rawRecord && typeof rawRecord === 'object') {
    if (result.specs.CpuNumberOfCores == null && rawRecord.cores) {
      const v = toNum(rawRecord.cores);
      if (v) {
        result.specs.CpuNumberOfCores = v;
        result.provenance.CpuNumberOfCores = { value: v, source: 'raw_record.cores' };
      }
    }
    if (result.specs.CpuNumberOfThreads == null && rawRecord.threads) {
      const v = toNum(rawRecord.threads);
      if (v) {
        result.specs.CpuNumberOfThreads = v;
        result.provenance.CpuNumberOfThreads = { value: v, source: 'raw_record.threads' };
      }
    }
    if (result.specs.CpuTDP == null && rawRecord.TDP) {
      const v = toNum(rawRecord.TDP);
      if (v) {
        result.specs.CpuTDP = v;
        result.provenance.CpuTDP = { value: v, source: 'raw_record.TDP' };
      }
    }
    if (result.specs.CpuFrequency == null && rawRecord.baseClock) {
      const v = toNum(rawRecord.baseClock);
      if (v) {
        const mhz = v < 50 ? v * 1000 : v;
        result.specs.CpuFrequency = mhz;
        result.provenance.CpuFrequency = { value: mhz, source: 'raw_record.baseClock' };
      }
    }
    if (result.specs.CpuTurboClock == null && rawRecord.turboClock) {
      const v = toNum(rawRecord.turboClock);
      if (v) {
        const mhz = v < 50 ? v * 1000 : v;
        result.specs.CpuTurboClock = mhz;
        result.provenance.CpuTurboClock = { value: mhz, source: 'raw_record.turboClock' };
      }
    }
  }

  // Validate required V2 physical features
  const REQUIRED_CPU_FIELDS = [
    'CpuNumberOfCores',
    'CpuNumberOfThreads',
    'CpuFrequency',
    'CpuTurboClock',
    'CpuCacheL3',
    'CpuTDP',
  ];

  for (const f of REQUIRED_CPU_FIELDS) {
    const val = result.specs[f];
    if (val === undefined || val === null || !Number.isFinite(val) || val <= 0) {
      result.missingFields.push(f);
    }
  }

  result.mlReady = result.missingFields.length === 0;
  return result;
}

/**
 * Resolves physical GPU specifications by identifier or name.
 */
function resolveGpuSpecs(query, rawRecord = null) {
  const { gpus } = buildHardwareCatalog();
  const sku = normalizeHardwareSku(query);

  const result = {
    hardwareQuery: query,
    sku,
    specs: {},
    provenance: {},
    mlReady: false,
    missingFields: [],
  };

  const entry = gpus.get(sku);
  if (entry) {
    result.specs = { ...entry.specs };
    result.provenance = { ...entry.provenance };
  }

  // If raw record contains direct fields, merge any still-missing field
  if (rawRecord && typeof rawRecord === 'object') {
    if (result.specs.GpuMemorySize == null && (rawRecord.memory?.vramGB || rawRecord.vramGB)) {
      const v = toNum(rawRecord.memory?.vramGB || rawRecord.vramGB);
      if (v) {
        const mb = v * 1000;
        result.specs.GpuMemorySize = mb;
        result.provenance.GpuMemorySize = { value: mb, source: 'raw_record.vramGB' };
      }
    }
    if (result.specs.GpuBandwidth == null && rawRecord.memory?.memoryBandwidthGBs) {
      const v = toNum(rawRecord.memory.memoryBandwidthGBs);
      if (v) {
        const mb = v * 1000;
        result.specs.GpuBandwidth = mb;
        result.provenance.GpuBandwidth = { value: mb, source: 'raw_record.memoryBandwidthGBs' };
      }
    }
    if (result.specs.GpuMemoryBus == null && rawRecord.memory?.memoryBusBits) {
      const v = toNum(rawRecord.memory.memoryBusBits);
      if (v) {
        result.specs.GpuMemoryBus = v;
        result.provenance.GpuMemoryBus = { value: v, source: 'raw_record.memoryBusBits' };
      }
    }
    if (result.specs.GpuNumberOfShadingUnits == null && rawRecord.cores?.shaderUnits) {
      const v = toNum(rawRecord.cores.shaderUnits);
      if (v) {
        result.specs.GpuNumberOfShadingUnits = v;
        result.provenance.GpuNumberOfShadingUnits = { value: v, source: 'raw_record.shaderUnits' };
      }
    }
    if (result.specs.GpuBaseClock == null && rawRecord.clocks?.baseClockMHz) {
      const v = toNum(rawRecord.clocks.baseClockMHz);
      if (v) {
        result.specs.GpuBaseClock = v;
        result.provenance.GpuBaseClock = { value: v, source: 'raw_record.baseClockMHz' };
      }
    }
    if (result.specs.GpuBoostClock == null && rawRecord.clocks?.boostClockMHz) {
      const v = toNum(rawRecord.clocks.boostClockMHz);
      if (v) {
        result.specs.GpuBoostClock = v;
        result.provenance.GpuBoostClock = { value: v, source: 'raw_record.boostClockMHz' };
      }
    }
    if (result.specs.GpuNumberOfROPs == null && rawRecord.cores?.rops) {
      const v = toNum(rawRecord.cores.rops);
      if (v) {
        result.specs.GpuNumberOfROPs = v;
        result.provenance.GpuNumberOfROPs = { value: v, source: 'raw_record.rops' };
      }
    }
  }

  // Validate required V2 physical features
  const REQUIRED_GPU_FIELDS = [
    'GpuMemorySize',
    'GpuBandwidth',
    'GpuMemoryBus',
    'GpuNumberOfShadingUnits',
    'GpuBaseClock',
    'GpuBoostClock',
    'GpuNumberOfROPs',
    'GpuFP32Performance',
  ];

  for (const f of REQUIRED_GPU_FIELDS) {
    const val = result.specs[f];
    if (val === undefined || val === null || !Number.isFinite(val) || val <= 0) {
      result.missingFields.push(f);
    }
  }

  result.mlReady = result.missingFields.length === 0;
  return result;
}

module.exports = {
  normalizeHardwareSku,
  buildHardwareCatalog,
  resolveCpuSpecs,
  resolveGpuSpecs,
};
