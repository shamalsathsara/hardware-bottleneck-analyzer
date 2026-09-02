const mongoose = require('mongoose');

const hardwareCpuSchema = new mongoose.Schema(
  {
    hardwareId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^cpu_[a-z0-9_]+$/,
    },
    type: {
      type: String,
      required: true,
      enum: ['cpu'],
      default: 'cpu',
    },
    manufacturer: {
      type: String,
      required: true,
      enum: ['Intel', 'AMD', 'Apple', 'Qualcomm', 'Other'],
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
      enum: ['desktop', 'mobile', 'workstation', 'server'],
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

    // Physical Specifications
    cores: {
      total: {
        type: Number,
        required: true,
        min: 1,
        max: 256,
      },
      performanceCores: {
        type: Number,
        default: null,
        min: 0,
        max: 256,
      },
      efficiencyCores: {
        type: Number,
        default: null,
        min: 0,
        max: 256,
      },
    },
    threads: {
      type: Number,
      required: true,
      min: 1,
      max: 512,
    },
    clocks: {
      baseClockGHz: {
        type: Number,
        required: true,
        min: 0.5,
        max: 10.0,
      },
      boostClockGHz: {
        type: Number,
        required: true,
        min: 0.5,
        max: 10.0,
      },
    },
    cache: {
      l2CacheMB: {
        type: Number,
        default: null,
        min: 0,
      },
      l3CacheMB: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    power: {
      defaultTdpWatts: {
        type: Number,
        required: true,
        min: 5,
        max: 1000,
      },
      maxTurboPowerWatts: {
        type: Number,
        default: null,
        min: 5,
        max: 1000,
      },
    },
    socket: {
      type: String,
      default: null,
      trim: true,
    },

    // Feature Flags
    features: {
      integratedGpu: {
        type: Boolean,
        default: false,
      },
      pcieVersion: {
        type: String,
        default: null,
      },
      memorySupport: {
        type: String,
        default: null,
      },
    },

    // Standardized Performance Signals (Optional / Nullable)
    performance: {
      singleCoreScore: {
        type: Number,
        default: null,
      },
      multiCoreScore: {
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
    collection: 'hardware_cpus',
  }
);

// Indexes
hardwareCpuSchema.index({ canonicalName: 1 });
hardwareCpuSchema.index({ manufacturer: 1, marketSegment: 1 });
hardwareCpuSchema.index({ 'quality.specQuality': 1, 'quality.mlReady': 1 });

const HardwareCpu = mongoose.models.HardwareCpu || mongoose.model('HardwareCpu', hardwareCpuSchema);

module.exports = HardwareCpu;
