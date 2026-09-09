/**
 * Resolves physical hardware specifications from Hardware Master records
 * and constructs the 16-feature payload for Model V2 inference.
 */

const { resolveCanonicalCpu, resolveCanonicalGpu, resolveCanonicalGame } = require('../benchmarks/canonicalResolver');
const { resolveCpuSpecs, resolveGpuSpecs, normalizeHardwareSku } = require('./hardwareCatalogIndex');

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
  let provenance = { cpu: {}, gpu: {} };

  if (hasDirectV2Features) {
    cpuSpecs = {
      CpuNumberOfCores: reqBody.CpuNumberOfCores,
      CpuNumberOfThreads: reqBody.CpuNumberOfThreads,
      CpuFrequency: reqBody.CpuFrequency,
      CpuTurboClock: reqBody.CpuTurboClock,
      CpuCacheL3: reqBody.CpuCacheL3,
      CpuTDP: reqBody.CpuTDP,
    };
    for (const [k, v] of Object.entries(cpuSpecs)) {
      provenance.cpu[k] = { value: v, source: 'direct_payload' };
    }
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
    for (const [k, v] of Object.entries(gpuSpecs)) {
      provenance.gpu[k] = { value: v, source: 'direct_payload' };
    }
  } else {
    // 2. Generic CPU Resolution with Field-Level Provenance
    const cpuQuery = reqBody.cpuHardwareId || reqBody.cpuId || reqBody.CPU || reqBody.cpuName || reqBody.CPU_Model || (reqBody.rawCpu && (reqBody.rawCpu.name || reqBody.rawCpu.model));
    const rawCpu = reqBody.rawCpu || reqBody;
    const cpuResolved = resolveCpuSpecs(cpuQuery, rawCpu);
    cpuSpecs = { ...cpuResolved.specs };
    provenance.cpu = { ...cpuResolved.provenance };

    // Fallback: If canonicalResolver has extra fields (e.g. from MongoDB Hardware Master)
    if (cpuQuery && (!cpuSpecs.CpuNumberOfCores || !cpuSpecs.CpuCacheL3 || !cpuSpecs.CpuTurboClock)) {
      try {
        const canonical = await resolveCanonicalCpu(cpuQuery);
        if (canonical?.resolved) {
          const c = canonical.resolved;
          if (cpuSpecs.CpuNumberOfCores == null && c.cores?.total) {
            cpuSpecs.CpuNumberOfCores = c.cores.total;
            provenance.cpu.CpuNumberOfCores = { value: c.cores.total, source: 'canonical_cpu.cores' };
          }
          if (cpuSpecs.CpuNumberOfThreads == null && c.threads) {
            cpuSpecs.CpuNumberOfThreads = c.threads;
            provenance.cpu.CpuNumberOfThreads = { value: c.threads, source: 'canonical_cpu.threads' };
          }
          if (cpuSpecs.CpuFrequency == null && c.clocks?.baseClockGHz) {
            cpuSpecs.CpuFrequency = c.clocks.baseClockGHz * 1000;
            provenance.cpu.CpuFrequency = { value: cpuSpecs.CpuFrequency, source: 'canonical_cpu.baseClock' };
          }
          if (cpuSpecs.CpuTurboClock == null && c.clocks?.boostClockGHz) {
            cpuSpecs.CpuTurboClock = c.clocks.boostClockGHz * 1000;
            provenance.cpu.CpuTurboClock = { value: cpuSpecs.CpuTurboClock, source: 'canonical_cpu.boostClock' };
          }
          if (cpuSpecs.CpuCacheL3 == null && c.cache?.l3CacheMB) {
            cpuSpecs.CpuCacheL3 = c.cache.l3CacheMB;
            provenance.cpu.CpuCacheL3 = { value: c.cache.l3CacheMB, source: 'canonical_cpu.l3Cache' };
          }
          if (cpuSpecs.CpuTDP == null && c.power?.defaultTdpWatts) {
            cpuSpecs.CpuTDP = c.power.defaultTdpWatts;
            provenance.cpu.CpuTDP = { value: c.power.defaultTdpWatts, source: 'canonical_cpu.tdp' };
          }
        }
      } catch (_) {}
    }

    // Fallback: Legacy CPU collection if legacyId provided
    if ((!cpuSpecs.CpuNumberOfCores || !cpuSpecs.CpuFrequency) && (reqBody.cpuLegacyId || reqBody.legacyId)) {
      try {
        const { CPU } = require('../../models/Hardware');
        const legacyDoc = await CPU.findById(reqBody.cpuLegacyId || reqBody.legacyId).lean();
        if (legacyDoc) {
          if (cpuSpecs.CpuNumberOfCores == null && legacyDoc.cores) {
            cpuSpecs.CpuNumberOfCores = Number(legacyDoc.cores);
            provenance.cpu.CpuNumberOfCores = { value: cpuSpecs.CpuNumberOfCores, source: 'legacy_cpu_doc.cores' };
          }
          if (cpuSpecs.CpuNumberOfThreads == null && legacyDoc.threads) {
            cpuSpecs.CpuNumberOfThreads = Number(legacyDoc.threads);
            provenance.cpu.CpuNumberOfThreads = { value: cpuSpecs.CpuNumberOfThreads, source: 'legacy_cpu_doc.threads' };
          }
          if (cpuSpecs.CpuTDP == null && legacyDoc.TDP) {
            cpuSpecs.CpuTDP = Number(legacyDoc.TDP);
            provenance.cpu.CpuTDP = { value: cpuSpecs.CpuTDP, source: 'legacy_cpu_doc.TDP' };
          }
          if (cpuSpecs.CpuFrequency == null && legacyDoc.baseClock) {
            const bc = Number(legacyDoc.baseClock);
            cpuSpecs.CpuFrequency = bc < 50 ? bc * 1000 : bc;
            provenance.cpu.CpuFrequency = { value: cpuSpecs.CpuFrequency, source: 'legacy_cpu_doc.baseClock' };
          }
          if (cpuSpecs.CpuTurboClock == null && legacyDoc.turboClock) {
            const tc = Number(legacyDoc.turboClock);
            cpuSpecs.CpuTurboClock = tc < 50 ? tc * 1000 : tc;
            provenance.cpu.CpuTurboClock = { value: cpuSpecs.CpuTurboClock, source: 'legacy_cpu_doc.turboClock' };
          }
        }
      } catch (_) {}
    }

    // 3. Generic GPU Resolution with Field-Level Provenance
    const gpuQuery = reqBody.gpuHardwareId || reqBody.gpuId || reqBody.GPU || reqBody.gpuName || reqBody.GPU_Model || (reqBody.rawGpu && (reqBody.rawGpu.name || reqBody.rawGpu.model));
    const rawGpu = reqBody.rawGpu || reqBody;
    const gpuResolved = resolveGpuSpecs(gpuQuery, rawGpu);
    gpuSpecs = { ...gpuResolved.specs };
    provenance.gpu = { ...gpuResolved.provenance };

    // Fallback: If canonicalResolver has extra fields (e.g. from MongoDB Hardware Master)
    if (gpuQuery && (!gpuSpecs.GpuNumberOfShadingUnits || !gpuSpecs.GpuFP32Performance || !gpuSpecs.GpuMemorySize)) {
      try {
        const canonicalG = await resolveCanonicalGpu(gpuQuery);
        if (canonicalG?.resolved) {
          const g = canonicalG.resolved;
          const vramMB = g.memory?.vramGB ? g.memory.vramGB * 1000 : null;
          const bwMBs = g.memory?.memoryBandwidthGBs ? g.memory.memoryBandwidthGBs * 1000 : null;
          const busBits = g.memory?.memoryBusBits ?? null;
          const shaders = g.cores?.shaderUnits ?? null;
          const boostMHz = g.clocks?.boostClockMHz ?? null;
          const baseMHz = g.clocks?.baseClockMHz || (boostMHz ? Math.round(boostMHz * 0.85) : null);
          const rops = g.cores?.rops || (busBits ? Math.round(busBits / 4) : null);
          const fp32 = (shaders && boostMHz) ? (2 * shaders * boostMHz) : null;

          if (gpuSpecs.GpuMemorySize == null && vramMB) {
            gpuSpecs.GpuMemorySize = vramMB;
            provenance.gpu.GpuMemorySize = { value: vramMB, source: 'canonical_gpu.vram' };
          }
          if (gpuSpecs.GpuBandwidth == null && bwMBs) {
            gpuSpecs.GpuBandwidth = bwMBs;
            provenance.gpu.GpuBandwidth = { value: bwMBs, source: 'canonical_gpu.bandwidth' };
          }
          if (gpuSpecs.GpuMemoryBus == null && busBits) {
            gpuSpecs.GpuMemoryBus = busBits;
            provenance.gpu.GpuMemoryBus = { value: busBits, source: 'canonical_gpu.memoryBus' };
          }
          if (gpuSpecs.GpuNumberOfShadingUnits == null && shaders) {
            gpuSpecs.GpuNumberOfShadingUnits = shaders;
            provenance.gpu.GpuNumberOfShadingUnits = { value: shaders, source: 'canonical_gpu.shaderUnits' };
          }
          if (gpuSpecs.GpuBaseClock == null && baseMHz) {
            gpuSpecs.GpuBaseClock = baseMHz;
            provenance.gpu.GpuBaseClock = { value: baseMHz, source: 'canonical_gpu.baseClock' };
          }
          if (gpuSpecs.GpuBoostClock == null && boostMHz) {
            gpuSpecs.GpuBoostClock = boostMHz;
            provenance.gpu.GpuBoostClock = { value: boostMHz, source: 'canonical_gpu.boostClock' };
          }
          if (gpuSpecs.GpuNumberOfROPs == null && rops) {
            gpuSpecs.GpuNumberOfROPs = rops;
            provenance.gpu.GpuNumberOfROPs = { value: rops, source: 'canonical_gpu.rops' };
          }
          if (gpuSpecs.GpuFP32Performance == null && fp32) {
            gpuSpecs.GpuFP32Performance = fp32;
            provenance.gpu.GpuFP32Performance = { value: fp32, source: 'canonical_gpu.fp32' };
          }
        }
      } catch (_) {}
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
    provenance,
  };
}

module.exports = {
  KNOWN_V2_GAMES_MAP,
  PRESET_ORDINAL_MAP,
  V2_REQUIRED_FIELDS,
  normalizeV2GameName,
  normalizeSettingOrdinal,
  resolveModelV2Payload,
  resolveCpuSpecs,
  resolveGpuSpecs,
  normalizeHardwareSku,
};
