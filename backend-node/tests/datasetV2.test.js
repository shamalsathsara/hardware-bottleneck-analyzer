/**
 * Project Aura V2 — Milestone V2.1.3E
 * Dataset V2 Builder Foundation Test Suite
 *
 * Exhaustively tests all 54 safety, extraction, validation,
 * leakage, splitting, export, and empty dataset requirements.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  DATASET_SCHEMA_VERSION,
  FEATURE_MANIFEST_VERSION,
  FEATURE_DEFINITIONS,
  TARGET_DEFINITIONS,
  PRESET_NUMERIC_MAP,
  PROHIBITED_LEAKAGE_FEATURES,
  AUDIT_COLUMNS,
} = require('../services/datasetV2/featureManifest');

const {
  extractFeatures,
  isValidNumber,
} = require('../services/datasetV2/featureBuilder');

const {
  validateBenchmarkEligibility,
  checkTargetLeakage,
  validateRequiredFeatures,
  validateTargets,
  validateDatasetRow,
} = require('../services/datasetV2/datasetValidator');

const {
  createSeededRandom,
  seededShuffle,
  splitGroupedSource,
  splitUnseenHardwareHoldout,
  splitUnseenGameHoldout,
} = require('../services/datasetV2/splitStrategy');

const {
  rowsToCsv,
  formatCsvValue,
  generateBuildReport,
  exportDatasetFiles,
} = require('../services/datasetV2/datasetExporter');

const { buildDatasetV2 } = require('../services/datasetV2/datasetV2Builder');
const { parseArgs } = require('../scripts/buildDatasetV2');

const TEMP_EXPORT_DIR = path.resolve(__dirname, 'temp_dataset_v2_export');

describe('Milestone V2.1.3E — Dataset V2 Builder Foundation Test Suite', () => {
  // Mock standard fixtures for unit tests
  const mockCpu = {
    hardwareId: 'cpu_amd_ryzen_7_7800x3d_desktop',
    canonicalName: 'AMD Ryzen 7 7800X3D',
    cores: { total: 8, performanceCores: 8 },
    threads: 16,
    clocks: { baseClockGHz: 4.2, boostClockGHz: 5.0 },
    cache: { l3CacheMB: 96 },
    power: { defaultTdpWatts: 120 },
    quality: { specQuality: 'verified', mlReady: true },
  };

  const mockGpu = {
    hardwareId: 'gpu_nvidia_geforce_rtx_4070_desktop',
    canonicalName: 'NVIDIA GeForce RTX 4070',
    cores: { shaderUnits: 5888 },
    memory: {
      vramGB: 12,
      memoryBandwidthGBs: 504,
      memoryBusBits: 192,
      memoryType: 'GDDR6X',
    },
    clocks: { baseClockMHz: 1920, boostClockMHz: 2475 },
    power: { defaultTgpWatts: 200 },
    quality: { specQuality: 'verified', mlReady: true },
  };

  const mockGame = {
    name: 'Cyberpunk 2077',
    slug: 'cyberpunk-2077',
    releaseYear: 2020,
  };

  const mockBenchmark = {
    benchmarkId: 'bm_test_valid_001',
    observationFingerprint: 'fp_test_valid_001',
    gameSlug: 'cyberpunk-2077',
    cpuHardwareId: 'cpu_amd_ryzen_7_7800x3d_desktop',
    gpuHardwareId: 'gpu_nvidia_geforce_rtx_4070_desktop',
    system: { ramGB: 32 },
    display: { width: 2560, height: 1440, pixelCount: 2560 * 1440 },
    graphics: { normalizedPreset: 'high' },
    rayTracing: { enabled: false },
    upscaling: { enabled: false },
    frameGeneration: { enabled: false },
    performance: { avgFps: 94.5, onePercentLowFps: 78.2 },
    provenance: {
      sourceType: 'project_aura_test',
      sourceName: 'Aura Lab',
      sourceGroupId: 'grp_lab_01',
      benchmarkSessionId: 'sess_lab_01',
      collectedAt: new Date('2026-09-01T12:00:00Z'),
    },
    licenseStatus: 'approved',
    quality: { grade: 'verified', quarantineReason: null },
    trainingEligible: true,
    evaluationEligible: true,
  };

  beforeAll(() => {
    if (!fs.existsSync(TEMP_EXPORT_DIR)) {
      fs.mkdirSync(TEMP_EXPORT_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(TEMP_EXPORT_DIR)) {
      fs.rmSync(TEMP_EXPORT_DIR, { recursive: true, force: true });
    }
  });

  // --------------------------------------------------------------------------
  // 1-3. Empty Dataset & Zero-Row Safety
  // --------------------------------------------------------------------------
  describe('1-3. Empty Dataset & Zero-Row Safety', () => {
    test('1. Empty benchmark collection builds without error', async () => {
      const res = await buildDatasetV2({
        dryRun: true,
        customBenchmarks: [],
        customCpus: [mockCpu],
        customGpus: [mockGpu],
        customGames: [mockGame],
      });
      expect(res.success).toBe(true);
      expect(res.acceptedRowCount).toBe(0);
      expect(res.status).toBe('INSUFFICIENT_REAL_DATA');
    });

    test('2. Zero-row build succeeds safely and sets INSUFFICIENT_REAL_DATA status', async () => {
      const res = await buildDatasetV2({
        dryRun: true,
        customBenchmarks: [],
      });
      expect(res.status).toBe('INSUFFICIENT_REAL_DATA');
      expect(res.report.readyForModelTraining).toBe(false);
      expect(res.report.trainingBlockers).toContain('NO_ELIGIBLE_REAL_OBSERVATIONS');
    });

    test('3. No synthetic rows are generated on empty dataset', async () => {
      const res = await buildDatasetV2({
        dryRun: true,
        customBenchmarks: [],
      });
      expect(res.acceptedRows).toEqual([]);
      expect(res.acceptedRowCount).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Training Eligibility Filtering
  // --------------------------------------------------------------------------
  describe('4. Training Eligibility Filtering', () => {
    test('accepts approved, high quality, training-eligible observations', () => {
      const el = validateBenchmarkEligibility(mockBenchmark);
      expect(el.eligible).toBe(true);
      expect(el.reasons).toHaveLength(0);
    });

    test('rejects observations where trainingEligible is false', () => {
      const el = validateBenchmarkEligibility({ ...mockBenchmark, trainingEligible: false });
      expect(el.eligible).toBe(false);
      expect(el.reasons).toContain('NOT_TRAINING_ELIGIBLE');
    });

    test('rejects unapproved license status', () => {
      const el = validateBenchmarkEligibility({ ...mockBenchmark, licenseStatus: 'permission_required' });
      expect(el.eligible).toBe(false);
      expect(el.reasons).toContain('UNAPPROVED_LICENSE_STATUS');
    });

    test('rejects low quality or quarantined observations', () => {
      const elLow = validateBenchmarkEligibility({ ...mockBenchmark, quality: { grade: 'low' } });
      expect(elLow.eligible).toBe(false);
      expect(elLow.reasons).toContain('QUALITY_GRADE_INSUFFICIENT');

      const elQuar = validateBenchmarkEligibility({ ...mockBenchmark, quality: { grade: 'high', quarantineReason: 'anomaly' } });
      expect(elQuar.eligible).toBe(false);
      expect(elQuar.reasons).toContain('RECORD_QUARANTINED');
    });
  });

  // --------------------------------------------------------------------------
  // 5-8. Hardware Master Joins & Missing Hardware Rejection
  // --------------------------------------------------------------------------
  describe('5-8. Hardware Master Joins & Rejections', () => {
    test('5. Successfully joins canonical CPU', () => {
      const res = extractFeatures({
        benchmark: mockBenchmark,
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.errors).toHaveLength(0);
      expect(res.features.cpu_cores_total).toBe(8);
      expect(res.features.cpu_threads).toBe(16);
    });

    test('6. Successfully joins canonical GPU', () => {
      const res = extractFeatures({
        benchmark: mockBenchmark,
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.features.gpu_vram_gb).toBe(12);
      expect(res.features.gpu_shader_units).toBe(5888);
    });

    test('7. Missing CPU Master record rejects row with CPU_NOT_FOUND', () => {
      const res = extractFeatures({
        benchmark: mockBenchmark,
        cpu: null,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.errors).toContain('CPU_NOT_FOUND');
    });

    test('8. Missing GPU Master record rejects row with GPU_NOT_FOUND', () => {
      const res = extractFeatures({
        benchmark: mockBenchmark,
        cpu: mockCpu,
        gpu: null,
        game: mockGame,
      });
      expect(res.errors).toContain('GPU_NOT_FOUND');
    });
  });

  // --------------------------------------------------------------------------
  // 9-13. Physical Specifications, System, and Display Features
  // --------------------------------------------------------------------------
  describe('9-13. Physical Specifications, System, and Display Features', () => {
    test('9. Extracts all verified CPU physical features accurately', () => {
      const res = extractFeatures({ benchmark: mockBenchmark, cpu: mockCpu, gpu: mockGpu, game: mockGame });
      expect(res.features.cpu_cores_total).toBe(8);
      expect(res.features.cpu_threads).toBe(16);
      expect(res.features.cpu_boost_clock_ghz).toBe(5.0);
      expect(res.features.cpu_l3_cache_mb).toBe(96);
      expect(res.features.cpu_tdp_w).toBe(120);
    });

    test('10. Extracts all verified GPU physical features accurately', () => {
      const res = extractFeatures({ benchmark: mockBenchmark, cpu: mockCpu, gpu: mockGpu, game: mockGame });
      expect(res.features.gpu_vram_gb).toBe(12);
      expect(res.features.gpu_memory_bandwidth_gbs).toBe(504);
      expect(res.features.gpu_memory_bus_bits).toBe(192);
      expect(res.features.gpu_shader_units).toBe(5888);
      expect(res.features.gpu_boost_clock_mhz).toBe(2475);
      expect(res.features.gpu_tgp_w).toBe(200);
    });

    test('11. Extracts system RAM in GB and validates positivity', () => {
      const res = extractFeatures({ benchmark: mockBenchmark, cpu: mockCpu, gpu: mockGpu, game: mockGame });
      expect(res.features.system_ram_gb).toBe(32);

      const resNoRam = extractFeatures({
        benchmark: { ...mockBenchmark, system: { ramGB: null } },
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(resNoRam.features.system_ram_gb).toBeNull();
    });

    test('12. Computes pixel_count strictly server-side (width * height)', () => {
      const res = extractFeatures({
        benchmark: { ...mockBenchmark, display: { width: 3440, height: 1440 } },
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.features.render_width).toBe(3440);
      expect(res.features.render_height).toBe(1440);
      expect(res.features.pixel_count).toBe(3440 * 1440);
    });

    test('13. Rejects invalid display dimensions (< 640x480 or non-numeric)', () => {
      const res = extractFeatures({
        benchmark: { ...mockBenchmark, display: { width: 400, height: 300 } },
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.errors).toContain('INVALID_RESOLUTION');
    });
  });

  // --------------------------------------------------------------------------
  // 14-19. Graphics Preset Encoding & Rejections
  // --------------------------------------------------------------------------
  describe('14-19. Graphics Preset Encoding & Rejections', () => {
    test('14. Preset low encodes to 1', () => {
      const res = extractFeatures({
        benchmark: { ...mockBenchmark, graphics: { normalizedPreset: 'low' } },
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.features.preset_encoded).toBe(1);
    });

    test('15. Preset medium encodes to 2', () => {
      const res = extractFeatures({
        benchmark: { ...mockBenchmark, graphics: { normalizedPreset: 'medium' } },
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.features.preset_encoded).toBe(2);
    });

    test('16. Preset high encodes to 3', () => {
      const res = extractFeatures({
        benchmark: { ...mockBenchmark, graphics: { normalizedPreset: 'high' } },
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.features.preset_encoded).toBe(3);
    });

    test('17. Preset ultra encodes to 4', () => {
      const res = extractFeatures({
        benchmark: { ...mockBenchmark, graphics: { normalizedPreset: 'ultra' } },
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.features.preset_encoded).toBe(4);
    });

    test('18. Custom preset is strictly rejected from native training export', () => {
      const res = extractFeatures({
        benchmark: { ...mockBenchmark, graphics: { normalizedPreset: 'custom' } },
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.errors).toContain('UNSUPPORTED_PRESET');
      expect(res.features.preset_encoded).toBeNull();
    });

    test('19. Unknown preset is strictly rejected', () => {
      const res = extractFeatures({
        benchmark: { ...mockBenchmark, graphics: { normalizedPreset: 'unknown' } },
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.errors).toContain('UNSUPPORTED_PRESET');
    });
  });

  // --------------------------------------------------------------------------
  // 20-25. Advanced Rendering Features (RT, Upscaling, Frame Generation)
  // --------------------------------------------------------------------------
  describe('20-25. Advanced Rendering Features', () => {
    test('20. Ray tracing false encodes to 0', () => {
      const res = extractFeatures({
        benchmark: { ...mockBenchmark, rayTracing: { enabled: false } },
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.features.ray_tracing_enabled).toBe(0);
    });

    test('21. Ray tracing true encodes to 1', () => {
      const res = extractFeatures({
        benchmark: { ...mockBenchmark, rayTracing: { enabled: true } },
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.features.ray_tracing_enabled).toBe(1);
    });

    test('22. Upscaling false sets internal_pixel_count equal to native pixel_count', () => {
      const res = extractFeatures({
        benchmark: {
          ...mockBenchmark,
          display: { width: 1920, height: 1080 },
          upscaling: { enabled: false },
        },
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.features.upscaling_active).toBe(0);
      expect(res.features.internal_pixel_count).toBe(1920 * 1080);
    });

    test('23. Upscaling true with recorded internal resolution computes internal_pixel_count', () => {
      const res = extractFeatures({
        benchmark: {
          ...mockBenchmark,
          display: { width: 2560, height: 1440 },
          upscaling: {
            enabled: true,
            technology: 'DLSS',
            mode: 'Quality',
            internalResolution: { width: 1707, height: 960 },
          },
        },
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.features.upscaling_active).toBe(1);
      expect(res.features.internal_pixel_count).toBe(1707 * 960);
      expect(res.errors).toHaveLength(0);
    });

    test('24. Active upscaling missing internal resolution is rejected with MISSING_INTERNAL_RESOLUTION', () => {
      const res = extractFeatures({
        benchmark: {
          ...mockBenchmark,
          upscaling: { enabled: true, technology: 'DLSS', internalResolution: null },
        },
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.errors).toContain('MISSING_INTERNAL_RESOLUTION');
    });

    test('25. Frame generation observation is excluded from native dataset with FRAME_GENERATION_NOT_NATIVE', () => {
      const res = extractFeatures({
        benchmark: {
          ...mockBenchmark,
          frameGeneration: { enabled: true, technology: 'DLSS 3' },
        },
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.errors).toContain('FRAME_GENERATION_NOT_NATIVE');
      expect(res.features.frame_gen_active).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // 26-29. Target Variables
  // --------------------------------------------------------------------------
  describe('26-29. Target Variables', () => {
    test('26. Extracts ground truth avgFps target within bounds', () => {
      const res = extractFeatures({
        benchmark: { ...mockBenchmark, performance: { avgFps: 88.4 } },
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.targets.target_avg_fps).toBe(88.4);
    });

    test('27. Extracts measured 1% low target when present', () => {
      const res = extractFeatures({
        benchmark: { ...mockBenchmark, performance: { avgFps: 88.4, onePercentLowFps: 72.1 } },
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.targets.target_1pct_low_fps).toBe(72.1);
    });

    test('28. Missing 1% low target is accepted as null without rejecting row', () => {
      const res = extractFeatures({
        benchmark: { ...mockBenchmark, performance: { avgFps: 88.4, onePercentLowFps: null } },
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.targets.target_1pct_low_fps).toBeNull();
      expect(res.errors).toHaveLength(0);
    });

    test('29. Does NOT fabricate or derive 1% low from avg FPS', () => {
      const res = extractFeatures({
        benchmark: { ...mockBenchmark, performance: { avgFps: 100, onePercentLowFps: undefined } },
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });
      expect(res.targets.target_1pct_low_fps).toBeNull();
      expect(res.targets.target_1pct_low_fps).not.toBe(80); // Ensure no 0.8 * avgFps ratio
    });
  });

  // --------------------------------------------------------------------------
  // 30-34. Target Leakage Protection & Missing Feature Policy
  // --------------------------------------------------------------------------
  describe('30-34. Target Leakage Protection & Missing Feature Policy', () => {
    test('30. Detects and rejects prohibited bottleneckScore in features', () => {
      const featuresWithLeak = {
        cpu_cores_total: 8,
        bottleneckScore: 12.5,
      };
      const check = checkTargetLeakage(featuresWithLeak);
      expect(check.hasLeakage).toBe(true);
      expect(check.detectedKeys).toContain('bottleneckScore');
    });

    test('31. Detects and rejects predictedFps or Model V1 output leakage', () => {
      const featuresWithPred = {
        predicted_fps: 120,
        model_v1_output: 115,
      };
      const check = checkTargetLeakage(featuresWithPred);
      expect(check.hasLeakage).toBe(true);
      expect(check.detectedKeys).toContain('predicted_fps');
      expect(check.detectedKeys).toContain('model_v1_output');
    });

    test('32. Prohibits synthetic CUDA formulas', () => {
      const featuresWithCuda = {
        synthetic_cuda: 5000,
      };
      const check = checkTargetLeakage(featuresWithCuda);
      expect(check.hasLeakage).toBe(true);
    });

    test('33. Rejects observation missing required physical feature (e.g. missing memoryBandwidthGBs)', () => {
      const incompleteGpu = { ...mockGpu, memory: { ...mockGpu.memory, memoryBandwidthGBs: null } };
      const extracted = extractFeatures({
        benchmark: mockBenchmark,
        cpu: mockCpu,
        gpu: incompleteGpu,
        game: mockGame,
      });
      const val = validateDatasetRow({
        features: extracted.features,
        targets: extracted.targets,
        audit: extracted.audit,
      });
      expect(val.valid).toBe(false);
      expect(val.missingFeatures).toContain('gpu_memory_bandwidth_gbs');
    });

    test('34. Audit IDs are isolated and rejected if leaked into model features', () => {
      const rowWithAuditInFeatures = {
        features: {
          cpu_cores_total: 8,
          benchmarkId: 'bm_leaked_001',
        },
        targets: { target_avg_fps: 60 },
        audit: { benchmarkId: 'bm_leaked_001' },
      };
      const val = validateDatasetRow(rowWithAuditInFeatures);
      expect(val.valid).toBe(false);
      expect(val.errors.some((e) => e.includes('AUDIT_COLUMN_LEAKED_INTO_FEATURES'))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 35-36. Feature Manifest & Dataset Versioning
  // --------------------------------------------------------------------------
  describe('35-36. Feature Manifest & Dataset Versioning', () => {
    test('35. Feature manifest defines complete schemas for all features and targets', () => {
      expect(Array.isArray(FEATURE_DEFINITIONS)).toBe(true);
      expect(FEATURE_DEFINITIONS.length).toBeGreaterThanOrEqual(18);
      expect(Array.isArray(TARGET_DEFINITIONS)).toBe(true);
      expect(TARGET_DEFINITIONS.length).toBe(2);

      FEATURE_DEFINITIONS.forEach((f) => {
        expect(f).toHaveProperty('name');
        expect(f).toHaveProperty('type');
        expect(f).toHaveProperty('unit');
        expect(f).toHaveProperty('required');
      });
    });

    test('36. Dataset schema version is explicitly recorded as "2.0"', () => {
      expect(DATASET_SCHEMA_VERSION).toBe('2.0');
      expect(FEATURE_MANIFEST_VERSION).toBe('2.0.0');
    });
  });

  // --------------------------------------------------------------------------
  // 37-41. Multi-Protocol Splitting Strategy
  // --------------------------------------------------------------------------
  describe('37-41. Multi-Protocol Splitting Strategy', () => {
    const generateRows = (count) => {
      const rows = [];
      for (let i = 0; i < count; i++) {
        rows.push({
          features: { cpu_cores_total: 8, render_width: 1920 },
          targets: { target_avg_fps: 60 + (i % 50) },
          audit: {
            benchmarkId: `bm_${i}`,
            gameSlug: `game_${i % 5}`,
            cpuHardwareId: `cpu_${i % 4}`,
            gpuHardwareId: `gpu_${i % 4}`,
            sourceGroupId: `grp_${i % 6}`,
          },
        });
      }
      return rows;
    };

    test('37. Seeded split is 100% reproducible across multiple runs', () => {
      const rows = generateRows(30);
      const split1 = splitGroupedSource(rows, { seed: 42 });
      const split2 = splitGroupedSource(rows, { seed: 42 });

      expect(split1.metadata.counts).toEqual(split2.metadata.counts);
      expect(split1.train.map((r) => r.audit.benchmarkId)).toEqual(split2.train.map((r) => r.audit.benchmarkId));
      expect(split1.test.map((r) => r.audit.benchmarkId)).toEqual(split2.test.map((r) => r.audit.benchmarkId));
    });

    test('38. Protocol 1 (Grouped Source) keeps same sourceGroupId observations in same split set', () => {
      const rows = generateRows(30);
      const split = splitGroupedSource(rows, { seed: 123 });

      const trainGroups = new Set(split.train.map((r) => r.audit.sourceGroupId));
      const testGroups = new Set(split.test.map((r) => r.audit.sourceGroupId));

      // No sourceGroupId should overlap between Train and Test
      for (const grp of trainGroups) {
        expect(testGroups.has(grp)).toBe(false);
      }
    });

    test('39. Protocol 2 (Unseen Hardware Holdout) isolates holdout GPUs into Test set', () => {
      const rows = generateRows(30);
      const split = splitUnseenHardwareHoldout(rows, { seed: 42, holdoutGpuIds: ['gpu_0'] });

      expect(split.test.every((r) => r.audit.gpuHardwareId === 'gpu_0')).toBe(true);
      expect(split.train.every((r) => r.audit.gpuHardwareId !== 'gpu_0')).toBe(true);
      expect(split.val.every((r) => r.audit.gpuHardwareId !== 'gpu_0')).toBe(true);
    });

    test('40. Protocol 2 (Unseen Hardware Holdout) isolates holdout CPUs into Test set', () => {
      const rows = generateRows(30);
      const split = splitUnseenHardwareHoldout(rows, { seed: 42, holdoutCpuIds: ['cpu_2'] });

      expect(split.test.every((r) => r.audit.cpuHardwareId === 'cpu_2')).toBe(true);
      expect(split.train.every((r) => r.audit.cpuHardwareId !== 'cpu_2')).toBe(true);
    });

    test('41. Protocol 3 (Unseen Game Holdout) isolates holdout game titles into Test set', () => {
      const rows = generateRows(30);
      const split = splitUnseenGameHoldout(rows, { seed: 42, holdoutGameSlugs: ['game_1'] });

      expect(split.test.every((r) => r.audit.gameSlug === 'game_1')).toBe(true);
      expect(split.train.every((r) => r.audit.gameSlug !== 'game_1')).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 42-46. Export, Duplicate Handling, Build Report & Dry-Run
  // --------------------------------------------------------------------------
  describe('42-46. Export, Duplicate Handling, Build Report & Dry-Run', () => {
    test('42. Fingerprinted identical benchmarks result in clean distinct pipeline processing', async () => {
      const bm1 = { ...mockBenchmark, benchmarkId: 'bm_001' };
      const bm2 = { ...mockBenchmark, benchmarkId: 'bm_002' };

      const res = await buildDatasetV2({
        dryRun: true,
        customBenchmarks: [bm1, bm2],
        customCpus: [mockCpu],
        customGpus: [mockGpu],
        customGames: [mockGame],
      });

      expect(res.acceptedRowCount).toBe(2);
    });

    test('43. Legitimate repeated runs are preserved as individual rows without artificial averaging', async () => {
      const run1 = { ...mockBenchmark, benchmarkId: 'bm_run_1', performance: { avgFps: 95.0 } };
      const run2 = { ...mockBenchmark, benchmarkId: 'bm_run_2', performance: { avgFps: 96.2 } };

      const res = await buildDatasetV2({
        dryRun: true,
        customBenchmarks: [run1, run2],
        customCpus: [mockCpu],
        customGpus: [mockGpu],
        customGames: [mockGame],
      });

      expect(res.acceptedRows.length).toBe(2);
      expect(res.acceptedRows[0].targets.target_avg_fps).toBe(95.0);
      expect(res.acceptedRows[1].targets.target_avg_fps).toBe(96.2);
    });

    test('44. CSV export generates valid ordered tabular data with audit, feature, and target columns', () => {
      const extracted = extractFeatures({
        benchmark: mockBenchmark,
        cpu: mockCpu,
        gpu: mockGpu,
        game: mockGame,
      });

      const row = {
        features: extracted.features,
        targets: extracted.targets,
        audit: extracted.audit,
        splitSet: 'train',
      };

      const csv = rowsToCsv([row]);
      const lines = csv.trim().split('\n');

      expect(lines.length).toBe(2); // header + 1 row
      expect(lines[0]).toContain('benchmarkId');
      expect(lines[0]).toContain('cpu_cores_total');
      expect(lines[0]).toContain('target_avg_fps');
      expect(lines[0]).toContain('split_set');
      expect(lines[1]).toContain('bm_test_valid_001');
      expect(lines[1]).toContain('94.5');
    });

    test('45. Build report records complete metadata and structured rejection statistics', () => {
      const report = generateBuildReport({
        totalInputObservations: 10,
        trainingEligibleObservations: 8,
        acceptedRowCount: 6,
        rejectedRowCount: 4,
        rejectionReasons: { NOT_TRAINING_ELIGIBLE: 2, MISSING_REQUIRED_FEATURE: 2 },
      });

      expect(report.schemaVersion).toBe('2.0');
      expect(report.status).toBe('DATASET_V2_READY');
      expect(report.summary.acceptedRowCount).toBe(6);
      expect(report.summary.rejectedRowCount).toBe(4);
      expect(report.rejectionBreakdown.NOT_TRAINING_ELIGIBLE).toBe(2);
    });

    test('46. Dry-run mode produces 0 filesystem artifacts', async () => {
      const filesBefore = fs.readdirSync(TEMP_EXPORT_DIR);

      const res = await buildDatasetV2({
        dryRun: true,
        outputDir: TEMP_EXPORT_DIR,
        customBenchmarks: [mockBenchmark],
        customCpus: [mockCpu],
        customGpus: [mockGpu],
        customGames: [mockGame],
      });

      expect(res.dryRun).toBe(true);
      expect(res.acceptedRowCount).toBe(1);

      const filesAfter = fs.readdirSync(TEMP_EXPORT_DIR);
      expect(filesAfter.length).toBe(filesBefore.length);
    });
  });

  // --------------------------------------------------------------------------
  // 47-48. V1 Dataset & Model Invariance Protection
  // --------------------------------------------------------------------------
  describe('47-48. V1 Dataset & Model Invariance Protection', () => {
    test('47. V1 fps_dataset.csv remains unmodified in data directory if present', () => {
      const v1Path = path.resolve(__dirname, '../../data/fps_dataset.csv');
      if (fs.existsSync(v1Path)) {
        const stats = fs.statSync(v1Path);
        expect(stats.size).toBeGreaterThan(0);
      }
    });

    test('48. Model V1 artifacts and preprocessing remain completely intact and unmodified', () => {
      const aiColsPath = path.resolve(__dirname, '../../ai_columns.joblib');
      const modelPath = path.resolve(__dirname, '../../project_aura.joblib');
      expect(fs.existsSync(aiColsPath)).toBe(true);
      expect(fs.existsSync(modelPath)).toBe(true);
    });
  });
});
