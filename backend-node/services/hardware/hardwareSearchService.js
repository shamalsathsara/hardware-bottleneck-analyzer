const HardwareCpu = require('../../models/HardwareCpu');
const HardwareGpu = require('../../models/HardwareGpu');
const { CPU, GPU } = require('../../models/Hardware');
const escapeRegex = require('../../utils/escapeRegex');

const MAX_QUERY_LENGTH = 80;
const MAX_TOKENS = 6;

// Fallback benchmark scores (legacy scale) when nothing better is known.
const DEFAULT_CPU_MARK = 8000;
const DEFAULT_GPU_SCORE = 50000;
// Rough conversion from FP32 TFLOPS to the legacy GPU compute score scale
// (e.g. RTX 3060: ~12.7 TFLOPS ~= 99k-170k in the legacy data).
const GPU_SCORE_PER_TFLOP = 10000;
// Rough legacy cpuMark per physical core for modern desktop CPUs.
const CPU_MARK_PER_CORE = 3000;

/**
 * Normalized SKU key used to deduplicate equivalent hardware between the
 * Hardware Master and legacy collections.
 */
function normalizeSkuKey(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/@.*$/, '')
    .replace(/\b(nvidia|geforce|amd|radeon|intel|core|ryzen)\b/gi, '')
    .replace(/[^a-z0-9]/gi, '')
    .trim();
}

function buildTokenRegexList(query) {
  const raw = String(query || '').trim().slice(0, MAX_QUERY_LENGTH);
  if (!raw) return [];
  return raw
    .split(/[\s\-_.,/]+/)
    .filter(Boolean)
    .slice(0, MAX_TOKENS)
    .map((t) => new RegExp(escapeRegex(t), 'i'));
}

const toPositive = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const boundedLimit = (limit) => Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

function legacyCpuScore(l) {
  const mark = toPositive(l.cpuMark);
  if (mark) return { score: Math.round(mark), estimated: false };
  // cpu_data2 rows carry a different benchmark (multiScore) at roughly half the scale.
  const multi = toPositive(l.multiScore);
  if (multi) return { score: Math.round(multi * 2), estimated: true };
  const cores = toPositive(l.cores);
  return { score: cores ? cores * CPU_MARK_PER_CORE : DEFAULT_CPU_MARK, estimated: true };
}

function legacyGpuScore(l) {
  const score = toPositive(l.CUDA);
  return score ? { score: Math.round(score), estimated: false } : { score: DEFAULT_GPU_SCORE, estimated: true };
}

/** Indexes legacy docs by SKU so master records can borrow their benchmark score. */
function indexBySku(docs, nameOf) {
  const map = new Map();
  for (const doc of docs) {
    const sku = normalizeSkuKey(nameOf(doc));
    if (sku && !map.has(sku)) map.set(sku, doc);
  }
  return map;
}

async function searchUnifiedCpus(query, options = {}) {
  const limit = boundedLimit(options.limit);
  const regexList = buildTokenRegexList(query);
  if (regexList.length === 0) return [];

  const masterFilter = {
    $and: regexList.map((reg) => ({
      $or: [{ canonicalName: reg }, { aliases: reg }, { slug: reg }, { hardwareId: reg }],
    })),
  };
  const legacyFilter = {
    $and: regexList.map((reg) => ({ $or: [{ cpuName: reg }, { manufacturer: reg }] })),
  };

  const [masterCpus, legacyCpus] = await Promise.all([
    HardwareCpu.find(masterFilter).limit(limit).lean(),
    CPU.find(legacyFilter).limit(limit * 3).lean(),
  ]);

  // Prefer rows with a real benchmark score when the same SKU appears twice.
  legacyCpus.sort((a, b) => legacyCpuScore(a).estimated - legacyCpuScore(b).estimated);
  const legacyBySku = indexBySku(legacyCpus, (l) => l.cpuName);

  const results = [];
  const seen = new Set();

  for (const m of masterCpus) {
    const sku = normalizeSkuKey(m.canonicalName);
    if (sku) seen.add(sku);

    const cores = m.cores?.total || null;
    const legacy = legacyBySku.get(sku);
    const legacyScore = legacy ? legacyCpuScore(legacy) : null;
    const multiCore = toPositive(m.performance?.multiCoreScore);

    let score;
    if (legacyScore && !legacyScore.estimated) score = legacyScore;
    else if (multiCore) score = { score: Math.round(multiCore), estimated: false };
    else score = { score: cores ? cores * CPU_MARK_PER_CORE : DEFAULT_CPU_MARK, estimated: true };

    results.push({
      _id: m._id,
      displayName: m.canonicalName,
      canonicalName: m.canonicalName,
      cpuName: m.canonicalName,
      hardwareId: m.hardwareId,
      hardwareSource: 'master',
      legacyId: legacy ? String(legacy._id) : null,
      slug: m.slug,
      cpuMark: score.score,
      scoreEstimated: score.estimated,
      cores,
      threads: m.threads || null,
      clocks: m.clocks,
      cache: m.cache,
      power: m.power,
      marketSegment: m.marketSegment,
    });
  }

  for (const l of legacyCpus) {
    if (results.length >= limit) break;
    const sku = normalizeSkuKey(l.cpuName);
    if (!sku || seen.has(sku)) continue;
    seen.add(sku);

    const score = legacyCpuScore(l);
    results.push({
      _id: l._id,
      displayName: l.cpuName,
      canonicalName: l.cpuName,
      cpuName: l.cpuName,
      hardwareId: null,
      hardwareSource: 'legacy',
      legacyId: String(l._id),
      cpuMark: score.score,
      scoreEstimated: score.estimated,
      cores: toPositive(l.cores),
      threads: toPositive(l.threads),
      baseClock: l.baseClock,
      turboClock: l.turboClock,
      TDP: l.TDP,
      socket: l.socket,
      category: l.category,
    });
  }

  return results.slice(0, limit);
}

