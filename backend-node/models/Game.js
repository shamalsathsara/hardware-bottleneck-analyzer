const mongoose = require('mongoose');

const hardwareReqSchema = new mongoose.Schema({
  cpu: {
    name: { type: String, trim: true, default: null },
    notes: { type: String, trim: true, default: null },
  },
  gpu: {
    name: { type: String, trim: true, default: null },
    vramGB: { type: Number, min: 0, max: 128, default: null },
  },
  ramGB: { type: Number, min: 0, max: 512, default: null },
  storageGB: { type: Number, min: 0, max: 2000, default: null },
  storageType: { type: String, enum: ['HDD', 'SSD', 'NVMe', 'Any', null], default: null },
  os: { type: String, trim: true, default: null },
  directX: { type: String, trim: true, default: null },
}, { _id: false });

const gameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Game name is required'],
    trim: true,
    maxlength: 150,
  },
  slug: {
    type: String,
    required: [true, 'Game slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'],
  },
  alternateNames: {
    type: [String],
    default: [],
  },
  developer: {
    type: String,
    trim: true,
    default: null,
  },
  publisher: {
    type: String,
    trim: true,
    default: null,
  },
  releaseDate: {
    type: String,
    default: null,
  },
  releaseYear: {
    type: Number,
    min: 1980,
    max: 2050,
    default: null,
  },
  genres: {
    type: [String],
    default: [],
  },
  platforms: {
    type: [String],
    default: ['PC'],
  },
  thumbnailUrl: {
    type: String,
    trim: true,
    default: null,
  },
  requirements: {
    minimum: {
      type: hardwareReqSchema,
      default: () => ({}),
    },
    recommended: {
      type: hardwareReqSchema,
      default: () => ({}),
    },
  },
  performanceProfile: {
    supportedResolutions: {
      type: [String],
      default: ['1080p', '1440p', '4K'],
    },
    graphicsPresets: {
      type: [String],
      default: ['Low', 'Medium', 'High', 'Ultra'],
    },
    cpuIntensity: { type: String, enum: ['Low', 'Medium', 'High', null], default: null },
    gpuIntensity: { type: String, enum: ['Low', 'Medium', 'High', null], default: null },
    vramIntensity: { type: String, enum: ['Low', 'Medium', 'High', null], default: null },
    ramIntensity: { type: String, enum: ['Low', 'Medium', 'High', null], default: null },
    rayTracingSupported: { type: Boolean, default: false },
    dlssSupported: { type: Boolean, default: false },
    fsrSupported: { type: Boolean, default: false },
    xessSupported: { type: Boolean, default: false },
  },
  dataQuality: {
    type: String,
    enum: ['metadata_only', 'requirements_available', 'verified'],
    default: 'metadata_only',
  },
  dataSource: {
    requirementsSource: { type: String, default: null },
    requirementsVerified: { type: Boolean, default: false },
    lastVerifiedAt: { type: Date, default: null },
  },
  externalIds: {
    igdb: {
      type: Number,
      default: null,
    },
    steam: {
      type: Number,
      default: null,
    },
  },
  metadataSource: {
    type: String,
    trim: true,
    default: 'manual',
  },
  metadataLastSyncedAt: {
    type: Date,
    default: null,
  },
  seo: {
    title: { type: String, default: null },
    description: { type: String, default: null },
  },
}, {
  timestamps: true,
});

// Indexes for fast lookup and search
gameSchema.index({ name: 1 });
gameSchema.index({ alternateNames: 1 });
gameSchema.index({ genres: 1 });
gameSchema.index({ 'externalIds.igdb': 1 }, { unique: true, sparse: true });

const Game = mongoose.models.Game || mongoose.model('Game', gameSchema);

module.exports = Game;
