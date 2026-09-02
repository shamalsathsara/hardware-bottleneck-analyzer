const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  ramGB: { type: Number, min: 1, max: 512, default: null },
  ramChannels: { type: String, enum: ['single', 'dual', 'quad', 'other', null], default: null },
  ramType: { type: String, enum: ['DDR3', 'DDR4', 'DDR5', 'LPDDR4', 'LPDDR5', 'Other', null], default: null },
  ramSpeedMTs: { type: Number, min: 800, max: 12000, default: null },
  operatingSystem: { type: String, trim: true, default: null },
  driverVersion: { type: String, trim: true, default: null },
  gameVersion: { type: String, trim: true, default: null },
  api: { type: String, enum: ['DirectX 11', 'DirectX 12', 'Vulkan', 'OpenGL', 'Other', null], default: null },
  resizableBarEnabled: { type: Boolean, default: null },
  cpuOverclocked: { type: Boolean, default: null },
  gpuOverclocked: { type: Boolean, default: null },
}, { _id: false });

const displayConfigSchema = new mongoose.Schema({
  width: { type: Number, required: true, min: 640, max: 15360 },
  height: { type: Number, required: true, min: 480, max: 8640 },
  label: { type: String, trim: true, default: 'Custom' },
  pixelCount: { type: Number, required: true, min: 300000 },
  aspectRatio: { type: String, trim: true, default: '16:9' },
}, { _id: false });

const graphicsConfigSchema = new mongoose.Schema({
  rawPreset: { type: String, trim: true, default: null },
  normalizedPreset: {
    type: String,
    enum: ['low', 'medium', 'high', 'ultra', 'custom', 'unknown'],
    default: 'unknown',
    required: true,
  },
  renderScale: { type: Number, min: 0.1, max: 3.0, default: 1.0 },
}, { _id: false });

const rayTracingConfigSchema = new mongoose.Schema({
  enabled: { type: Boolean, required: true, default: false },
  preset: {
    type: String,
    enum: ['off', 'low', 'medium', 'high', 'ultra', 'overdrive', 'custom', null],
    default: 'off',
  },
  pathTracing: { type: Boolean, default: false },
}, { _id: false });

const upscalingConfigSchema = new mongoose.Schema({
  enabled: { type: Boolean, required: true, default: false },
  technology: {
    type: String,
    enum: ['DLSS', 'FSR', 'XeSS', 'None', 'Other'],
    default: 'None',
  },
  mode: {
    type: String,
    enum: ['UltraPerformance', 'Performance', 'Balanced', 'Quality', 'NativeAA', 'Custom', null],
    default: null,
  },
  internalResolution: {
    width: { type: Number, min: 320, default: null },
    height: { type: Number, min: 240, default: null },
  },
}, { _id: false });

const frameGenerationConfigSchema = new mongoose.Schema({
  enabled: { type: Boolean, required: true, default: false },
  technology: { type: String, trim: true, default: 'None' },
}, { _id: false });

const performanceMetricsSchema = new mongoose.Schema({
  avgFps: { type: Number, required: true, min: 5, max: 1200 },
  onePercentLowFps: { type: Number, min: 0, max: 1200, default: null },
  pointOnePercentLowFps: { type: Number, min: 0, max: 1200, default: null },
  minFps: { type: Number, min: 0, max: 1200, default: null },
  maxFps: { type: Number, min: 0, max: 2000, default: null },
  medianFps: { type: Number, min: 0, max: 1200, default: null },
  frameTimeMs: {
    avg: { type: Number, min: 0, default: null },
    p99: { type: Number, min: 0, default: null },
  },
}, { _id: false });

const testConditionsSchema = new mongoose.Schema({
  sampleDurationSeconds: { type: Number, min: 1, max: 3600, default: null },
  runCount: { type: Number, min: 1, max: 100, default: 1 },
  benchmarkScene: { type: String, trim: true, default: null },
  benchmarkType: {
    type: String,
    enum: ['built_in_benchmark', 'manual_gameplay', 'repeatable_route', 'unknown'],
    default: 'unknown',
  },
  captureTool: { type: String, trim: true, default: null },
  captureToolVersion: { type: String, trim: true, default: null },
}, { _id: false });

