const mongoose = require('mongoose');

const hardwareGpuSchema = new mongoose.Schema(
  {
    hardwareId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^gpu_[a-z0-9_]+$/,
    },
    type: {
      type: String,
      required: true,
      enum: ['gpu'],
      default: 'gpu',
    },
    manufacturer: {
      type: String,
      required: true,
      enum: ['NVIDIA', 'AMD', 'Intel', 'Other'],
    },
    canonicalName: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    aliases: {
      type: [String],
      default: [],
      index: true,
    },
    marketSegment: {
      type: String,
      required: true,
      enum: ['desktop', 'laptop', 'workstation'],
      default: 'desktop',
    },

    // Classification
    family: {
      type: String,
      required: true,
      trim: true,
    },
    generation: {
      type: String,
      required: true,
      trim: true,
    },
    architecture: {
      type: String,
      default: null,
      trim: true,
    },
    releaseYear: {
      type: Number,
      required: true,
      min: 2000,
      max: 2035,
    },
    releaseDate: {
      type: Date,
      default: null,
    },

    // Memory Subsystem
    memory: {
      vramGB: {
        type: Number,
        required: true,
        min: 1,
        max: 128,
      },
      memoryType: {
        type: String,
        required: true,
        trim: true,
      },
      memoryBusBits: {
        type: Number,
        required: true,
        min: 32,
        max: 8192,
      },
      memoryBandwidthGBs: {
        type: Number,
        required: true,
        min: 10,
        max: 5000,
      },
    },

    // Execution Cores & Clocks
    cores: {
      shaderUnits: {
        type: Number,
        required: true,
        min: 64,
        max: 65536,
      },
      tensorCores: {
        type: Number,
        default: null,
        min: 0,
      },
      rayTracingCores: {
        type: Number,
        default: null,
        min: 0,
      },
    },
    clocks: {
      baseClockMHz: {
        type: Number,
        default: null,
        min: 100,
        max: 5000,
      },
      boostClockMHz: {
        type: Number,
        required: true,
        min: 100,
        max: 5000,
      },
    },
    power: {
      defaultTgpWatts: {
        type: Number,
        required: true,
        min: 10,
        max: 1500,
      },
      recommendedPsuWatts: {
        type: Number,
        default: null,
        min: 100,
        max: 2000,
      },
    },

    // Feature Flags
    features: {
      rayTracingSupport: {
        type: Boolean,
        required: true,
        default: false,
      },
      hardwareUpscalingFamily: {
        type: String,
        enum: ['DLSS', 'FSR', 'XeSS', 'None'],
        default: 'None',
      },
      dlssGenerationSupport: {
        type: Number,
        default: null,
      },
      directXVersion: {
        type: String,
        default: '12',
      },
    },

    // Standardized Performance Signals (Optional / Nullable)
    performance: {
      rasterPerformanceScore: {
        type: Number,
        default: null,
      },
      rayTracingScore: {
        type: Number,
        default: null,
      },
      computeScore: {
        type: Number,
        default: null,
      },
    },

    // Dual Quality Architecture
    quality: {
      specQuality: {
        type: String,
        required: true,
        enum: ['verified', 'partial', 'unverified', 'stale'],
        default: 'unverified',
      },
      performanceQuality: {
        type: String,
        required: true,
        enum: ['verified', 'partial', 'unavailable', 'stale'],
        default: 'unavailable',
      },
      mlReady: {
        type: Boolean,
        default: false,
      },
    },

    // Provenance Tracking
    provenance: {
      specifications: {
        sourceName: { type: String, required: true },
        sourceType: { type: String, enum: ['manufacturer', 'aggregator', 'manual_curation'], default: 'manufacturer' },
        sourceUrl: { type: String, default: null },
        verifiedAt: { type: Date, default: Date.now },
        verificationMethod: { type: String, enum: ['manual', 'api', 'automated_verified'], default: 'manual' },
      },
      performance: {
        sourceName: { type: String, default: null },
        sourceType: { type: String, default: null },
        sourceReference: { type: String, default: null },
        verifiedAt: { type: Date, default: null },
        licenseStatus: { type: String, default: null },
      },
    },
  },
  {
    timestamps: true,
    collection: 'hardware_gpus',
  }
);

// Indexes
hardwareGpuSchema.index({ canonicalName: 1 });
hardwareGpuSchema.index({ manufacturer: 1, marketSegment: 1 });
hardwareGpuSchema.index({ 'quality.specQuality': 1, 'quality.mlReady': 1 });

const HardwareGpu = mongoose.models.HardwareGpu || mongoose.model('HardwareGpu', hardwareGpuSchema);

module.exports = HardwareGpu;
