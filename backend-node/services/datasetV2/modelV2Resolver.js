/**
 * Resolves physical hardware specifications from Hardware Master records
 * and constructs the 16-feature payload for Model V2 inference.
 */

const { resolveCanonicalCpu, resolveCanonicalGpu, resolveCanonicalGame } = require('../benchmarks/canonicalResolver');
const { findDatasetCpu, findDatasetGpu } = require('./datasetHardwareCatalog');

const KNOWN_V2_GAMES_MAP = Object.freeze({
  'a way out': 'aWayOut',
  'awayout': 'aWayOut',
  'a-way-out': 'aWayOut',
  'airmech strike': 'airMechStrike',
  'airmechstrike': 'airMechStrike',
  'airmech-strike': 'airMechStrike',
  'apex legends': 'apexLegends',
  'apexlegends': 'apexLegends',
  'apex-legends': 'apexLegends',
  'apex': 'apexLegends',
  'battlefield 4': 'battlefield4',
  'battlefield4': 'battlefield4',
  'battlefield-4': 'battlefield4',
  'bf4': 'battlefield4',
  'battletech': 'battletech',
  'battle-tech': 'battletech',
  'call of duty ww2': 'callOfDutyWW2',
  'call of duty: wwii': 'callOfDutyWW2',
  'callofdutyww2': 'callOfDutyWW2',
  'call-of-duty-wwii': 'callOfDutyWW2',
  'call-of-duty-ww2': 'callOfDutyWW2',
  'cod ww2': 'callOfDutyWW2',
  'cod: ww2': 'callOfDutyWW2',
  'counter-strike: global offensive': 'counterStrikeGlobalOffensive',
  'counter strike global offensive': 'counterStrikeGlobalOffensive',
  'counterstrikeglobaloffensive': 'counterStrikeGlobalOffensive',
  'counter-strike-global-offensive': 'counterStrikeGlobalOffensive',
  'counter-strike-2': 'counterStrikeGlobalOffensive',
  'counter-strike 2': 'counterStrikeGlobalOffensive',
  'counter strike 2': 'counterStrikeGlobalOffensive',
  'csgo': 'counterStrikeGlobalOffensive',
  'cs:go': 'counterStrikeGlobalOffensive',
  'cs-go': 'counterStrikeGlobalOffensive',
  'cs2': 'counterStrikeGlobalOffensive',
  'destiny 2': 'destiny2',
  'destiny2': 'destiny2',
  'destiny-2': 'destiny2',
  'dota 2': 'dota2',
  'dota2': 'dota2',
  'dota-2': 'dota2',
  'far cry 5': 'farCry5',
  'farcry5': 'farCry5',
  'far-cry-5': 'farCry5',
  'fortnite': 'fortnite',
  'frostpunk': 'frostpunk',
  'grand theft auto v': 'grandTheftAuto5',
  'grand theft auto 5': 'grandTheftAuto5',
  'grandtheftauto5': 'grandTheftAuto5',
  'grand-theft-auto-v': 'grandTheftAuto5',
  'grand-theft-auto-5': 'grandTheftAuto5',
  'gta 5': 'grandTheftAuto5',
  'gta v': 'grandTheftAuto5',
  'gta-v': 'grandTheftAuto5',
  'gta5': 'grandTheftAuto5',
  'gtav': 'grandTheftAuto5',
  'league of legends': 'leagueOfLegends',
  'leagueoflegends': 'leagueOfLegends',
  'league-of-legends': 'leagueOfLegends',
  'lol': 'leagueOfLegends',
  'overwatch': 'overwatch',
  'overwatch 2': 'overwatch',
  'overwatch-2': 'overwatch',
  'ow': 'overwatch',
  'ow2': 'overwatch',
  'path of exile': 'pathOfExile',
  'pathofexile': 'pathOfExile',
  'path-of-exile': 'pathOfExile',
  'poe': 'pathOfExile',
  'playerunknowns battlegrounds': 'playerUnknownsBattlegrounds',
  'playerunknown\'s battlegrounds': 'playerUnknownsBattlegrounds',
  'playerunknownsbattlegrounds': 'playerUnknownsBattlegrounds',
  'playerunknowns-battlegrounds': 'playerUnknownsBattlegrounds',
  'pubg': 'playerUnknownsBattlegrounds',
  'pubg: battlegrounds': 'playerUnknownsBattlegrounds',
  'pubg-battlegrounds': 'playerUnknownsBattlegrounds',
  'radical heights': 'radicalHeights',
  'radicalheights': 'radicalHeights',
  'radical-heights': 'radicalHeights',
  'rainbow six siege': 'rainbowSixSiege',
  'tom clancy\'s rainbow six siege': 'rainbowSixSiege',
  'tom-clancys-rainbow-six-siege': 'rainbowSixSiege',
  'rainbowsixsiege': 'rainbowSixSiege',
  'rainbow-six-siege': 'rainbowSixSiege',
  'r6': 'rainbowSixSiege',
  'r6s': 'rainbowSixSiege',
  'sea of thieves': 'seaOfThieves',
  'seaofthieves': 'seaOfThieves',
  'sea-of-thieves': 'seaOfThieves',
  'sot': 'seaOfThieves',
  'starcraft 2': 'starcraft2',
  'starcraft ii': 'starcraft2',
  'starcraft2': 'starcraft2',
  'starcraft-2': 'starcraft2',
  'sc2': 'starcraft2',
  'total war: three kingdoms': 'totalWar3Kingdoms',
  'total war 3 kingdoms': 'totalWar3Kingdoms',
  'totalwar3kingdoms': 'totalWar3Kingdoms',
  'total-war-three-kingdoms': 'totalWar3Kingdoms',
  'total-war-3-kingdoms': 'totalWar3Kingdoms',
  'warframe': 'warframe',
  'world of tanks': 'worldOfTanks',
  'worldoftanks': 'worldOfTanks',
  'world-of-tanks': 'worldOfTanks',
  'wot': 'worldOfTanks',
});

