/**
 * Project Aura V2 — Milestone V2.1.3E
 * Feature Builder Service
 *
 * Extracts specification-accurate, non-leaking ML physical and workload features
 * from GameBenchmark, HardwareCpu, HardwareGpu, and Game records.
 */

const { PRESET_NUMERIC_MAP } = require('./featureManifest');

/**
 * Validates that a value is a valid finite positive number.
 * @param {*} val
 * @param {boolean} allowZero
 * @returns {boolean}
 */
function isValidNumber(val, allowZero = false) {
  if (val === null || val === undefined || val === '') return false;
  const num = Number(val);
  if (!Number.isFinite(num)) return false;
  return allowZero ? num >= 0 : num > 0;
}

/**
 * Extracts and engineers raw features, targets, and audit columns from joined records.
 *
 * @param {Object} params
 * @param {Object} params.benchmark - GameBenchmark document
 * @param {Object} params.cpu - Canonical HardwareCpu document
 * @param {Object} params.gpu - Canonical HardwareGpu document
 * @param {Object} params.game - Canonical Game document (optional)
 * @returns {Object} { features, targets, audit, errors: string[] }
 */
function extractFeatures({ benchmark, cpu, gpu, game }) {
  const errors = [];

  // 1. Validate joined document presence
  if (!benchmark) {
    return { features: null, targets: null, audit: null, errors: ['MISSING_BENCHMARK_RECORD'] };
  }

  if (!cpu) {
    errors.push('CPU_NOT_FOUND');
  }

  if (!gpu) {
    errors.push('GPU_NOT_FOUND');
  }

  if (!game) {
    errors.push('GAME_NOT_FOUND');
  }

  // If core documents are missing, early return with errors
  if (errors.length > 0) {
    return { features: null, targets: null, audit: null, errors };
  }

  // 2. CPU Physical Features
  const cpu_cores_total = cpu.cores && isValidNumber(cpu.cores.total) ? Math.floor(Number(cpu.cores.total)) : null;
  const cpu_threads = isValidNumber(cpu.threads) ? Math.floor(Number(cpu.threads)) : null;
  const cpu_boost_clock_ghz = cpu.clocks && isValidNumber(cpu.clocks.boostClockGHz) ? Number(cpu.clocks.boostClockGHz) : null;
  const cpu_l3_cache_mb = cpu.cache && isValidNumber(cpu.cache.l3CacheMB, true) ? Number(cpu.cache.l3CacheMB) : null;
  const cpu_tdp_w = cpu.power && isValidNumber(cpu.power.defaultTdpWatts) ? Number(cpu.power.defaultTdpWatts) : null;

  // 3. GPU Physical Features
  const gpu_vram_gb = gpu.memory && isValidNumber(gpu.memory.vramGB) ? Number(gpu.memory.vramGB) : null;
  const gpu_memory_bandwidth_gbs = gpu.memory && isValidNumber(gpu.memory.memoryBandwidthGBs) ? Number(gpu.memory.memoryBandwidthGBs) : null;
  const gpu_memory_bus_bits = gpu.memory && isValidNumber(gpu.memory.memoryBusBits) ? Math.floor(Number(gpu.memory.memoryBusBits)) : null;
  const gpu_shader_units = gpu.cores && isValidNumber(gpu.cores.shaderUnits) ? Math.floor(Number(gpu.cores.shaderUnits)) : null;
  const gpu_boost_clock_mhz = gpu.clocks && isValidNumber(gpu.clocks.boostClockMHz) ? Number(gpu.clocks.boostClockMHz) : null;
  const gpu_tgp_w = gpu.power && isValidNumber(gpu.power.defaultTgpWatts) ? Number(gpu.power.defaultTgpWatts) : null;

  // 4. System Features (RAM)
  const system_ram_gb = benchmark.system && isValidNumber(benchmark.system.ramGB) ? Number(benchmark.system.ramGB) : null;

  // 5. Display Features
  const rawWidth = benchmark.display?.width;
  const rawHeight = benchmark.display?.height;
  const render_width = isValidNumber(rawWidth) ? Math.floor(Number(rawWidth)) : null;
  const render_height = isValidNumber(rawHeight) ? Math.floor(Number(rawHeight)) : null;
  const pixel_count = render_width && render_height ? render_width * render_height : null;

  if (!render_width || !render_height || render_width < 640 || render_height < 480) {
    errors.push('INVALID_RESOLUTION');
  }

  // 6. Graphics Preset Encoding
  const normalizedPreset = (benchmark.graphics?.normalizedPreset || '').toLowerCase().trim();
  let preset_encoded = null;
  if (Object.prototype.hasOwnProperty.call(PRESET_NUMERIC_MAP, normalizedPreset)) {
    preset_encoded = PRESET_NUMERIC_MAP[normalizedPreset];
  } else {
    errors.push('UNSUPPORTED_PRESET');
  }

  // 7. Ray Tracing
  const ray_tracing_enabled = benchmark.rayTracing?.enabled ? 1 : 0;

  // 8. Upscaling & Internal Pixel Count
  const upscaling_active = benchmark.upscaling?.enabled ? 1 : 0;
  let internal_pixel_count = null;

  if (upscaling_active === 0) {
    internal_pixel_count = pixel_count;
  } else {
    const intW = benchmark.upscaling?.internalResolution?.width;
    const intH = benchmark.upscaling?.internalResolution?.height;
    if (isValidNumber(intW) && isValidNumber(intH) && Number(intW) >= 320 && Number(intH) >= 240) {
      internal_pixel_count = Math.floor(Number(intW)) * Math.floor(Number(intH));
    } else {
      errors.push('MISSING_INTERNAL_RESOLUTION');
    }
  }

  // 9. Frame Generation
  const frame_gen_active = benchmark.frameGeneration?.enabled ? 1 : 0;
  if (frame_gen_active === 1) {
    errors.push('FRAME_GENERATION_NOT_NATIVE');
  }

  // 10. Game Profile
  const game_release_year = game && isValidNumber(game.releaseYear) ? Math.floor(Number(game.releaseYear)) : null;

  // 11. Targets
  const rawAvgFps = benchmark.performance?.avgFps;
  const target_avg_fps = isValidNumber(rawAvgFps) && Number(rawAvgFps) >= 5 && Number(rawAvgFps) <= 1200 ? Number(rawAvgFps) : null;
  if (target_avg_fps === null) {
    errors.push('INVALID_TARGET');
  }

  const raw1PctLow = benchmark.performance?.onePercentLowFps;
  const target_1pct_low_fps = isValidNumber(raw1PctLow, true) && Number(raw1PctLow) <= 1200 ? Number(raw1PctLow) : null;

  // 12. Assemble Output
  const features = {
    cpu_cores_total,
    cpu_threads,
    cpu_boost_clock_ghz,
    cpu_l3_cache_mb,
    cpu_tdp_w,
    gpu_vram_gb,
    gpu_memory_bandwidth_gbs,
    gpu_memory_bus_bits,
    gpu_shader_units,
    gpu_boost_clock_mhz,
    gpu_tgp_w,
    system_ram_gb,
    render_width,
    render_height,
    pixel_count,
    preset_encoded,
    ray_tracing_enabled,
    upscaling_active,
    internal_pixel_count,
    frame_gen_active,
    game_release_year,
  };

  const targets = {
    target_avg_fps,
    target_1pct_low_fps,
  };

  const audit = {
    benchmarkId: benchmark.benchmarkId,
    observationFingerprint: benchmark.observationFingerprint,
    gameSlug: benchmark.gameSlug,
    cpuHardwareId: benchmark.cpuHardwareId,
    gpuHardwareId: benchmark.gpuHardwareId,
    sourceGroupId: benchmark.provenance?.sourceGroupId || null,
    benchmarkSessionId: benchmark.provenance?.benchmarkSessionId || null,
    collectedAt: benchmark.provenance?.collectedAt ? new Date(benchmark.provenance.collectedAt).toISOString() : null,
  };

  return {
    features,
    targets,
    audit,
    errors,
  };
}

module.exports = {
  extractFeatures,
  isValidNumber,
};
