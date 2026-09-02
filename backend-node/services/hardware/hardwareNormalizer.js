/**
 * Project Aura Hardware Normalization, Identity & Validation Engine.
 * 
 * Centralized utility for:
 * 1. Generating deterministic Project Aura hardware IDs.
 * 2. Deterministic canonical naming and slugification.
 * 3. Safe alias generation and collision detection.
 * 4. Hardware specification numeric validation.
 * 5. Dual quality state & ML readiness evaluation.
 */

/**
 * Strips extraneous symbols, trims whitespace, and collapses multiple spaces.
 */
function cleanString(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Generates an immutable, lowercase, unique Project Aura hardwareId.
 * Format: cpu_<mfr>_<model>_<segment> or gpu_<mfr>_<model>_<segment>
 */
function generateHardwareId(type, manufacturer, modelOrCanonical, marketSegment = 'desktop') {
  const cleanMfr = (manufacturer || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  let cleanModel = (modelOrCanonical || '')
    .toLowerCase()
    .replace(new RegExp(`^${cleanMfr}\\s*`, 'i'), '')
    .replace(/^intel\s*core\s*/i, 'core_')
    .replace(/^intel\s*/i, '')
    .replace(/^amd\s*/i, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const cleanSegment = (marketSegment || 'desktop').toLowerCase().replace(/[^a-z0-9]/g, '');

  // If cleanModel ends with segment already, avoid repetition
  if (cleanModel.endsWith(`_${cleanSegment}`)) {
    return `${type}_${cleanMfr}_${cleanModel}`;
  }

  return `${type}_${cleanMfr}_${cleanModel}_${cleanSegment}`;
}

/**
 * Generates a clean, URL-safe slug.
 */
function generateSlug(canonicalName, marketSegment = 'desktop') {
  let base = (canonicalName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const seg = (marketSegment || 'desktop').toLowerCase();
  if (seg !== 'desktop' && !base.endsWith(`-${seg}`)) {
    base = `${base}-${seg}`;
  }
  return base;
}

/**
 * Normalizes raw CPU name string to standard canonical name.
 */
function normalizeCpuName(rawName) {
  let name = cleanString(rawName);
  if (!name) return '';

  // Intel standardizations
  if (/^intel/i.test(name) || /^(i[3579]|core|ultra)/i.test(name)) {
    // "Intel Core i7-13700K" / "Intel i7 13700K" / "i7-13700K" / "i7 13700K"
    const coreMatch = name.match(/(?:intel\s*)?(?:core\s*)?(i[3579])[\s-]*(\d{4,5}[a-z0-9]*)/i);
    if (coreMatch) {
      const tier = coreMatch[1].toLowerCase();
      const num = coreMatch[2].toUpperCase();
      return `Intel Core ${tier}-${num}`;
    }
    const ultraMatch = name.match(/(?:intel\s*)?(?:core\s*)?ultra\s*([3579])[\s-]*(\d{3}[a-z0-9]*)/i);
    if (ultraMatch) {
      return `Intel Core Ultra ${ultraMatch[1]} ${ultraMatch[2].toUpperCase()}`;
    }
  }

  // AMD standardizations
  if (/^amd/i.test(name) || /^ryzen/i.test(name)) {
    // "AMD Ryzen 7 7800X3D" / "Ryzen 7 7800X3D"
    const ryzenMatch = name.match(/(?:amd\s*)?ryzen\s*([3579]|threadripper)\s*([a-z0-9\s-]+)/i);
    if (ryzenMatch) {
      const family = ryzenMatch[1];
      const model = ryzenMatch[2].trim().toUpperCase().replace(/\s+/g, ' ');
      if (/threadripper/i.test(family)) {
        return `AMD Ryzen Threadripper ${model}`;
      }
      return `AMD Ryzen ${family} ${model}`;
    }
  }

  return name;
}

/**
 * Normalizes raw GPU name string to standard canonical name.
 */
function normalizeGpuName(rawName) {
  let name = cleanString(rawName);
  if (!name) return '';

  // NVIDIA standardizations
  if (/nvidia|geforce|rtx|gtx/i.test(name)) {
    const rtxMatch = name.match(/(?:nvidia\s*)?(?:geforce\s*)?(rtx|gtx)\s*(\d{3,4}(?:\s*(?:ti|super))?)/i);
    if (rtxMatch) {
      const prefix = rtxMatch[1].toUpperCase();
      let suffixPart = rtxMatch[2].toUpperCase().replace(/\s+/g, ' ');
      // Standardize Ti and SUPER casing
      suffixPart = suffixPart
        .replace(/\bTI\b/g, 'Ti')
        .replace(/\bSUPER\b/g, 'SUPER');
      return `NVIDIA GeForce ${prefix} ${suffixPart}`;
    }
  }

  // AMD standardizations
  if (/amd|radeon|rx/i.test(name)) {
    const rxMatch = name.match(/(?:amd\s*)?(?:radeon\s*)?rx\s*(\d{4}(?:\s*(?:xtx|xt|gre))?)/i);
    if (rxMatch) {
      let suffixPart = rxMatch[1].toUpperCase().replace(/\s+/g, ' ');
      suffixPart = suffixPart
        .replace(/\bXTX\b/g, 'XTX')
        .replace(/\bXT\b/g, 'XT')
        .replace(/\bGRE\b/g, 'GRE');
      return `AMD Radeon RX ${suffixPart}`;
    }
  }

  // Intel standardizations
  if (/intel|arc/i.test(name)) {
    const arcMatch = name.match(/(?:intel\s*)?arc\s*([ab]\d{3})/i);
    if (arcMatch) {
      return `Intel Arc ${arcMatch[1].toUpperCase()}`;
    }
  }

  return name;
}

/**
 * Generates safe alias variations for search.
 * Never strips distinguishing product suffixes like Ti, SUPER, XT, XTX, GRE, X3D, K, F.
 */
function generateAliases(type, manufacturer, canonicalName, marketSegment = 'desktop') {
  const aliases = new Set();
  const clean = cleanString(canonicalName);
  if (!clean) return [];

  aliases.add(clean);

  if (type === 'cpu') {
    // e.g. "Intel Core i5-12400F"
    // -> "Core i5-12400F", "i5-12400F", "i5 12400F", "Intel i5-12400F", "12400F"
    const m = clean.match(/(?:Intel\s+Core\s+|Intel\s+)?(i[3579])-?(\w+)/i);
    if (m) {
      const tier = m[1].toLowerCase();
      const model = m[2].toUpperCase();
      aliases.add(`${tier}-${model}`);
      aliases.add(`${tier} ${model}`);
      aliases.add(`Intel ${tier}-${model}`);
      aliases.add(`Intel ${tier} ${model}`);
      aliases.add(`Core ${tier}-${model}`);
      aliases.add(`Core ${tier} ${model}`);
      aliases.add(`Intel Core ${tier} ${model}`);
      aliases.add(model);
    }

    // e.g. "AMD Ryzen 7 7800X3D"
    // -> "Ryzen 7 7800X3D", "Ryzen 7800X3D", "AMD 7800X3D", "7800X3D"
    const rm = clean.match(/(?:AMD\s+)?Ryzen\s+(\d)\s+(\w+)/i);
    if (rm) {
      const tier = rm[1];
      const model = rm[2].toUpperCase();
      aliases.add(`Ryzen ${tier} ${model}`);
      aliases.add(`Ryzen ${model}`);
      aliases.add(`AMD ${model}`);
      aliases.add(`AMD Ryzen ${model}`);
      aliases.add(model);
    }
  } else if (type === 'gpu') {
    // e.g. "NVIDIA GeForce RTX 4070 SUPER"
    // -> "GeForce RTX 4070 SUPER", "RTX 4070 SUPER", "Nvidia RTX 4070 SUPER"
    const gm = clean.match(/(?:NVIDIA\s+)?(?:GeForce\s+)?(RTX|GTX)\s+([A-Za-z0-9\s]+)/i);
    if (gm) {
      const series = gm[1].toUpperCase();
      const model = gm[2].trim();
      aliases.add(`GeForce ${series} ${model}`);
      aliases.add(`${series} ${model}`);
      aliases.add(`NVIDIA ${series} ${model}`);
      aliases.add(`Nvidia ${series} ${model}`);
    }

    // e.g. "AMD Radeon RX 7800 XT"
    // -> "Radeon RX 7800 XT", "RX 7800 XT", "AMD RX 7800 XT"
    const am = clean.match(/(?:AMD\s+)?(?:Radeon\s+)?RX\s+([A-Za-z0-9\s]+)/i);
    if (am) {
      const model = am[1].trim();
      aliases.add(`Radeon RX ${model}`);
      aliases.add(`RX ${model}`);
      aliases.add(`AMD RX ${model}`);
      aliases.add(`AMD Radeon ${model}`);
    }

    // e.g. "Intel Arc A770"
    const im = clean.match(/(?:Intel\s+)?Arc\s+([A-Za-z0-9\s]+)/i);
    if (im) {
      const model = im[1].trim();
      aliases.add(`Arc ${model}`);
      aliases.add(`Intel Arc ${model}`);
    }

    // Laptop disambiguation
    if (marketSegment === 'laptop') {
      const baseAliases = Array.from(aliases);
      for (const a of baseAliases) {
        aliases.add(`${a} Laptop`);
        aliases.add(`${a} Mobile`);
      }
    }
  }

  return Array.from(aliases);
}

/**
 * Checks a collection of hardware records for alias collisions across different SKUs.
 * Returns an array of collision reports.
 */
function detectAliasCollisions(records) {
  const aliasMap = new Map();
  const collisions = [];

  for (const record of records) {
    const id = record.hardwareId;
    const aliases = record.aliases || [];

    for (const rawAlias of aliases) {
      const normalizedAlias = rawAlias.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!normalizedAlias) continue;

      if (aliasMap.has(normalizedAlias)) {
        const existing = aliasMap.get(normalizedAlias);
        if (existing.hardwareId !== id) {
          collisions.push({
            alias: rawAlias,
            normalizedAlias,
            hardwareIdA: existing.hardwareId,
            canonicalNameA: existing.canonicalName,
            hardwareIdB: id,
            canonicalNameB: record.canonicalName,
          });
        }
      } else {
        aliasMap.set(normalizedAlias, {
          hardwareId: id,
          canonicalName: record.canonicalName,
        });
      }
    }
  }

  return collisions;
}

/**
 * Evaluates ML Readiness for CPU.
 * Requires verified specifications, verified performance scores, and finite continuous features.
 */
function isCpuMlReady(cpu) {
  if (!cpu) return false;
  const q = cpu.quality || {};
  if (q.specQuality !== 'verified' || q.performanceQuality !== 'verified') {
    return false;
  }

  const c = cpu.cores || {};
  const clk = cpu.clocks || {};
  const cache = cpu.cache || {};
  const perf = cpu.performance || {};

  const requiredFields = [
    c.total,
    cpu.threads,
    clk.boostClockGHz,
    cache.l3CacheMB,
    perf.singleCoreScore,
    perf.multiCoreScore,
  ];

  return requiredFields.every((f) => typeof f === 'number' && Number.isFinite(f) && f > 0);
}

/**
 * Evaluates ML Readiness for GPU.
 * Requires verified specifications, verified performance scores, and finite continuous features.
 */
function isGpuMlReady(gpu) {
  if (!gpu) return false;
  const q = gpu.quality || {};
  if (q.specQuality !== 'verified' || q.performanceQuality !== 'verified') {
    return false;
  }

  const m = gpu.memory || {};
  const pwr = gpu.power || {};
  const perf = gpu.performance || {};

  const requiredFields = [
    m.vramGB,
    m.memoryBandwidthGBs,
    pwr.defaultTgpWatts,
    perf.rasterPerformanceScore,
  ];

  return requiredFields.every((f) => typeof f === 'number' && Number.isFinite(f) && f > 0);
}

/**
 * Validates numerical CPU specification boundaries.
 */
function validateCpuSpecs(data) {
  const errors = [];
  if (!data) return { isValid: false, errors: ['Null data payload'] };

  if (!data.hardwareId || !/^cpu_[a-z0-9_]+$/.test(data.hardwareId)) {
    errors.push('Invalid hardwareId format');
  }
  if (!data.canonicalName) errors.push('canonicalName is required');
  if (!data.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    errors.push('Invalid slug format');
  }

  const cores = data.cores || {};
  if (typeof cores.total !== 'number' || cores.total < 1 || !Number.isInteger(cores.total)) {
    errors.push('cores.total must be a positive integer');
  }
  if (typeof data.threads !== 'number' || data.threads < 1 || !Number.isInteger(data.threads)) {
    errors.push('threads must be a positive integer');
  }
  if (data.threads < cores.total) {
    errors.push('threads cannot be less than total cores');
  }

  const clocks = data.clocks || {};
  if (typeof clocks.baseClockGHz !== 'number' || clocks.baseClockGHz <= 0 || !Number.isFinite(clocks.baseClockGHz)) {
    errors.push('clocks.baseClockGHz must be a positive number');
  }
  if (typeof clocks.boostClockGHz !== 'number' || clocks.boostClockGHz <= 0 || !Number.isFinite(clocks.boostClockGHz)) {
    errors.push('clocks.boostClockGHz must be a positive number');
  }

  const cache = data.cache || {};
  if (typeof cache.l3CacheMB !== 'number' || cache.l3CacheMB < 0 || !Number.isFinite(cache.l3CacheMB)) {
    errors.push('cache.l3CacheMB must be a non-negative number');
  }

  const power = data.power || {};
  if (typeof power.defaultTdpWatts !== 'number' || power.defaultTdpWatts <= 0 || !Number.isFinite(power.defaultTdpWatts)) {
    errors.push('power.defaultTdpWatts must be a positive number');
  }

  if (typeof data.releaseYear !== 'number' || data.releaseYear < 2000 || data.releaseYear > 2035) {
    errors.push('releaseYear out of realistic bounds (2000-2035)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates numerical GPU specification boundaries.
 */
function validateGpuSpecs(data) {
  const errors = [];
  if (!data) return { isValid: false, errors: ['Null data payload'] };

  if (!data.hardwareId || !/^gpu_[a-z0-9_]+$/.test(data.hardwareId)) {
    errors.push('Invalid hardwareId format');
  }
  if (!data.canonicalName) errors.push('canonicalName is required');
  if (!data.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    errors.push('Invalid slug format');
  }

  const mem = data.memory || {};
  if (typeof mem.vramGB !== 'number' || mem.vramGB <= 0 || !Number.isFinite(mem.vramGB)) {
    errors.push('memory.vramGB must be a positive number');
  }
  if (typeof mem.memoryBandwidthGBs !== 'number' || mem.memoryBandwidthGBs <= 0 || !Number.isFinite(mem.memoryBandwidthGBs)) {
    errors.push('memory.memoryBandwidthGBs must be a positive number');
  }
  if (typeof mem.memoryBusBits !== 'number' || mem.memoryBusBits < 32 || !Number.isInteger(mem.memoryBusBits)) {
    errors.push('memory.memoryBusBits must be an integer >= 32');
  }

  const cores = data.cores || {};
  if (typeof cores.shaderUnits !== 'number' || cores.shaderUnits < 32 || !Number.isInteger(cores.shaderUnits)) {
    errors.push('cores.shaderUnits must be an integer >= 32');
  }

  const clocks = data.clocks || {};
  if (typeof clocks.boostClockMHz !== 'number' || clocks.boostClockMHz <= 0 || !Number.isFinite(clocks.boostClockMHz)) {
    errors.push('clocks.boostClockMHz must be a positive number');
  }

  const power = data.power || {};
  if (typeof power.defaultTgpWatts !== 'number' || power.defaultTgpWatts <= 0 || !Number.isFinite(power.defaultTgpWatts)) {
    errors.push('power.defaultTgpWatts must be a positive number');
  }

  if (typeof data.releaseYear !== 'number' || data.releaseYear < 2000 || data.releaseYear > 2035) {
    errors.push('releaseYear out of realistic bounds (2000-2035)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  cleanString,
  generateHardwareId,
  generateSlug,
  normalizeCpuName,
  normalizeGpuName,
  generateAliases,
  detectAliasCollisions,
  isCpuMlReady,
  isGpuMlReady,
  validateCpuSpecs,
  validateGpuSpecs,
};
