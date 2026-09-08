/**
 * Project Aura V2 — Milestone V2.1.3E
 * Dataset V2 Feature Manifest & Schema Contract
 *
 * Single machine-readable source of truth for Dataset V2 features,
 * targets, audit columns, validation bounds, and strict leakage rules.
 */

const DATASET_SCHEMA_VERSION = '2.0';
const FEATURE_MANIFEST_VERSION = '2.0.0';

/**
 * Standardized Numeric Preset Encoding for Model V2 Training Matrix.
 * custom/unknown are explicitly not assigned to arbitrary tiers.
 */
const PRESET_NUMERIC_MAP = Object.freeze({
  low: 1,
  medium: 2,
  high: 3,
  ultra: 4,
});

/**
 * Prohibited target-leakage features that MUST NOT enter the training matrix.
 */
const PROHIBITED_LEAKAGE_FEATURES = Object.freeze([
  'bottleneckScore',
  'bottleneck_score',
  'bottleneckPercentage',
  'bottleneck_percentage',
  'gamingIndex',
  'gaming_index',
  'performanceIndex',
  'performance_index',
  'predictedFps',
  'predicted_fps',
  'estimatedFps',
  'estimated_fps',
  'modelV1Output',
  'model_v1_output',
  'model_v1_prediction',
  'user_reported_fps',
  'synthetic_cuda',
  'synthetic_cuda_formula',
  'fixed_fg_multiplier',
  'target_derived_ratio',
  'rasterPerformanceScore',
  'singleCoreScore',
  'multiCoreScore',
]);

/**
 * Required Non-Feature Audit / Lineage Identifier Columns.
 * Kept distinct from ML input features.
 */
const AUDIT_COLUMNS = Object.freeze([
  'benchmarkId',
  'observationFingerprint',
  'gameSlug',
  'cpuHardwareId',
  'gpuHardwareId',
  'sourceGroupId',
  'benchmarkSessionId',
  'collectedAt',
]);

/**
 * Dataset V2 Feature Specifications.
 */
