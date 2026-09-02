const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../server');
const Game = require('../models/Game');
const HardwareCpu = require('../models/HardwareCpu');
const HardwareGpu = require('../models/HardwareGpu');
const GameBenchmark = require('../models/GameBenchmark');
const { validateBenchmarkObservation, normalizeDisplay } = require('../services/benchmarks/benchmarkValidator');
const { generateObservationFingerprint, generateBenchmarkId } = require('../services/benchmarks/benchmarkFingerprint');
const { ingestBenchmarkObservation } = require('../services/benchmarks/benchmarkIngestion');

describe('Project Aura V2.1.3C Game Benchmark Schema & Validation Foundation Test Suite', () => {
  let testGame;
  let testCpu;
  let testGpu;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    // Clean up test documents
    await Game.deleteMany({ slug: 'benchmark-test-game' });
    await HardwareCpu.deleteMany({ hardwareId: 'cpu_benchmark_test_7800x3d_desktop' });
    await HardwareGpu.deleteMany({ hardwareId: 'gpu_benchmark_test_rtx_4070_desktop' });
    await GameBenchmark.deleteMany({ gameSlug: 'benchmark-test-game' });

    // Seed test Game
    testGame = await Game.create({
      name: 'Benchmark Test Game 2026',
      slug: 'benchmark-test-game',
      releaseYear: 2026,
      platforms: ['PC'],
      dataQuality: 'verified',
    });

    // Seed test CPU Master
    testCpu = await HardwareCpu.create({
      hardwareId: 'cpu_benchmark_test_7800x3d_desktop',
      canonicalName: 'AMD Ryzen 7 7800X3D (Test)',
      slug: 'amd-ryzen-7-7800x3d-benchmark-test',
      manufacturer: 'AMD',
      family: 'Ryzen 7',
      generation: 'Ryzen 7000',
      marketSegment: 'desktop',
      architecture: 'Zen 4',
      releaseYear: 2023,
      cores: { total: 8, performanceCores: 8 },
      threads: 16,
      clocks: { baseClockGHz: 4.2, boostClockGHz: 5.0 },
      cache: { l3CacheMB: 96 },
      power: { defaultTdpWatts: 120 },
      quality: { specQuality: 'verified', mlReady: true },
      provenance: {
        specifications: { sourceName: 'AMD Product Specifications' },
      },
    });

    // Seed test GPU Master
    testGpu = await HardwareGpu.create({
      hardwareId: 'gpu_benchmark_test_rtx_4070_desktop',
      canonicalName: 'NVIDIA GeForce RTX 4070 (Test)',
      slug: 'nvidia-geforce-rtx-4070-benchmark-test',
      manufacturer: 'NVIDIA',
      family: 'GeForce RTX',
      generation: 'RTX 40 Series',
      marketSegment: 'desktop',
      architecture: 'Ada Lovelace',
      releaseYear: 2023,
      cores: {
        shaderUnits: 5888,
      },
      memory: {
        vramGB: 12,
        memoryType: 'GDDR6X',
        memoryBusBits: 192,
        memoryBandwidthGBs: 504,
      },
      clocks: { baseClockMHz: 1920, boostClockMHz: 2475 },
      power: { defaultTgpWatts: 200 },
      quality: { specQuality: 'verified', mlReady: true },
      provenance: {
        specifications: { sourceName: 'NVIDIA Product Specifications' },
      },
    });
  });

  afterAll(async () => {
    await Game.deleteMany({ slug: 'benchmark-test-game' });
    await HardwareCpu.deleteMany({ hardwareId: 'cpu_benchmark_test_7800x3d_desktop' });
    await HardwareGpu.deleteMany({ hardwareId: 'gpu_benchmark_test_rtx_4070_desktop' });
    await GameBenchmark.deleteMany({ gameSlug: 'benchmark-test-game' });
  });

  // --------------------------------------------------------------------------
  // 1. Valid Benchmark Schema & Identity
  // --------------------------------------------------------------------------
  describe('1. Valid Benchmark Schema & Identity', () => {
    it('should validate and create a valid benchmark observation', async () => {
      const result = await ingestBenchmarkObservation({
        gameSlug: 'benchmark-test-game',
        cpuHardwareId: 'cpu_benchmark_test_7800x3d_desktop',
        gpuHardwareId: 'gpu_benchmark_test_rtx_4070_desktop',
        display: { width: 2560, height: 1440 },
        graphics: { rawPreset: 'Ultra', normalizedPreset: 'ultra' },
        rayTracing: { enabled: false },
        upscaling: { enabled: false },
        frameGeneration: { enabled: false },
        performance: { avgFps: 94.5, onePercentLowFps: 78.2 },
        provenance: { sourceType: 'project_aura_test', sourceName: 'Aura Lab QA' },
      });

      expect(result.isDuplicate).toBe(false);
      expect(result.benchmark).toBeDefined();
      expect(result.benchmark.benchmarkId).toMatch(/^bm_/);
      expect(result.benchmark.display.pixelCount).toBe(2560 * 1440);
      expect(result.benchmark.display.label).toBe('1440p');
      expect(result.benchmark.trainingEligible).toBe(true);
    });

    it('should enforce unique benchmarkId', async () => {
      const bId = generateBenchmarkId();
      const fp = 'fp_unique_test_' + Date.now();

      await GameBenchmark.create({
        benchmarkId: bId,
        observationFingerprint: fp,
        gameId: testGame._id,
        gameSlug: testGame.slug,
        rawGameName: testGame.name,
        cpuHardwareId: testCpu.hardwareId,
        rawCpuString: testCpu.canonicalName,
        gpuHardwareId: testGpu.hardwareId,
        rawGpuString: testGpu.canonicalName,
        display: { width: 1920, height: 1080, pixelCount: 1920 * 1080, label: '1080p' },
        graphics: { normalizedPreset: 'high' },
        performance: { avgFps: 85 },
        provenance: { sourceType: 'project_aura_test', sourceName: 'Lab' },
        licenseStatus: 'approved',
        trainingEligible: true,
      });

      // Try creating second document with identical benchmarkId
      await expect(
        GameBenchmark.create({
          benchmarkId: bId,
          observationFingerprint: fp + '_2',
          gameId: testGame._id,
          gameSlug: testGame.slug,
          rawGameName: testGame.name,
          cpuHardwareId: testCpu.hardwareId,
          rawCpuString: testCpu.canonicalName,
          gpuHardwareId: testGpu.hardwareId,
          rawGpuString: testGpu.canonicalName,
          display: { width: 1920, height: 1080, pixelCount: 1920 * 1080, label: '1080p' },
          graphics: { normalizedPreset: 'high' },
          performance: { avgFps: 85 },
          provenance: { sourceType: 'project_aura_test', sourceName: 'Lab' },
          licenseStatus: 'approved',
          trainingEligible: true,
        })
      ).rejects.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // 2. Canonical Identity & Hardware Resolution
  // --------------------------------------------------------------------------
  describe('2. Canonical Identity & Hardware Resolution', () => {
    it('should reject unresolvable / ambiguous game titles', async () => {
      await expect(
        validateBenchmarkObservation({
          gameSlug: 'non-existent-game-slug-404',
          cpuHardwareId: testCpu.hardwareId,
          gpuHardwareId: testGpu.hardwareId,
          display: { width: 1920, height: 1080 },
          performance: { avgFps: 60 },
        })
      ).rejects.toThrow(/Canonical Game could not be resolved/);
    });

    it('should reject unresolvable CPU hardwareId', async () => {
      await expect(
        validateBenchmarkObservation({
          gameSlug: 'benchmark-test-game',
          cpuHardwareId: 'cpu_unknown_nonexistent_9999',
          gpuHardwareId: testGpu.hardwareId,
          display: { width: 1920, height: 1080 },
          performance: { avgFps: 60 },
        })
      ).rejects.toThrow(/Canonical HardwareCpu could not be found/);
    });

    it('should reject unresolvable GPU hardwareId', async () => {
      await expect(
        validateBenchmarkObservation({
          gameSlug: 'benchmark-test-game',
          cpuHardwareId: testCpu.hardwareId,
          gpuHardwareId: 'gpu_unknown_nonexistent_9999',
          display: { width: 1920, height: 1080 },
          performance: { avgFps: 60 },
        })
      ).rejects.toThrow(/Canonical HardwareGpu could not be found/);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Display Normalization & Pixel Count Calculation
  // --------------------------------------------------------------------------
  describe('3. Display Normalization & Pixel Count Calculation', () => {
    it('should compute exact pixelCount server-side for standard and ultrawide', () => {
      const fhd = normalizeDisplay(1920, 1080);
      expect(fhd.pixelCount).toBe(2073600);
      expect(fhd.label).toBe('1080p');

      const qhd = normalizeDisplay(2560, 1440);
      expect(qhd.pixelCount).toBe(3686400);
      expect(qhd.label).toBe('1440p');

      const uw = normalizeDisplay(3440, 1440);
      expect(uw.pixelCount).toBe(4953600);
      expect(uw.label).toBe('1440p Ultrawide');

      const uhd = normalizeDisplay(3840, 2160);
      expect(uhd.pixelCount).toBe(8294400);
      expect(uhd.label).toBe('4K');
    });

    it('should reject invalid display dimensions', () => {
      expect(() => normalizeDisplay(400, 300)).toThrow(/Invalid display width/);
      expect(() => normalizeDisplay(1920, 200)).toThrow(/Invalid display height/);
      expect(() => normalizeDisplay('invalid', 1080)).toThrow(/Invalid display width/);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Performance Validation & Bounds
  // --------------------------------------------------------------------------
  describe('4. Performance Validation & Bounds', () => {
    it('should accept valid finite avgFps and optional metrics', async () => {
      const result = await validateBenchmarkObservation({
        gameSlug: 'benchmark-test-game',
        cpuHardwareId: testCpu.hardwareId,
        gpuHardwareId: testGpu.hardwareId,
        display: { width: 1920, height: 1080 },
        graphics: { normalizedPreset: 'high' },
        performance: { avgFps: 120.4, onePercentLowFps: 95.0, minFps: 80.0 },
        provenance: { sourceType: 'project_aura_test', sourceName: 'Lab' },
      });

      expect(result.performance.avgFps).toBe(120.4);
      expect(result.performance.onePercentLowFps).toBe(95.0);
      expect(result.performance.minFps).toBe(80.0);
    });

    it('should reject avgFps below lower bound (< 5 FPS)', async () => {
      await expect(
        validateBenchmarkObservation({
          gameSlug: 'benchmark-test-game',
          cpuHardwareId: testCpu.hardwareId,
          gpuHardwareId: testGpu.hardwareId,
          display: { width: 1920, height: 1080 },
          performance: { avgFps: 3.2 },
        })
      ).rejects.toThrow(/Invalid performance.avgFps/);
    });

    it('should reject avgFps above upper bound (> 1200 FPS)', async () => {
      await expect(
        validateBenchmarkObservation({
          gameSlug: 'benchmark-test-game',
          cpuHardwareId: testCpu.hardwareId,
          gpuHardwareId: testGpu.hardwareId,
          display: { width: 1920, height: 1080 },
          performance: { avgFps: 1400 },
        })
      ).rejects.toThrow(/Invalid performance.avgFps/);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Training Eligibility & Source Licensing Gating
  // --------------------------------------------------------------------------
  describe('5. Training Eligibility & Source Licensing Gating', () => {
    it('should mark first-party approved tests as trainingEligible', async () => {
      const result = await validateBenchmarkObservation({
        gameSlug: 'benchmark-test-game',
        cpuHardwareId: testCpu.hardwareId,
        gpuHardwareId: testGpu.hardwareId,
        display: { width: 1920, height: 1080 },
        graphics: { normalizedPreset: 'high' },
        rayTracing: { enabled: false },
        upscaling: { enabled: false },
        frameGeneration: { enabled: false },
        performance: { avgFps: 85.0 },
        provenance: { sourceType: 'project_aura_test', sourceName: 'Lab' },
      });

      expect(result.licenseStatus).toBe('approved');
      expect(result.trainingEligible).toBe(true);
    });

    it('should exclude frame-generation enabled runs from native trainingEligible', async () => {
      const result = await validateBenchmarkObservation({
        gameSlug: 'benchmark-test-game',
        cpuHardwareId: testCpu.hardwareId,
        gpuHardwareId: testGpu.hardwareId,
        display: { width: 1920, height: 1080 },
        graphics: { normalizedPreset: 'ultra' },
        rayTracing: { enabled: false },
        upscaling: { enabled: true, technology: 'DLSS', mode: 'Quality' },
        frameGeneration: { enabled: true, technology: 'DLSS Frame Generation' },
        performance: { avgFps: 140.0 },
        provenance: { sourceType: 'project_aura_test', sourceName: 'Lab' },
      });

      expect(result.frameGeneration.enabled).toBe(true);
      // Native training eligibility gate requires FG == false
      expect(result.trainingEligible).toBe(false);
      expect(result.evaluationEligible).toBe(true);
    });

    it('should reject unapproved sources from trainingEligible', async () => {
      const result = await validateBenchmarkObservation({
        gameSlug: 'benchmark-test-game',
        cpuHardwareId: testCpu.hardwareId,
        gpuHardwareId: testGpu.hardwareId,
        display: { width: 1920, height: 1080 },
        graphics: { normalizedPreset: 'high' },
        rayTracing: { enabled: false },
        upscaling: { enabled: false },
        frameGeneration: { enabled: false },
        performance: { avgFps: 85.0 },
        provenance: { sourceType: 'legacy_dataset', sourceName: 'Unverified Web Data' },
      });

      expect(result.licenseStatus).toBe('internal_only');
      expect(result.trainingEligible).toBe(false);
    });

    it('should reject permission-required reviewer scrapings from training', async () => {
      const result = await validateBenchmarkObservation({
        gameSlug: 'benchmark-test-game',
        cpuHardwareId: testCpu.hardwareId,
        gpuHardwareId: testGpu.hardwareId,
        display: { width: 1920, height: 1080 },
        graphics: { normalizedPreset: 'high' },
        performance: { avgFps: 85.0 },
        provenance: { sourceType: 'trusted_review', sourceName: 'Public Review Site' },
      });

      expect(result.licenseStatus).toBe('permission_required');
      expect(result.trainingEligible).toBe(false);
    });

    it('should prevent incoming payload from spoofing licenseStatus or trainingEligible', async () => {
      const result = await validateBenchmarkObservation({
        gameSlug: 'benchmark-test-game',
        cpuHardwareId: testCpu.hardwareId,
        gpuHardwareId: testGpu.hardwareId,
        display: { width: 1920, height: 1080 },
        graphics: { normalizedPreset: 'unknown' },
        performance: { avgFps: 85.0 },
        provenance: { sourceType: 'trusted_review', sourceName: 'Scraped Table' },
        // Attempting to inject spoofed eligibility
        licenseStatus: 'approved',
        trainingEligible: true,
      });

      expect(result.licenseStatus).toBe('permission_required');
      expect(result.trainingEligible).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Fingerprinting, Duplicate Detection & Repeated Runs
  // --------------------------------------------------------------------------
  describe('6. Fingerprinting, Duplicate Detection & Repeated Runs', () => {
    it('should generate deterministic observation fingerprints', () => {
      const obsA = {
        gameSlug: 'cyberpunk-2077',
        cpuHardwareId: 'cpu_amd_ryzen_7_7800x3d_desktop',
        gpuHardwareId: 'gpu_nvidia_geforce_rtx_4070_desktop',
        display: { width: 2560, height: 1440 },
        graphics: { normalizedPreset: 'ultra' },
        rayTracing: { enabled: true, preset: 'overdrive' },
        upscaling: { enabled: true, technology: 'DLSS', mode: 'Quality' },
        frameGeneration: { enabled: false },
        provenance: { sourceType: 'project_aura_test', sourceName: 'Aura Lab', sourceRecordId: 'REC-001' },
      };

      const fp1 = generateObservationFingerprint(obsA);
      const fp2 = generateObservationFingerprint(obsA);
      expect(fp1).toBe(fp2);
      expect(fp1).toHaveLength(64);
    });

    it('should detect exact duplicate submissions and reject duplicates', async () => {
      const payload = {
        gameSlug: 'benchmark-test-game',
        cpuHardwareId: testCpu.hardwareId,
        gpuHardwareId: testGpu.hardwareId,
        display: { width: 2560, height: 1440 },
        graphics: { normalizedPreset: 'high' },
        rayTracing: { enabled: false },
        upscaling: { enabled: false },
        frameGeneration: { enabled: false },
        performance: { avgFps: 90.0 },
        provenance: { sourceType: 'project_aura_test', sourceName: 'Lab QA', sourceRecordId: 'REC-DUP-1' },
      };

      const first = await ingestBenchmarkObservation(payload);
      expect(first.isDuplicate).toBe(false);

      const second = await ingestBenchmarkObservation(payload);
      expect(second.isDuplicate).toBe(true);
      expect(second.benchmark.benchmarkId).toBe(first.benchmark.benchmarkId);
    });

    it('should allow legitimate repeated runs with distinct session/run indices', async () => {
      const run1 = await ingestBenchmarkObservation({
        gameSlug: 'benchmark-test-game',
        cpuHardwareId: testCpu.hardwareId,
        gpuHardwareId: testGpu.hardwareId,
        display: { width: 2560, height: 1440 },
        graphics: { normalizedPreset: 'high' },
        rayTracing: { enabled: false },
        upscaling: { enabled: false },
        frameGeneration: { enabled: false },
        performance: { avgFps: 91.2 },
        testConditions: { runCount: 1 },
        provenance: { sourceType: 'project_aura_test', sourceName: 'Lab QA', sourceRecordId: 'RUN-1' },
      });

      const run2 = await ingestBenchmarkObservation({
        gameSlug: 'benchmark-test-game',
        cpuHardwareId: testCpu.hardwareId,
        gpuHardwareId: testGpu.hardwareId,
        display: { width: 2560, height: 1440 },
        graphics: { normalizedPreset: 'high' },
        rayTracing: { enabled: false },
        upscaling: { enabled: false },
        frameGeneration: { enabled: false },
        performance: { avgFps: 92.0 },
        testConditions: { runCount: 2 },
        provenance: { sourceType: 'project_aura_test', sourceName: 'Lab QA', sourceRecordId: 'RUN-2' },
      });

      expect(run1.isDuplicate).toBe(false);
      expect(run2.isDuplicate).toBe(false);
      expect(run1.benchmark.benchmarkId).not.toBe(run2.benchmark.benchmarkId);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Bounded Read API Endpoints
  // --------------------------------------------------------------------------
  describe('7. Bounded Read API Endpoints', () => {
    it('GET /api/benchmarks/:benchmarkId should return a valid benchmark', async () => {
      const benchmark = await GameBenchmark.findOne({ gameSlug: 'benchmark-test-game' });
      expect(benchmark).toBeDefined();

      const res = await request(app).get(`/api/benchmarks/${benchmark.benchmarkId}`);
      expect(res.status).toBe(200);
      expect(res.body.benchmarkId).toBe(benchmark.benchmarkId);
      expect(res.body.gameSlug).toBe('benchmark-test-game');
    });

    it('GET /api/benchmarks/game/:slug should return bounded paginated benchmarks', async () => {
      const res = await request(app).get('/api/benchmarks/game/benchmark-test-game?limit=10');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('gameSlug', 'benchmark-test-game');
      expect(res.body).toHaveProperty('benchmarks');
      expect(Array.isArray(res.body.benchmarks)).toBe(true);
      expect(res.body.limit).toBe(10);
    });
  });
});
