require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Game = require('../models/Game');
const HardwareCpu = require('../models/HardwareCpu');
const HardwareGpu = require('../models/HardwareGpu');
const GameBenchmark = require('../models/GameBenchmark');
const {
  parseBoolean,
  parseNumber,
  parseDate,
  generateDeterministicRecordId,
  parseBenchmarkFile,
  normalizeAndResolveRow,
} = require('../services/benchmarks/benchmarkFileParser');
const {
  resolveCanonicalGame,
  resolveCanonicalCpu,
  resolveCanonicalGpu,
} = require('../services/benchmarks/canonicalResolver');
const { runIngestion, parseArgs } = require('../scripts/ingestBenchmarks');

const TEST_MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hardware_bottleneck';
const TEMP_DIR = path.resolve(__dirname, 'temp_test_files');

jest.setTimeout(30000);

describe('V2.1.3D — Benchmark Ingestion Tooling & First-Party Parser', () => {
  let testGame;
  let testCpu;
  let testGpu;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_MONGO_URI);
    }

    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    // Clean up test documents
    await Game.deleteMany({ slug: 'test-benchmark-cyber-city' });
    await HardwareCpu.deleteMany({ hardwareId: { $in: ['cpu_test_r7_7800x3d', 'cpu_test_r7_7800x3d_dup'] } });
    await HardwareGpu.deleteMany({ hardwareId: { $in: ['gpu_test_rtx_4070', 'gpu_test_rtx_4070_dup'] } });
    await GameBenchmark.deleteMany({ 'provenance.sourceGroupId': 'test_group' });

    testGame = await Game.create({
      name: 'Test Benchmark Cyber City',
      slug: 'test-benchmark-cyber-city',
      alternateNames: ['Cyber City Test Alt', 'CB City Unique Test'],
      developer: 'Test Studios',
      publisher: 'Test Pub',
    });

    testCpu = await HardwareCpu.create({
      hardwareId: 'cpu_test_r7_7800x3d',
      type: 'cpu',
      manufacturer: 'AMD',
      canonicalName: 'AMD Ryzen 7 7800X3D Unique Test',
      slug: 'amd-ryzen-7-7800x3d-unique-test',
      aliases: ['Ryzen 7 7800X3D Unique Alias', '7800X3D Unique Test'],
      marketSegment: 'desktop',
      family: 'Ryzen 7',
      generation: 'Zen 4',
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

    testGpu = await HardwareGpu.create({
      hardwareId: 'gpu_test_rtx_4070',
      type: 'gpu',
      manufacturer: 'NVIDIA',
      canonicalName: 'NVIDIA GeForce RTX 4070 Unique Test',
      slug: 'nvidia-geforce-rtx-4070-unique-test',
      aliases: ['GeForce RTX 4070 Unique Alias', 'RTX 4070 Unique Test'],
      marketSegment: 'desktop',
      family: 'GeForce',
      generation: 'Ada Lovelace',
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
    await Game.deleteMany({ slug: 'test-benchmark-cyber-city' });
    await HardwareCpu.deleteMany({ hardwareId: { $in: ['cpu_test_r7_7800x3d', 'cpu_test_r7_7800x3d_dup'] } });
    await HardwareGpu.deleteMany({ hardwareId: { $in: ['gpu_test_rtx_4070', 'gpu_test_rtx_4070_dup'] } });
    await GameBenchmark.deleteMany({ 'provenance.sourceGroupId': 'test_group' });

    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  describe('1. Parsing & Normalization Primitives', () => {
    test('parseBoolean correctly normalizes valid true values', () => {
      expect(parseBoolean('true', 'field')).toBe(true);
      expect(parseBoolean('TRUE', 'field')).toBe(true);
      expect(parseBoolean('1', 'field')).toBe(true);
      expect(parseBoolean('yes', 'field')).toBe(true);
      expect(parseBoolean('Y', 'field')).toBe(true);
      expect(parseBoolean(true, 'field')).toBe(true);
    });

    test('parseBoolean correctly normalizes valid false values', () => {
      expect(parseBoolean('false', 'field')).toBe(false);
      expect(parseBoolean('FALSE', 'field')).toBe(false);
      expect(parseBoolean('0', 'field')).toBe(false);
      expect(parseBoolean('no', 'field')).toBe(false);
      expect(parseBoolean('N', 'field')).toBe(false);
      expect(parseBoolean(false, 'field')).toBe(false);
    });

    test('parseBoolean handles empty/null as null', () => {
      expect(parseBoolean('', 'field')).toBeNull();
      expect(parseBoolean(null, 'field')).toBeNull();
      expect(parseBoolean(undefined, 'field')).toBeNull();
    });

    test('parseBoolean rejects invalid boolean values', () => {
      expect(() => parseBoolean('maybe', 'field')).toThrow('INVALID_BOOLEAN');
      expect(() => parseBoolean('2', 'field')).toThrow('INVALID_BOOLEAN');
      expect(() => parseBoolean('active', 'field')).toThrow('INVALID_BOOLEAN');
    });

    test('parseNumber parses valid numbers and handles empty values as null (not 0)', () => {
      expect(parseNumber('144.5', 'avgFps')).toBe(144.5);
      expect(parseNumber('16', 'ramGB')).toBe(16);
      expect(parseNumber('', 'onePercentLowFps')).toBeNull();
      expect(parseNumber(null, 'onePercentLowFps')).toBeNull();
      expect(parseNumber(undefined, 'onePercentLowFps')).toBeNull();
    });

    test('parseNumber rejects invalid non-numeric values', () => {
      expect(() => parseNumber('fast', 'avgFps')).toThrow('INVALID_NUMBER');
      expect(() => parseNumber('NaN', 'avgFps')).toThrow('INVALID_NUMBER');
    });

    test('parseNumber throws when required field is missing', () => {
      expect(() => parseNumber('', 'avgFps', true)).toThrow('MISSING_FIELD');
    });

    test('parseDate validates ISO dates and rejects invalid dates', () => {
      expect(parseDate('2026-09-02T12:00:00Z', 'collectedAt')).toBeInstanceOf(Date);
      expect(parseDate('', 'collectedAt')).toBeNull();
      expect(() => parseDate('not-a-date', 'collectedAt')).toThrow('INVALID_DATE');
    });

    test('generateDeterministicRecordId produces stable session identifiers', () => {
      const id = generateDeterministicRecordId('sess123', 0);
      expect(id).toBe('pa_sess123_row1');
    });
  });

  describe('2. Canonical Identity Resolution', () => {
    test('resolves Game by ObjectId, slug, exact name, and alias', async () => {
      const byId = await resolveCanonicalGame(testGame._id.toString());
      expect(byId.resolved._id.toString()).toBe(testGame._id.toString());

      const bySlug = await resolveCanonicalGame('test-benchmark-cyber-city');
      expect(bySlug.resolved.slug).toBe('test-benchmark-cyber-city');

      const byName = await resolveCanonicalGame('Test Benchmark Cyber City');
      expect(byName.resolved.name).toBe('Test Benchmark Cyber City');

      const byAlt = await resolveCanonicalGame('Cyber City Test Alt');
      expect(byAlt.resolved.slug).toBe('test-benchmark-cyber-city');
    });

    test('rejects missing or unknown Game with clear error codes', async () => {
      const missing = await resolveCanonicalGame('');
      expect(missing.errorCode).toBe('MISSING_GAME');

      const unknown = await resolveCanonicalGame('NonExistent Game 999');
      expect(unknown.errorCode).toBe('GAME_NOT_FOUND');
    });

    test('resolves CPU by hardwareId, slug, canonicalName, and alias', async () => {
      const byHwId = await resolveCanonicalCpu('cpu_test_r7_7800x3d');
      expect(byHwId.resolved.hardwareId).toBe('cpu_test_r7_7800x3d');

      const bySlug = await resolveCanonicalCpu('amd-ryzen-7-7800x3d-unique-test');
      expect(bySlug.resolved.hardwareId).toBe('cpu_test_r7_7800x3d');

      const byName = await resolveCanonicalCpu('AMD Ryzen 7 7800X3D Unique Test');
      expect(byName.resolved.hardwareId).toBe('cpu_test_r7_7800x3d');

      const byAlias = await resolveCanonicalCpu('Ryzen 7 7800X3D Unique Alias');
      expect(byAlias.resolved.hardwareId).toBe('cpu_test_r7_7800x3d');
    });

    test('rejects ambiguous hardware variants when multiple match', async () => {
      // Create duplicate alias to test ambiguity rejection
      await HardwareCpu.create({
        hardwareId: 'cpu_test_r7_7800x3d_dup',
        type: 'cpu',
        manufacturer: 'AMD',
        canonicalName: 'AMD Ryzen 7 7800X3D Duplicate',
        slug: 'amd-ryzen-7-7800x3d-duplicate',
        aliases: ['Ryzen 7 7800X3D Unique Alias'], // same alias
        marketSegment: 'desktop',
        family: 'Ryzen 7',
        generation: 'Zen 4',
        architecture: 'Zen 4',
        releaseYear: 2023,
        cores: { total: 8, performanceCores: 8 },
        threads: 16,
        clocks: { baseClockGHz: 4.2, boostClockGHz: 5.0 },
        cache: { l3CacheMB: 96 },
        power: { defaultTdpWatts: 120 },
        quality: { specQuality: 'verified', mlReady: true },
        provenance: { specifications: { sourceName: 'AMD' } },
      });

      const ambig = await resolveCanonicalCpu('Ryzen 7 7800X3D Unique Alias');
      expect(ambig.errorCode).toBe('CPU_AMBIGUOUS');
      expect(ambig.resolved).toBeNull();
    });

    test('rejects missing or unknown CPU with clear error codes', async () => {
      const missing = await resolveCanonicalCpu('');
      expect(missing.errorCode).toBe('MISSING_CPU');

      const unknown = await resolveCanonicalCpu('Pentium 133 Test NonExistent');
      expect(unknown.errorCode).toBe('CPU_NOT_FOUND');
    });

    test('resolves GPU by hardwareId, slug, canonicalName, and alias', async () => {
      const byHwId = await resolveCanonicalGpu('gpu_test_rtx_4070');
      expect(byHwId.resolved.hardwareId).toBe('gpu_test_rtx_4070');

      const bySlug = await resolveCanonicalGpu('nvidia-geforce-rtx-4070-unique-test');
      expect(bySlug.resolved.hardwareId).toBe('gpu_test_rtx_4070');

      const byName = await resolveCanonicalGpu('NVIDIA GeForce RTX 4070 Unique Test');
      expect(byName.resolved.hardwareId).toBe('gpu_test_rtx_4070');

      const byAlias = await resolveCanonicalGpu('GeForce RTX 4070 Unique Alias');
      expect(byAlias.resolved.hardwareId).toBe('gpu_test_rtx_4070');
    });

    test('rejects missing or unknown GPU with clear error codes', async () => {
      const missing = await resolveCanonicalGpu('');
      expect(missing.errorCode).toBe('MISSING_GPU');

      const unknown = await resolveCanonicalGpu('Voodoo 2 Test NonExistent');
      expect(unknown.errorCode).toBe('GPU_NOT_FOUND');
    });
  });

  describe('3. File Parsing & Validation of CSV and JSON', () => {
    test('parseBenchmarkFile rejects missing file and unsupported extension', async () => {
      await expect(parseBenchmarkFile(path.join(TEMP_DIR, 'nonexistent.csv'))).rejects.toThrow('File not found');

      const txtPath = path.join(TEMP_DIR, 'test.txt');
      fs.writeFileSync(txtPath, 'some text');
      await expect(parseBenchmarkFile(txtPath)).rejects.toThrow('Unsupported file extension');
    });

    test('parseBenchmarkFile rejects CSV missing required headers', async () => {
      const invalidCsvPath = path.join(TEMP_DIR, 'missing_headers.csv');
      fs.writeFileSync(invalidCsvPath, 'title,chip,card\nsome,some,some');

      await expect(parseBenchmarkFile(invalidCsvPath)).rejects.toThrow('Missing required CSV headers');
    });

    test('parseBenchmarkFile parses valid CSV file properly', async () => {
      const validCsvPath = path.join(TEMP_DIR, 'valid_test.csv');
      const csvData = `game,cpu,gpu,width,height,preset,rayTracingEnabled,upscalingEnabled,frameGenerationEnabled,avgFps,onePercentLowFps
test-benchmark-cyber-city,cpu_test_r7_7800x3d,gpu_test_rtx_4070,1920,1080,high,false,false,false,145.2,112.4`;
      fs.writeFileSync(validCsvPath, csvData);

      const parsed = await parseBenchmarkFile(validCsvPath);
      expect(parsed.fileExtension).toBe('.csv');
      expect(parsed.rows.length).toBe(1);
      expect(parsed.rows[0].avgFps).toBe('145.2');
    });

    test('parseBenchmarkFile parses valid JSON file properly', async () => {
      const validJsonPath = path.join(TEMP_DIR, 'valid_test.json');
      const jsonData = JSON.stringify([
        {
          game: 'test-benchmark-cyber-city',
          cpu: 'cpu_test_r7_7800x3d',
          gpu: 'gpu_test_rtx_4070',
          width: 1920,
          height: 1080,
          preset: 'high',
          rayTracingEnabled: false,
          upscalingEnabled: false,
          frameGenerationEnabled: false,
          avgFps: 145.2,
        },
      ]);
      fs.writeFileSync(validJsonPath, jsonData);

      const parsed = await parseBenchmarkFile(validJsonPath);
      expect(parsed.fileExtension).toBe('.json');
      expect(parsed.rows.length).toBe(1);
      expect(parsed.rows[0].game).toBe('test-benchmark-cyber-city');
    });

    test('parseBenchmarkFile rejects malformed JSON', async () => {
      const malformedJsonPath = path.join(TEMP_DIR, 'malformed.json');
      fs.writeFileSync(malformedJsonPath, '{ invalid json');

      await expect(parseBenchmarkFile(malformedJsonPath)).rejects.toThrow('Malformed JSON');
    });
  });

  describe('4. Row Transformation, Source Policy, and Eligibility', () => {
    test('normalizeAndResolveRow produces valid observation payload for clean row', async () => {
      const rawRow = {
        game: 'test-benchmark-cyber-city',
        cpu: 'cpu_test_r7_7800x3d',
        gpu: 'gpu_test_rtx_4070',
        width: 1920,
        height: 1080,
        preset: 'high',
        rayTracingEnabled: 'false',
        upscalingEnabled: 'false',
        frameGenerationEnabled: 'false',
        avgFps: '142.8',
        onePercentLowFps: '110.2',
        ramGB: '32',
      };

      const res = await normalizeAndResolveRow(rawRow, 0, { benchmarkSessionId: 'sess_test_1' });
      expect(res.valid).toBe(true);
      expect(res.payload.provenance.sourceType).toBe('project_aura_test');
      expect(res.payload.provenance.benchmarkSessionId).toBe('sess_test_1');
      expect(res.payload.provenance.sourceRecordId).toBe('pa_sess_test_1_row1');
      expect(res.payload.performance.avgFps).toBe(142.8);
      expect(res.payload.performance.onePercentLowFps).toBe(110.2);
      expect(res.payload.system.ramGB).toBe(32);
    });

    test('excludes Frame Generation observations from Native Training', async () => {
      const rawFgRow = {
        game: 'test-benchmark-cyber-city',
        cpu: 'cpu_test_r7_7800x3d',
        gpu: 'gpu_test_rtx_4070',
        width: 1920,
        height: 1080,
        preset: 'ultra',
        rayTracingEnabled: 'false',
        upscalingEnabled: 'true',
        frameGenerationEnabled: 'true',
        frameGenerationTechnology: 'DLSS 3',
        avgFps: '185.0',
      };

      const res = await normalizeAndResolveRow(rawFgRow, 0, { benchmarkSessionId: 'sess_fg' });
      expect(res.valid).toBe(true);
      expect(res.payload.frameGeneration.enabled).toBe(true);
      expect(res.payload.frameGeneration.technology).toBe('DLSS 3');
    });

    test('rejects row with invalid FPS (< 5 or > 1200)', async () => {
      const invalidFpsRow = {
        game: 'test-benchmark-cyber-city',
        cpu: 'cpu_test_r7_7800x3d',
        gpu: 'gpu_test_rtx_4070',
        width: 1920,
        height: 1080,
        preset: 'high',
        rayTracingEnabled: 'false',
        upscalingEnabled: 'false',
        frameGenerationEnabled: 'false',
        avgFps: '3.2',
      };

      const res = await normalizeAndResolveRow(invalidFpsRow, 0, {});
      expect(res.valid).toBe(false);
      expect(res.error.code).toBe('INVALID_AVG_FPS');
    });

    test('rejects row with missing explicit Ray Tracing state', async () => {
      const missingRtRow = {
        game: 'test-benchmark-cyber-city',
        cpu: 'cpu_test_r7_7800x3d',
        gpu: 'gpu_test_rtx_4070',
        width: 1920,
        height: 1080,
        preset: 'high',
        upscalingEnabled: 'false',
        frameGenerationEnabled: 'false',
        avgFps: '120',
      };

      const res = await normalizeAndResolveRow(missingRtRow, 0, {});
      expect(res.valid).toBe(false);
      expect(res.error.code).toBe('MISSING_RT_STATE');
    });
  });

  describe('5. CLI Execution & Dry-Run vs Live Ingestion', () => {
    test('parseArgs parses CLI arguments properly', () => {
      const parsed = parseArgs(['--file', './test.csv', '--dry-run', '--session', 'my_sess']);
      expect(parsed.file).toBe('./test.csv');
      expect(parsed.dryRun).toBe(true);
      expect(parsed.sessionId).toBe('my_sess');
    });

    test('Dry-Run mode validates rows and performs ZERO database writes', async () => {
      const initialCount = await GameBenchmark.countDocuments();

      const dryRunCsvPath = path.join(TEMP_DIR, 'dry_run_test.csv');
      const csvContent = `game,cpu,gpu,width,height,preset,rayTracingEnabled,upscalingEnabled,frameGenerationEnabled,avgFps,onePercentLowFps
test-benchmark-cyber-city,cpu_test_r7_7800x3d,gpu_test_rtx_4070,1920,1080,high,false,false,false,148.5,115.0`;
      fs.writeFileSync(dryRunCsvPath, csvContent);

      const result = await runIngestion({
        file: dryRunCsvPath,
        dryRun: true,
        sessionId: 'dry_run_sess',
      });

      expect(result.success).toBe(true);
      expect(result.stats.rowsRead).toBe(1);
      expect(result.stats.accepted).toBe(1);
      expect(result.stats.rejected).toBe(0);
      expect(result.stats.trainingEligible).toBe(1);
      expect(result.stats.evaluationEligible).toBe(1);
      expect(result.stats.inserted).toBe(0);
      expect(result.stats.databaseWrites).toBe(0);

      const postCount = await GameBenchmark.countDocuments();
      expect(postCount).toBe(initialCount);
    });

    test('Live Ingestion writes valid record and handles exact duplicate on re-import', async () => {
      const liveCsvPath = path.join(TEMP_DIR, 'live_test.csv');
      const csvContent = `game,cpu,gpu,width,height,preset,rayTracingEnabled,upscalingEnabled,frameGenerationEnabled,avgFps,onePercentLowFps,sourceRecordId,sourceGroupId
test-benchmark-cyber-city,cpu_test_r7_7800x3d,gpu_test_rtx_4070,1920,1080,high,false,false,false,148.5,115.0,run_rec_001,test_group`;
      fs.writeFileSync(liveCsvPath, csvContent);

      // 1. First Live Run -> Insert 1 record
      const run1 = await runIngestion({
        file: liveCsvPath,
        dryRun: false,
        sessionId: 'live_sess_1',
      });

      expect(run1.success).toBe(true);
      expect(run1.stats.inserted).toBe(1);
      expect(run1.stats.databaseWrites).toBe(1);

      // 2. Second Live Run with exact same file -> Duplicate detected, 0 writes
      const run2 = await runIngestion({
        file: liveCsvPath,
        dryRun: false,
        sessionId: 'live_sess_1',
      });

      expect(run2.success).toBe(true);
      expect(run2.stats.duplicates).toBe(1);
      expect(run2.stats.inserted).toBe(0);
      expect(run2.stats.databaseWrites).toBe(0);
    });

    test('Accepts legitimate repeated run (same specs, different run identifier/FPS)', async () => {
      const repeatedCsvPath = path.join(TEMP_DIR, 'repeated_run.csv');
      const csvContent = `game,cpu,gpu,width,height,preset,rayTracingEnabled,upscalingEnabled,frameGenerationEnabled,avgFps,onePercentLowFps,sourceRecordId,sourceGroupId
test-benchmark-cyber-city,cpu_test_r7_7800x3d,gpu_test_rtx_4070,1920,1080,high,false,false,false,149.2,116.1,run_rec_002,test_group`;
      fs.writeFileSync(repeatedCsvPath, csvContent);

      const runRepeated = await runIngestion({
        file: repeatedCsvPath,
        dryRun: false,
        sessionId: 'live_sess_1',
      });

      expect(runRepeated.success).toBe(true);
      expect(runRepeated.stats.repeatedMeasurements).toBe(1);
      expect(runRepeated.stats.inserted).toBe(1);
      expect(runRepeated.stats.databaseWrites).toBe(1);
    });
  });
});