const PRESET_ORDINAL_MAP = Object.freeze({
  low: 1,
  med: 2,
  medium: 2,
  high: 3,
  ultra: 4,
  max: 4,
});

const V2_REQUIRED_FIELDS = Object.freeze([
  'CpuNumberOfCores',
  'CpuNumberOfThreads',
  'CpuFrequency',
  'CpuTurboClock',
  'CpuCacheL3',
  'CpuTDP',
  'GpuMemorySize',
  'GpuBandwidth',
  'GpuMemoryBus',
  'GpuNumberOfShadingUnits',
  'GpuBaseClock',
  'GpuBoostClock',
  'GpuNumberOfROPs',
  'GpuFP32Performance',
  'GameName',
  'GameSetting_Ordinal',
]);

/**
 * Normalizes game name to Model V2 canonical name if known, or returns formatted string.
 */
function normalizeV2GameName(rawGame) {
  if (!rawGame || typeof rawGame !== 'string' || !rawGame.trim()) return null;
  const clean = String(rawGame).trim().toLowerCase();
  if (KNOWN_V2_GAMES_MAP[clean]) {
    return KNOWN_V2_GAMES_MAP[clean];
  }
  return String(rawGame).trim();
}

/**
 * Maps graphics settings string or number to Model V2 ordinal.
 */
function normalizeSettingOrdinal(rawSetting) {
  if (typeof rawSetting === 'number' && [1, 2, 3, 4].includes(rawSetting)) {
    return rawSetting;
  }
  if (!rawSetting) return 2; // Default Medium
  const clean = String(rawSetting).trim().toLowerCase();
  return PRESET_ORDINAL_MAP[clean] || 2;
}

/**
 * Resolves Model V2 physical features from request payload and hardware master.
 */
