const mongoose = require('mongoose');
require('dotenv').config();

const HardwareCpu = require('../models/HardwareCpu');
const HardwareGpu = require('../models/HardwareGpu');
const { CPU, GPU } = require('../models/Hardware');
const escapeRegex = require('../utils/escapeRegex');

function normalizeKey(str) {
  return (str || '')
    .toLowerCase()
    .replace(/@.*$/, '')
    .replace(/\b(nvidia|geforce|amd|radeon|intel|core)\b/gi, '')
    .replace(/[^a-z0-9]/gi, '')
    .trim();
}

function buildSearchRegex(query) {
  const trimmed = (query || '').trim();
  if (!trimmed) return null;
  const escaped = escapeRegex(trimmed);
  // Allow spaces, hyphens, and underscores to be interchangeable
  const flexible = escaped.replace(/[\s\-_]+/g, '[\\s\\-_]?');
  return new RegExp(flexible, 'i');
}

async function searchUnifiedCpus(query, limit = 20) {
  const reg = buildSearchRegex(query);
  if (!reg) return [];

  // Search Master
  const masterFilter = {
    $or: [
      { canonicalName: reg },
      { aliases: reg },
      { slug: reg },
      { hardwareId: reg },
    ],
  };
  const masterList = await HardwareCpu.find(masterFilter).limit(limit).lean();

  // Search Legacy
  const legacyFilter = {
    cpuName: reg,
  };
  const legacyList = await CPU.find(legacyFilter).limit(limit * 2).lean();

  const results = [];
  const seenKeys = new Set();

  for (const m of masterList) {
    const key = normalizeKey(m.canonicalName);
    if (key) seenKeys.add(key);
    results.push({
      _id: m._id,
      hardwareId: m.hardwareId,
      canonicalName: m.canonicalName,
      cpuName: m.canonicalName,
      cpuMark: m.performance?.multiCoreScore || (m.cores?.total ? m.cores.total * 3000 : 8000),
      cores: m.cores?.total || 6,
      threads: m.threads || 12,
      clocks: m.clocks,
      cache: m.cache,
      power: m.power,
      marketSegment: m.marketSegment,
      quality: m.quality,
      hardwareSource: 'master',
    });
  }

  for (const l of legacyList) {
    const key = normalizeKey(l.cpuName);
    if (!key || seenKeys.has(key)) continue;
    seenKeys.add(key);
    results.push({
      _id: l._id,
      cpuName: l.cpuName,
      cpuMark: parseInt(l.cpuMark, 10) || 8000,
      cores: parseInt(l.cores, 10) || 6,
      hardwareSource: 'legacy',
    });
    if (results.length >= limit) break;
  }

  return results.slice(0, limit);
}

async function searchUnifiedGpus(query, limit = 20) {
  const reg = buildSearchRegex(query);
  if (!reg) return [];

  // Search Master
  const masterFilter = {
    $or: [
      { canonicalName: reg },
      { aliases: reg },
      { slug: reg },
      { hardwareId: reg },
    ],
  };
  const masterList = await HardwareGpu.find(masterFilter).limit(limit).lean();

  // Search Legacy
  const legacyFilter = {
    Device: reg,
  };
  const legacyList = await GPU.find(legacyFilter).limit(limit * 2).lean();

  const results = [];
  const seenKeys = new Set();

  for (const m of masterList) {
    const key = normalizeKey(m.canonicalName);
    if (key) seenKeys.add(key);
    const vram = m.memory?.vramGB || 8;
    const cudaEst = m.cores?.shaderUnits || (vram >= 16 ? 220000 : vram >= 12 ? 140000 : 80000);
    results.push({
      _id: m._id,
      hardwareId: m.hardwareId,
      canonicalName: m.canonicalName,
      Device: m.canonicalName,
      Manufacturer: m.manufacturer || 'NVIDIA',
      CUDA: cudaEst,
      memory: m.memory,
      cores: m.cores,
      clocks: m.clocks,
      features: m.features,
      power: m.power,
      marketSegment: m.marketSegment,
      quality: m.quality,
      hardwareSource: 'master',
    });
  }

  for (const l of legacyList) {
    const key = normalizeKey(l.Device);
    if (!key || seenKeys.has(key)) continue;
    seenKeys.add(key);
    results.push({
      _id: l._id,
      Device: l.Device,
      Manufacturer: l.Manufacturer || 'NVIDIA',
      CUDA: parseInt(l.CUDA, 10) || 50000,
      hardwareSource: 'legacy',
    });
    if (results.length >= limit) break;
  }

  return results.slice(0, limit);
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const testQueries = [
    { type: 'cpu', q: 'i5 8400' },
    { type: 'cpu', q: 'i5-9500' },
    { type: 'cpu', q: 'i5 10400F' },
    { type: 'cpu', q: '7800X3D' },
    { type: 'gpu', q: 'GTX 1660 SUPER' },
    { type: 'gpu', q: '1660 super' },
    { type: 'gpu', q: 'RTX 3060 Ti' },
    { type: 'gpu', q: '3060ti' },
    { type: 'gpu', q: 'RTX 4070' },
    { type: 'gpu', q: '4070' },
  ];

  for (const t of testQueries) {
    const res = t.type === 'cpu' ? await searchUnifiedCpus(t.q) : await searchUnifiedGpus(t.q);
    console.log(`\nQuery: [${t.type.toUpperCase()}] "${t.q}" -> Found ${res.length} matches:`);
    res.slice(0, 3).forEach(r => {
      console.log(`  - [${r.hardwareSource}] ${r.cpuName || r.Device}`);
    });
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
