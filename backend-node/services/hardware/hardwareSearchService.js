const HardwareCpu = require('../../models/HardwareCpu');
const HardwareGpu = require('../../models/HardwareGpu');
const { CPU, GPU } = require('../../models/Hardware');

/**
 * Escapes regex special characters safely.
 */
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generates normalized SKU key for deduplicating equivalent hardware between
 * Hardware Master and Legacy collections.
 */
function normalizeSkuKey(str) {
  return (str || '')
    .toLowerCase()
    .replace(/@.*$/, '')
    .replace(/\b(nvidia|geforce|amd|radeon|intel|core|ryzen)\b/gi, '')
    .replace(/[^a-z0-9]/gi, '')
    .trim();
}

/**
 * Splits search query into alphanumeric tokens and creates regex matchers.
 */
function buildTokenRegexList(query) {
  const raw = (query || '').trim();
  if (!raw) return [];

  const tokens = raw.split(/[\s\-_.,/]+/).filter(Boolean);
  return tokens.map(t => new RegExp(escapeRegex(t), 'i'));
}

/**
 * Unified CPU Search
 * 1. Searches Hardware Master (HardwareCpu)
 * 2. Searches Legacy CPUs (CPU)
 * 3. Merges and deduplicates with Master priority
 */
async function searchUnifiedCpus(query, options = {}) {
  const limit = Math.min(Math.max(parseInt(options.limit, 10) || 20, 1), 50);
  const regexList = buildTokenRegexList(query);

  if (regexList.length === 0) {
    return [];
  }

  // 1. Search Hardware Master
  const masterFilter = {
    $and: regexList.map(reg => ({
      $or: [
        { canonicalName: reg },
        { aliases: reg },
        { slug: reg },
        { hardwareId: reg },
      ],
    })),
  };

  if (options.segment && ['desktop', 'mobile', 'workstation', 'server'].includes(options.segment)) {
    masterFilter.marketSegment = options.segment;
  }

  const masterCpus = await HardwareCpu.find(masterFilter).limit(limit).lean();

  // 2. Search Legacy CPU collection
  const legacyFilter = {
    $and: regexList.map(reg => ({
      $or: [
        { cpuName: reg },
        { manufacturer: reg },
      ],
    })),
  };
  const legacyCpus = await CPU.find(legacyFilter)
    .sort({ cpuMark: -1 })
    .limit(limit * 3)
    .lean();

  const results = [];
  const seenSkus = new Set();

  // Master records take priority
  for (const m of masterCpus) {
    const sku = normalizeSkuKey(m.canonicalName);
    if (sku) seenSkus.add(sku);

    const totalCores = m.cores?.total || 6;
    const cpuScore = m.performance?.multiCoreScore || totalCores * 3000;

    results.push({
      _id: m._id,
      displayName: m.canonicalName,
      canonicalName: m.canonicalName,
      cpuName: m.canonicalName,
      hardwareId: m.hardwareId,
      hardwareSource: 'master',
      legacyId: null,
      slug: m.slug,
      cpuMark: cpuScore,
      cores: totalCores,
      threads: m.threads || totalCores * 2,
      clocks: m.clocks,
      cache: m.cache,
      power: m.power,
      marketSegment: m.marketSegment,
      quality: m.quality,
      rawRecord: m,
    });
  }

  // Append legacy records only if not already represented by Master
  for (const l of legacyCpus) {
    const sku = normalizeSkuKey(l.cpuName);
    if (!sku || seenSkus.has(sku)) continue;
    seenSkus.add(sku);

    const displayName = l.cpuName;

    results.push({
      _id: l._id,
      displayName,
      canonicalName: displayName,
      cpuName: displayName,
      hardwareId: null,
      hardwareSource: 'legacy',
      legacyId: String(l._id),
      cpuMark: parseInt(l.cpuMark, 10) || 8000,
      cores: parseInt(l.cores, 10) || 6,
      threads: l.threads ? parseInt(l.threads, 10) : undefined,
      baseClock: l.baseClock,
      turboClock: l.turboClock,
      TDP: l.TDP,
      socket: l.socket,
      category: l.category,
      rawRecord: l,
    });

    if (results.length >= limit) break;
  }

  return results.slice(0, limit);
}

/**
 * Unified GPU Search
 * 1. Searches Hardware Master (HardwareGpu)
 * 2. Searches Legacy GPUs (GPU)
 * 3. Merges and deduplicates with Master priority
 */
async function searchUnifiedGpus(query, options = {}) {
  const limit = Math.min(Math.max(parseInt(options.limit, 10) || 20, 1), 50);
  const regexList = buildTokenRegexList(query);

  if (regexList.length === 0) {
    return [];
  }

  // 1. Search Hardware Master
  const masterFilter = {
    $and: regexList.map(reg => ({
      $or: [
        { canonicalName: reg },
        { aliases: reg },
        { slug: reg },
        { hardwareId: reg },
      ],
    })),
  };

  if (options.segment && ['desktop', 'laptop', 'workstation'].includes(options.segment)) {
    masterFilter.marketSegment = options.segment;
  }

  const masterGpus = await HardwareGpu.find(masterFilter).limit(limit).lean();

  // 2. Search Legacy GPU collection
  const legacyFilter = {
    $and: regexList.map(reg => ({
      $or: [
        { Device: reg },
        { gpuName: reg },
        { Manufacturer: reg },
      ],
    })),
  };
  const legacyGpus = await GPU.find(legacyFilter)
    .sort({ CUDA: -1, G3Dmark: -1 })
    .limit(limit * 3)
    .lean();

  const results = [];
  const seenSkus = new Set();

  // Master records take priority
  for (const m of masterGpus) {
    const sku = normalizeSkuKey(m.canonicalName);
    if (sku) seenSkus.add(sku);

    const vram = m.memory?.vramGB || 8;
    const cudaEst = m.cores?.shaderUnits
      ? m.cores.shaderUnits
      : (vram >= 16 ? 220000 : vram >= 12 ? 140000 : 80000);

    results.push({
      _id: m._id,
      displayName: m.canonicalName,
      canonicalName: m.canonicalName,
      Device: m.canonicalName,
      gpuName: m.canonicalName,
      hardwareId: m.hardwareId,
      hardwareSource: 'master',
      legacyId: null,
      slug: m.slug,
      Manufacturer: m.manufacturer || 'NVIDIA',
      CUDA: cudaEst,
      memory: m.memory,
      cores: m.cores,
      clocks: m.clocks,
      features: m.features,
      power: m.power,
      marketSegment: m.marketSegment,
      quality: m.quality,
      rawRecord: m,
    });
  }

  // Append legacy records only if not already represented by Master
  for (const l of legacyGpus) {
    const rawName = l.Device || l.gpuName || '';
    const sku = normalizeSkuKey(rawName);
    if (!sku || seenSkus.has(sku)) continue;
    seenSkus.add(sku);

    const displayName = rawName;

    results.push({
      _id: l._id,
      displayName,
      canonicalName: displayName,
      Device: displayName,
      gpuName: displayName,
      hardwareId: null,
      hardwareSource: 'legacy',
      legacyId: String(l._id),
      Manufacturer: l.Manufacturer || 'NVIDIA',
      CUDA: parseInt(l.CUDA, 10) || 50000,
      G3Dmark: l.G3Dmark,
      TDP: l.TDP,
      rawRecord: l,
    });

    if (results.length >= limit) break;
  }

  return results.slice(0, limit);
}

module.exports = {
  searchUnifiedCpus,
  searchUnifiedGpus,
  normalizeSkuKey,
};