const FEATURE_DEFINITIONS = Object.freeze([
  // --- CPU Physical Specifications ---
  {
    name: 'cpu_cores_total',
    category: 'cpu',
    type: 'integer',
    unit: 'count',
    required: true,
    usedInInitialModel: true,
    source: 'HardwareCpu.cores.total',
    min: 1,
    max: 256,
    description: 'Total physical CPU execution cores',
  },
  {
    name: 'cpu_threads',
    category: 'cpu',
    type: 'integer',
    unit: 'count',
    required: true,
    usedInInitialModel: true,
    source: 'HardwareCpu.threads',
    min: 1,
    max: 512,
    description: 'Total simultaneous logical execution threads',
  },
  {
    name: 'cpu_boost_clock_ghz',
    category: 'cpu',
    type: 'float',
    unit: 'GHz',
    required: true,
    usedInInitialModel: true,
    source: 'HardwareCpu.clocks.boostClockGHz',
    min: 0.5,
    max: 10.0,
    description: 'Maximum advertised single-core boost clock in GHz',
  },
  {
    name: 'cpu_l3_cache_mb',
    category: 'cpu',
    type: 'float',
    unit: 'MB',
    required: true,
    usedInInitialModel: true,
    source: 'HardwareCpu.cache.l3CacheMB',
    min: 0.0,
    max: 2048.0,
    description: 'Total Level 3 cache capacity in Megabytes',
  },
  {
    name: 'cpu_tdp_w',
    category: 'cpu',
    type: 'float',
    unit: 'Watts',
    required: true,
    usedInInitialModel: true,
    source: 'HardwareCpu.power.defaultTdpWatts',
    min: 5.0,
    max: 1000.0,
    description: 'Default CPU Thermal Design Power in Watts',
  },

  // --- GPU Physical Specifications ---
  {
    name: 'gpu_vram_gb',
    category: 'gpu',
    type: 'float',
    unit: 'GB',
    required: true,
    usedInInitialModel: true,
    source: 'HardwareGpu.memory.vramGB',
    min: 1.0,
    max: 128.0,
    description: 'Dedicated GPU video memory capacity in Gigabytes',
  },
  {
    name: 'gpu_memory_bandwidth_gbs',
    category: 'gpu',
    type: 'float',
    unit: 'GB/s',
    required: true,
    usedInInitialModel: true,
    source: 'HardwareGpu.memory.memoryBandwidthGBs',
    min: 10.0,
    max: 5000.0,
    description: 'Theoretical GPU memory bandwidth throughput in GB/s',
  },
  {
    name: 'gpu_memory_bus_bits',
    category: 'gpu',
    type: 'integer',
    unit: 'Bits',
    required: true,
    usedInInitialModel: true,
    source: 'HardwareGpu.memory.memoryBusBits',
    min: 32,
    max: 8192,
    description: 'GPU memory bus interface width in bits',
  },
  {
    name: 'gpu_shader_units',
    category: 'gpu',
    type: 'integer',
    unit: 'count',
    required: true,
    usedInInitialModel: true,
    source: 'HardwareGpu.cores.shaderUnits',
    min: 64,
    max: 65536,
    description: 'Total GPU shader execution cores / ALUs / CUDA cores',
  },
  {
    name: 'gpu_boost_clock_mhz',
    category: 'gpu',
    type: 'float',
    unit: 'MHz',
    required: true,
    usedInInitialModel: true,
    source: 'HardwareGpu.clocks.boostClockMHz',
    min: 100.0,
    max: 5000.0,
    description: 'Advertised GPU core boost clock frequency in MHz',
  },
  {
    name: 'gpu_tgp_w',
    category: 'gpu',
    type: 'float',
    unit: 'Watts',
    required: true,
    usedInInitialModel: true,
    source: 'HardwareGpu.power.defaultTgpWatts',
    min: 10.0,
    max: 1500.0,
    description: 'Total Graphics Power / board power rating in Watts',
  },

  // --- System Specifications ---
  {
    name: 'system_ram_gb',
    category: 'system',
    type: 'float',
    unit: 'GB',
    required: true,
    usedInInitialModel: true,
    source: 'GameBenchmark.system.ramGB',
    min: 1.0,
    max: 512.0,
    description: 'Installed system memory capacity in Gigabytes',
  },

  // --- Display & Workload Features ---
  {
    name: 'render_width',
    category: 'display',
    type: 'integer',
    unit: 'Pixels',
    required: true,
    usedInInitialModel: true,
    source: 'GameBenchmark.display.width',
    min: 640,
    max: 15360,
    description: 'Horizontal output resolution in pixels',
  },
  {
    name: 'render_height',
    category: 'display',
    type: 'integer',
    unit: 'Pixels',
    required: true,
    usedInInitialModel: true,
    source: 'GameBenchmark.display.height',
    min: 480,
    max: 8640,
    description: 'Vertical output resolution in pixels',
  },
  {
    name: 'pixel_count',
    category: 'display',
    type: 'integer',
    unit: 'Pixels',
    required: true,
    usedInInitialModel: true,
    source: 'Computed (render_width * render_height)',
    min: 300000,
    max: 132710400,
    description: 'Total render resolution pixel load',
  },
  {
    name: 'preset_encoded',
    category: 'workload',
    type: 'integer',
    unit: 'ordinal',
    required: true,
    usedInInitialModel: true,
    source: 'GameBenchmark.graphics.normalizedPreset (low=1, medium=2, high=3, ultra=4)',
    allowedValues: [1, 2, 3, 4],
    description: 'Standard graphics quality tier (1=low, 2=medium, 3=high, 4=ultra)',
  },
  {
    name: 'ray_tracing_enabled',
    category: 'workload',
    type: 'binary',
    unit: '0_or_1',
    required: true,
    usedInInitialModel: true,
    source: 'GameBenchmark.rayTracing.enabled',
    allowedValues: [0, 1],
    description: 'Hardware ray tracing active flag (0=disabled, 1=enabled)',
  },
  {
    name: 'upscaling_active',
    category: 'workload',
    type: 'binary',
    unit: '0_or_1',
    required: true,
    usedInInitialModel: true,
    source: 'GameBenchmark.upscaling.enabled',
    allowedValues: [0, 1],
    description: 'Resolution reconstruction / upscaler active flag (0=disabled, 1=enabled)',
  },
  {
    name: 'internal_pixel_count',
    category: 'workload',
    type: 'integer',
    unit: 'Pixels',
    required: true,
    usedInInitialModel: true,
    source: 'Computed from internalResolution or native pixel_count',
    min: 76800,
    max: 132710400,
    description: 'Actual internal render pixels prior to reconstruction',
  },
  {
    name: 'frame_gen_active',
    category: 'workload',
    type: 'binary',
    unit: '0_or_1',
    required: true,
    usedInInitialModel: true,
    source: 'GameBenchmark.frameGeneration.enabled',
    allowedValues: [0], // Native FPS matrix only allows 0
    description: 'Frame generation active flag (must be 0 for native FPS training dataset)',
  },

  // --- Game Vintage ---
  {
    name: 'game_release_year',
    category: 'game',
    type: 'integer',
    unit: 'Year',
    required: false,
    usedInInitialModel: true,
    source: 'Game.releaseYear',
    min: 1980,
    max: 2050,
    description: 'Baseline game release year / engine vintage',
  },
]);

/**
 * Ground Truth Target Variables.
 */
const TARGET_DEFINITIONS = Object.freeze([
  {
    name: 'target_avg_fps',
    type: 'float',
    unit: 'FPS',
    required: true,
    source: 'GameBenchmark.performance.avgFps',
    min: 5.0,
    max: 1200.0,
    description: 'Primary ground-truth measured native average frames per second',
  },
  {
    name: 'target_1pct_low_fps',
    type: 'float',
    unit: 'FPS',
    required: false,
    source: 'GameBenchmark.performance.onePercentLowFps',
    min: 0.0,
    max: 1200.0,
    description: 'Optional secondary measured 1% low frame rate (null if unmeasured)',
  },
]);

module.exports = {
  DATASET_SCHEMA_VERSION,
  FEATURE_MANIFEST_VERSION,
  PRESET_NUMERIC_MAP,
  PROHIBITED_LEAKAGE_FEATURES,
  AUDIT_COLUMNS,
  FEATURE_DEFINITIONS,
  TARGET_DEFINITIONS,
};