const provenanceSchema = new mongoose.Schema({
  sourceType: {
    type: String,
    enum: [
      'project_aura_test',
      'licensed_dataset',
      'official_benchmark_api',
      'publisher_data',
      'trusted_review',
      'community_submission',
      'legacy_dataset',
    ],
    required: true,
  },
  sourceName: { type: String, required: true, trim: true },
  sourceUrl: { type: String, trim: true, default: null },
  sourceRecordId: { type: String, trim: true, default: null },
  sourceGroupId: { type: String, trim: true, default: null },
  benchmarkSessionId: { type: String, trim: true, default: null },
  collectedAt: { type: Date, required: true, default: Date.now },
  verifiedAt: { type: Date, default: null },
  ingestionMethod: {
    type: String,
    enum: ['manual_verification', 'partner_api', 'curated_batch'],
    default: 'manual_verification',
  },
}, { _id: false });

const qualitySchema = new mongoose.Schema({
  grade: {
    type: String,
    enum: ['verified', 'high', 'medium', 'low', 'quarantined', 'rejected'],
    default: 'medium',
    required: true,
  },
  dataQualityScore: { type: Number, min: 0, max: 100, default: 50 },
  flags: { type: [String], default: [] },
  quarantineReason: { type: String, trim: true, default: null },
}, { _id: false });

const gameBenchmarkSchema = new mongoose.Schema({
  benchmarkId: {
    type: String,
    required: [true, 'benchmarkId is required'],
    unique: true,
    trim: true,
    immutable: true,
    match: [/^bm_[a-z0-9_-]+$/, 'benchmarkId must start with bm_ and contain only lowercase alphanumeric characters'],
  },
  observationFingerprint: {
    type: String,
    required: [true, 'observationFingerprint is required'],
    trim: true,
    immutable: true,
  },

  // Game Identity
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: [true, 'gameId reference to Game catalog is required'],
  },
  gameSlug: {
    type: String,
    required: [true, 'gameSlug is required'],
    lowercase: true,
    trim: true,
  },
  rawGameName: {
    type: String,
    required: [true, 'rawGameName is required for auditability'],
    trim: true,
  },

  // Hardware Identity
  cpuHardwareId: {
    type: String,
    required: [true, 'cpuHardwareId is required'],
    trim: true,
  },
  rawCpuString: {
    type: String,
    required: [true, 'rawCpuString is required for auditability'],
    trim: true,
  },
  gpuHardwareId: {
    type: String,
    required: [true, 'gpuHardwareId is required'],
    trim: true,
  },
  rawGpuString: {
    type: String,
    required: [true, 'rawGpuString is required for auditability'],
    trim: true,
  },

  // Configurations & Measurements
  system: {
    type: systemConfigSchema,
    default: () => ({}),
  },
  display: {
    type: displayConfigSchema,
    required: true,
  },
  graphics: {
    type: graphicsConfigSchema,
    required: true,
  },
  rayTracing: {
    type: rayTracingConfigSchema,
    default: () => ({ enabled: false }),
  },
  upscaling: {
    type: upscalingConfigSchema,
    default: () => ({ enabled: false }),
  },
  frameGeneration: {
    type: frameGenerationConfigSchema,
    default: () => ({ enabled: false }),
  },
  performance: {
    type: performanceMetricsSchema,
    required: true,
  },
  testConditions: {
    type: testConditionsSchema,
    default: () => ({}),
  },

  // Provenance & Licensing
  provenance: {
    type: provenanceSchema,
    required: true,
  },
  licenseStatus: {
    type: String,
    enum: ['approved', 'approved_with_conditions', 'internal_only', 'permission_required', 'unknown'],
    default: 'unknown',
    required: true,
  },

  // Quality & Eligibility (Computed by Validator)
  quality: {
    type: qualitySchema,
    default: () => ({ grade: 'medium', dataQualityScore: 50 }),
  },
  trainingEligible: {
    type: Boolean,
    required: true,
    default: false,
  },
  evaluationEligible: {
    type: Boolean,
    required: true,
    default: false,
  },
}, {
  timestamps: true,
  collection: 'game_benchmarks',
});

// Indexes for query performance and data export
gameBenchmarkSchema.index({ observationFingerprint: 1 });
gameBenchmarkSchema.index({ gameSlug: 1, gpuHardwareId: 1, 'display.label': 1 });
gameBenchmarkSchema.index({ gameSlug: 1, cpuHardwareId: 1 });
gameBenchmarkSchema.index({ cpuHardwareId: 1, gpuHardwareId: 1 });
gameBenchmarkSchema.index({ trainingEligible: 1, licenseStatus: 1 });
gameBenchmarkSchema.index({ 'provenance.sourceGroupId': 1 });

const GameBenchmark = mongoose.models.GameBenchmark || mongoose.model('GameBenchmark', gameBenchmarkSchema);

module.exports = GameBenchmark;