async function searchUnifiedGpus(query, options = {}) {
  const limit = boundedLimit(options.limit);
  const regexList = buildTokenRegexList(query);
  if (regexList.length === 0) return [];

  const masterFilter = {
    $and: regexList.map((reg) => ({
      $or: [{ canonicalName: reg }, { aliases: reg }, { slug: reg }, { hardwareId: reg }],
    })),
  };
  const legacyFilter = {
    $and: regexList.map((reg) => ({ $or: [{ Device: reg }, { gpuName: reg }, { Manufacturer: reg }] })),
  };

  const [masterGpus, legacyGpus] = await Promise.all([
    HardwareGpu.find(masterFilter).limit(limit).lean(),
    GPU.find(legacyFilter).limit(limit * 3).lean(),
  ]);

  const nameOf = (l) => l.Device || l.gpuName || '';
  const legacyBySku = indexBySku(legacyGpus, nameOf);

  const results = [];
  const seen = new Set();

  for (const m of masterGpus) {
    const sku = normalizeSkuKey(m.canonicalName);
    if (sku) seen.add(sku);

    const legacy = legacyBySku.get(sku);
    const legacyScore = legacy ? legacyGpuScore(legacy) : null;
    const shaders = toPositive(m.cores?.shaderUnits);
    const boost = toPositive(m.clocks?.boostClockMHz);

    let score;
    if (legacyScore && !legacyScore.estimated) score = legacyScore;
    else if (shaders && boost) {
      const tflops = (2 * shaders * boost) / 1e6;
      score = { score: Math.round(tflops * GPU_SCORE_PER_TFLOP), estimated: true };
    } else score = { score: DEFAULT_GPU_SCORE, estimated: true };

    results.push({
      _id: m._id,
      displayName: m.canonicalName,
      canonicalName: m.canonicalName,
      Device: m.canonicalName,
      gpuName: m.canonicalName,
      hardwareId: m.hardwareId,
      hardwareSource: 'master',
      legacyId: legacy ? String(legacy._id) : null,
      slug: m.slug,
      Manufacturer: m.manufacturer || null,
      CUDA: score.score,
      scoreEstimated: score.estimated,
      memory: m.memory,
      cores: m.cores,
      clocks: m.clocks,
      features: m.features,
      power: m.power,
      marketSegment: m.marketSegment,
    });
  }

  for (const l of legacyGpus) {
    if (results.length >= limit) break;
    const name = nameOf(l);
    const sku = normalizeSkuKey(name);
    if (!sku || seen.has(sku)) continue;
    seen.add(sku);

    const score = legacyGpuScore(l);
    results.push({
      _id: l._id,
      displayName: name,
      canonicalName: name,
      Device: name,
      gpuName: name,
      hardwareId: null,
      hardwareSource: 'legacy',
      legacyId: String(l._id),
      Manufacturer: l.Manufacturer || null,
      CUDA: score.score,
      scoreEstimated: score.estimated,
      G3Dmark: l.G3Dmark,
      TDP: l.TDP,
    });
  }

  return results.slice(0, limit);
}

module.exports = {
  MAX_QUERY_LENGTH,
  searchUnifiedCpus,
  searchUnifiedGpus,
  normalizeSkuKey,
};