async function resolveModelV2Payload(reqBody) {
  const missingFields = [];

  // 1. If payload already contains full raw Model V2 feature keys
  const hasDirectV2Features = (
    reqBody.CpuNumberOfCores !== undefined &&
    reqBody.GpuNumberOfShadingUnits !== undefined &&
    reqBody.GpuFP32Performance !== undefined
  );

  let cpuSpecs = {};
  let gpuSpecs = {};

  if (hasDirectV2Features) {
    cpuSpecs = {
      CpuNumberOfCores: reqBody.CpuNumberOfCores,
      CpuNumberOfThreads: reqBody.CpuNumberOfThreads,
      CpuFrequency: reqBody.CpuFrequency,
      CpuTurboClock: reqBody.CpuTurboClock,
      CpuCacheL3: reqBody.CpuCacheL3,
      CpuTDP: reqBody.CpuTDP,
    };
    gpuSpecs = {
      GpuMemorySize: reqBody.GpuMemorySize,
      GpuBandwidth: reqBody.GpuBandwidth,
      GpuMemoryBus: reqBody.GpuMemoryBus,
      GpuNumberOfShadingUnits: reqBody.GpuNumberOfShadingUnits,
      GpuBaseClock: reqBody.GpuBaseClock,
      GpuBoostClock: reqBody.GpuBoostClock,
      GpuNumberOfROPs: reqBody.GpuNumberOfROPs,
      GpuFP32Performance: reqBody.GpuFP32Performance,
    };
  } else {
    // 2. Resolve CPU from Master Catalog
    const cpuQuery = reqBody.cpuHardwareId || reqBody.cpuId || reqBody.CPU || reqBody.cpuName || reqBody.CPU_Model;
    if (cpuQuery) {
      const cpuRes = await resolveCanonicalCpu(cpuQuery);
      if (cpuRes.resolved) {
        const c = cpuRes.resolved;
        cpuSpecs = {
          CpuNumberOfCores: c.cores?.total ?? null,
          CpuNumberOfThreads: c.threads ?? null,
          CpuFrequency: c.clocks?.baseClockGHz ? c.clocks.baseClockGHz * 1000 : null,
          CpuTurboClock: c.clocks?.boostClockGHz ? c.clocks.boostClockGHz * 1000 : null,
          CpuCacheL3: c.cache?.l3CacheMB ?? null,
          CpuTDP: c.power?.defaultTdpWatts ?? null,
        };
      }
    }

    // Fallback tier 2A: Resolve CPU from verified project dataset catalog
    if (!cpuSpecs.CpuNumberOfCores || !cpuSpecs.CpuCacheL3 || !cpuSpecs.CpuFrequency) {
      const datasetCpu = findDatasetCpu(cpuQuery);
      if (datasetCpu) {
        if (cpuSpecs.CpuNumberOfCores == null) cpuSpecs.CpuNumberOfCores = datasetCpu.CpuNumberOfCores;
        if (cpuSpecs.CpuNumberOfThreads == null) cpuSpecs.CpuNumberOfThreads = datasetCpu.CpuNumberOfThreads;
        if (cpuSpecs.CpuFrequency == null) cpuSpecs.CpuFrequency = datasetCpu.CpuFrequency;
        if (cpuSpecs.CpuTurboClock == null) cpuSpecs.CpuTurboClock = datasetCpu.CpuTurboClock;
        if (cpuSpecs.CpuCacheL3 == null) cpuSpecs.CpuCacheL3 = datasetCpu.CpuCacheL3;
        if (cpuSpecs.CpuTDP == null) cpuSpecs.CpuTDP = datasetCpu.CpuTDP;
      }
    }

    // Fallback tier 2B: Direct legitimate physical fields from passed payload or raw legacy record
    const rawCpu = reqBody.rawCpu || {};
    if (cpuSpecs.CpuNumberOfCores == null && (rawCpu.cores || reqBody['CPU Cores'])) {
      const parsed = Number(rawCpu.cores || reqBody['CPU Cores']);
      if (!isNaN(parsed) && parsed > 0) cpuSpecs.CpuNumberOfCores = parsed;
    }
    if (cpuSpecs.CpuNumberOfThreads == null && (rawCpu.threads || reqBody['CPU Threads'])) {
      const parsed = Number(rawCpu.threads || reqBody['CPU Threads']);
      if (!isNaN(parsed) && parsed > 0) cpuSpecs.CpuNumberOfThreads = parsed;
    }
    if (cpuSpecs.CpuTDP == null && (rawCpu.TDP || reqBody['CPU TDP (W)'])) {
      const parsed = Number(rawCpu.TDP || reqBody['CPU TDP (W)']);
      if (!isNaN(parsed) && parsed > 0) cpuSpecs.CpuTDP = parsed;
    }
    if (cpuSpecs.CpuFrequency == null && (rawCpu.baseClock || reqBody.cpuFrequency)) {
      const parsed = Number(rawCpu.baseClock || reqBody.cpuFrequency);
      if (!isNaN(parsed) && parsed > 0) {
        cpuSpecs.CpuFrequency = parsed < 50 ? parsed * 1000 : parsed;
      }
    }
    if (cpuSpecs.CpuTurboClock == null && (rawCpu.turboClock || reqBody.cpuTurboClock)) {
      const parsed = Number(rawCpu.turboClock || reqBody.cpuTurboClock);
      if (!isNaN(parsed) && parsed > 0) {
        cpuSpecs.CpuTurboClock = parsed < 50 ? parsed * 1000 : parsed;
      }
    }
    // Fallback tier 2C: If rawCpu was not attached, attempt lookup in legacy CPU collection
    if (!cpuSpecs.CpuNumberOfCores && (reqBody.cpuLegacyId || reqBody.legacyId)) {
      try {
        const { CPU } = require('../../models/Hardware');
        const legacyDoc = await CPU.findById(reqBody.cpuLegacyId || reqBody.legacyId).lean();
        if (legacyDoc) {
          if (cpuSpecs.CpuNumberOfCores == null && legacyDoc.cores) {
            const p = Number(legacyDoc.cores);
            if (!isNaN(p) && p > 0) cpuSpecs.CpuNumberOfCores = p;
          }
          if (cpuSpecs.CpuNumberOfThreads == null && legacyDoc.threads) {
            const p = Number(legacyDoc.threads);
            if (!isNaN(p) && p > 0) cpuSpecs.CpuNumberOfThreads = p;
          }
          if (cpuSpecs.CpuTDP == null && legacyDoc.TDP) {
            const p = Number(legacyDoc.TDP);
            if (!isNaN(p) && p > 0) cpuSpecs.CpuTDP = p;
          }
          if (cpuSpecs.CpuFrequency == null && legacyDoc.baseClock) {
            const p = Number(legacyDoc.baseClock);
            if (!isNaN(p) && p > 0) cpuSpecs.CpuFrequency = p < 50 ? p * 1000 : p;
          }
          if (cpuSpecs.CpuTurboClock == null && legacyDoc.turboClock) {
            const p = Number(legacyDoc.turboClock);
            if (!isNaN(p) && p > 0) cpuSpecs.CpuTurboClock = p < 50 ? p * 1000 : p;
          }
        }
      } catch (_) {}
    }

    // 3. Resolve GPU from Master Catalog
    const gpuQuery = reqBody.gpuHardwareId || reqBody.gpuId || reqBody.GPU || reqBody.gpuName || reqBody.GPU_Model;
    if (gpuQuery) {
      const gpuRes = await resolveCanonicalGpu(gpuQuery);
      if (gpuRes.resolved) {
        const g = gpuRes.resolved;
        const vramMB = g.memory?.vramGB ? g.memory.vramGB * 1000 : null;
        const bwMBs = g.memory?.memoryBandwidthGBs ? g.memory.memoryBandwidthGBs * 1000 : null;
        const busBits = g.memory?.memoryBusBits ?? null;
        const shaders = g.cores?.shaderUnits ?? null;
        const boostMHz = g.clocks?.boostClockMHz ?? null;
        const baseMHz = g.clocks?.baseClockMHz || (boostMHz ? Math.round(boostMHz * 0.85) : null);
        const rops = g.cores?.rops || (busBits ? Math.round(busBits / 4) : null);
        const fp32 = (shaders && boostMHz) ? (2 * shaders * boostMHz) : null;

        gpuSpecs = {
          GpuMemorySize: vramMB,
          GpuBandwidth: bwMBs,
          GpuMemoryBus: busBits,
          GpuNumberOfShadingUnits: shaders,
          GpuBaseClock: baseMHz,
          GpuBoostClock: boostMHz,
          GpuNumberOfROPs: rops,
          GpuFP32Performance: fp32,
        };
      }
    }

    // Fallback tier 3A: Resolve GPU from verified project dataset catalog
    if (!gpuSpecs.GpuNumberOfShadingUnits || !gpuSpecs.GpuFP32Performance || !gpuSpecs.GpuMemorySize) {
      const datasetGpu = findDatasetGpu(gpuQuery);
      if (datasetGpu) {
        if (gpuSpecs.GpuMemorySize == null) gpuSpecs.GpuMemorySize = datasetGpu.GpuMemorySize;
        if (gpuSpecs.GpuBandwidth == null) gpuSpecs.GpuBandwidth = datasetGpu.GpuBandwidth;
        if (gpuSpecs.GpuMemoryBus == null) gpuSpecs.GpuMemoryBus = datasetGpu.GpuMemoryBus;
        if (gpuSpecs.GpuNumberOfShadingUnits == null) gpuSpecs.GpuNumberOfShadingUnits = datasetGpu.GpuNumberOfShadingUnits;
        if (gpuSpecs.GpuBaseClock == null) gpuSpecs.GpuBaseClock = datasetGpu.GpuBaseClock;
        if (gpuSpecs.GpuBoostClock == null) gpuSpecs.GpuBoostClock = datasetGpu.GpuBoostClock;
        if (gpuSpecs.GpuNumberOfROPs == null) gpuSpecs.GpuNumberOfROPs = datasetGpu.GpuNumberOfROPs;
        if (gpuSpecs.GpuFP32Performance == null) gpuSpecs.GpuFP32Performance = datasetGpu.GpuFP32Performance;
      }
    }

    // Fallback tier 3B: Direct legitimate physical fields from passed payload or raw legacy record
    const rawGpu = reqBody.rawGpu || {};
    if (gpuSpecs.GpuMemorySize == null && (rawGpu.memory?.vramGB || reqBody['GPU VRAM (GB)'])) {
      const parsed = Number(rawGpu.memory?.vramGB || reqBody['GPU VRAM (GB)']);
      if (!isNaN(parsed) && parsed > 0) gpuSpecs.GpuMemorySize = parsed * 1000;
    }
    if (gpuSpecs.GpuBandwidth == null && (rawGpu.memory?.memoryBandwidthGBs || reqBody['GPU Bandwidth (GB/s)'])) {
      const parsed = Number(rawGpu.memory?.memoryBandwidthGBs || reqBody['GPU Bandwidth (GB/s)']);
      if (!isNaN(parsed) && parsed > 0) gpuSpecs.GpuBandwidth = parsed * 1000;
    }
    if (gpuSpecs.GpuMemoryBus == null && (rawGpu.memory?.memoryBusBits || reqBody.gpuMemoryBus)) {
      const parsed = Number(rawGpu.memory?.memoryBusBits || reqBody.gpuMemoryBus);
      if (!isNaN(parsed) && parsed > 0) gpuSpecs.GpuMemoryBus = parsed;
    }
    if (gpuSpecs.GpuNumberOfShadingUnits == null && (rawGpu.cores?.shaderUnits || reqBody.gpuShaders)) {
      const parsed = Number(rawGpu.cores?.shaderUnits || reqBody.gpuShaders);
      if (!isNaN(parsed) && parsed > 0) gpuSpecs.GpuNumberOfShadingUnits = parsed;
    }
    if (gpuSpecs.GpuBaseClock == null && (rawGpu.clocks?.baseClockMHz || reqBody.gpuBaseClock)) {
      const parsed = Number(rawGpu.clocks?.baseClockMHz || reqBody.gpuBaseClock);
      if (!isNaN(parsed) && parsed > 0) gpuSpecs.GpuBaseClock = parsed;
    }
    if (gpuSpecs.GpuBoostClock == null && (rawGpu.clocks?.boostClockMHz || reqBody.gpuBoostClock)) {
      const parsed = Number(rawGpu.clocks?.boostClockMHz || reqBody.gpuBoostClock);
      if (!isNaN(parsed) && parsed > 0) gpuSpecs.GpuBoostClock = parsed;
    }
    if (gpuSpecs.GpuNumberOfROPs == null && (rawGpu.cores?.rops || reqBody.gpuRops)) {
      const parsed = Number(rawGpu.cores?.rops || reqBody.gpuRops);
      if (!isNaN(parsed) && parsed > 0) gpuSpecs.GpuNumberOfROPs = parsed;
    }
    if (gpuSpecs.GpuFP32Performance == null && reqBody.gpuFp32) {
      const parsed = Number(reqBody.gpuFp32);
      if (!isNaN(parsed) && parsed > 0) gpuSpecs.GpuFP32Performance = parsed;
    }
  }

  // 4. Resolve Game Name
  const rawGame = (
    reqBody.GameName ||
    reqBody.gameName ||
    reqBody.gameSlug ||
    reqBody.Game ||
    reqBody.game ||
    reqBody.selectedGame ||
    reqBody.Game_Name
  );
  const gameName = normalizeV2GameName(rawGame);

  // 5. Resolve Setting Ordinal
  const rawSetting = reqBody.GameSetting_Ordinal || reqBody.GameSetting || reqBody['Graphics Settings'] || reqBody.Graphics_Setting || reqBody.settings;
  const settingOrdinal = normalizeSettingOrdinal(rawSetting);

  // Construct Final V2 Payload
  const v2Payload = {
    modelVersion: 'v2',
    GameName: gameName,
    GameSetting_Ordinal: settingOrdinal,
    CpuNumberOfCores: cpuSpecs.CpuNumberOfCores != null ? Number(cpuSpecs.CpuNumberOfCores) : null,
    CpuNumberOfThreads: cpuSpecs.CpuNumberOfThreads != null ? Number(cpuSpecs.CpuNumberOfThreads) : null,
    CpuFrequency: cpuSpecs.CpuFrequency != null ? Number(cpuSpecs.CpuFrequency) : null,
    CpuTurboClock: cpuSpecs.CpuTurboClock != null ? Number(cpuSpecs.CpuTurboClock) : null,
    CpuCacheL3: cpuSpecs.CpuCacheL3 != null ? Number(cpuSpecs.CpuCacheL3) : null,
    CpuTDP: cpuSpecs.CpuTDP != null ? Number(cpuSpecs.CpuTDP) : null,
    GpuMemorySize: gpuSpecs.GpuMemorySize != null ? Number(gpuSpecs.GpuMemorySize) : null,
    GpuBandwidth: gpuSpecs.GpuBandwidth != null ? Number(gpuSpecs.GpuBandwidth) : null,
    GpuMemoryBus: gpuSpecs.GpuMemoryBus != null ? Number(gpuSpecs.GpuMemoryBus) : null,
    GpuNumberOfShadingUnits: gpuSpecs.GpuNumberOfShadingUnits != null ? Number(gpuSpecs.GpuNumberOfShadingUnits) : null,
    GpuBaseClock: gpuSpecs.GpuBaseClock != null ? Number(gpuSpecs.GpuBaseClock) : null,
    GpuBoostClock: gpuSpecs.GpuBoostClock != null ? Number(gpuSpecs.GpuBoostClock) : null,
    GpuNumberOfROPs: gpuSpecs.GpuNumberOfROPs != null ? Number(gpuSpecs.GpuNumberOfROPs) : null,
    GpuFP32Performance: gpuSpecs.GpuFP32Performance != null ? Number(gpuSpecs.GpuFP32Performance) : null,
  };

  // Validate all required fields
  for (const field of V2_REQUIRED_FIELDS) {
    const val = v2Payload[field];
    if (val === null || val === undefined || (typeof val === 'number' && Number.isNaN(val))) {
      missingFields.push(field);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
    v2Payload,
  };
}

module.exports = {
  KNOWN_V2_GAMES_MAP,
  PRESET_ORDINAL_MAP,
  V2_REQUIRED_FIELDS,
  normalizeV2GameName,
  normalizeSettingOrdinal,
  resolveModelV2Payload,
};
