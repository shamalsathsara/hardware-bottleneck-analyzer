const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../server');

const HardwareCpu = require('../models/HardwareCpu');
const HardwareGpu = require('../models/HardwareGpu');
const {
  normalizeCpuName,
  normalizeGpuName,
  generateHardwareId,
  generateSlug,
  generateAliases,
  detectAliasCollisions,
  isCpuMlReady,
  isGpuMlReady,
  validateCpuSpecs,
  validateGpuSpecs,
} = require('../services/hardware/hardwareNormalizer');

describe('Project Aura V2.1.2B Hardware Master Test Suite', () => {
  // --------------------------------------------------------------------------
  // TEST 1: CPU Specification Validation
  // --------------------------------------------------------------------------
  describe('1. CPU Specification Validation', () => {
    it('should validate complete, correct CPU payload', () => {
      const validCpu = {
        hardwareId: 'cpu_intel_core_i5_12400f_desktop',
        canonicalName: 'Intel Core i5-12400F',
        slug: 'intel-core-i5-12400f',
        releaseYear: 2022,
        cores: { total: 6 },
        threads: 12,
        clocks: { baseClockGHz: 2.5, boostClockGHz: 4.4 },
        cache: { l3CacheMB: 18 },
        power: { defaultTdpWatts: 65 },
      };

      const result = validateCpuSpecs(validCpu);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid / impossible numerical CPU values', () => {
      const invalidCpu = {
        hardwareId: 'invalid_id_format!',
        canonicalName: 'Test CPU',
        slug: 'test cpu',
        releaseYear: 1995, // too old
        cores: { total: -4 },
        threads: 2, // threads < cores
        clocks: { baseClockGHz: -2.0, boostClockGHz: NaN },
        cache: { l3CacheMB: -10 },
        power: { defaultTdpWatts: 0 },
      };

      const result = validateCpuSpecs(invalidCpu);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(4);
    });
  });

  // --------------------------------------------------------------------------
  // TEST 2: GPU Specification Validation
  // --------------------------------------------------------------------------
  describe('2. GPU Specification Validation', () => {
    it('should validate complete, correct GPU payload', () => {
      const validGpu = {
        hardwareId: 'gpu_nvidia_geforce_rtx_4070_desktop',
        canonicalName: 'NVIDIA GeForce RTX 4070',
        slug: 'nvidia-geforce-rtx-4070',
        releaseYear: 2023,
        memory: { vramGB: 12, memoryBandwidthGBs: 504.2, memoryBusBits: 192 },
        cores: { shaderUnits: 5888 },
        clocks: { boostClockMHz: 2475 },
        power: { defaultTgpWatts: 200 },
      };

      const result = validateGpuSpecs(validGpu);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid / impossible numerical GPU values', () => {
      const invalidGpu = {
        hardwareId: 'INVALID_GPU_ID',
        canonicalName: '',
        slug: 'bad_slug!',
        releaseYear: 2050,
        memory: { vramGB: -8, memoryBandwidthGBs: 0, memoryBusBits: 16 },
        cores: { shaderUnits: 10 },
        clocks: { boostClockMHz: -100 },
        power: { defaultTgpWatts: -200 },
      };

      const result = validateGpuSpecs(invalidGpu);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(5);
    });
  });

  // --------------------------------------------------------------------------
  // TEST 3: Hardware ID & Slug Generation
  // --------------------------------------------------------------------------
  describe('3. Hardware Identity & Slugs', () => {
    it('should generate consistent, immutable hardwareIds', () => {
      expect(generateHardwareId('cpu', 'Intel', 'Core i5-12400F', 'desktop')).toBe(
        'cpu_intel_core_i5_12400f_desktop'
      );
      expect(generateHardwareId('cpu', 'AMD', 'Ryzen 7 7800X3D', 'desktop')).toBe(
        'cpu_amd_ryzen_7_7800x3d_desktop'
      );
      expect(generateHardwareId('gpu', 'NVIDIA', 'GeForce RTX 4070', 'desktop')).toBe(
        'gpu_nvidia_geforce_rtx_4070_desktop'
      );
      expect(generateHardwareId('gpu', 'NVIDIA', 'GeForce RTX 4070', 'laptop')).toBe(
        'gpu_nvidia_geforce_rtx_4070_laptop'
      );
    });

    it('should generate clean URL slugs with market segment disambiguation', () => {
      expect(generateSlug('Intel Core i5-12400F', 'desktop')).toBe('intel-core-i5-12400f');
      expect(generateSlug('NVIDIA GeForce RTX 4070', 'laptop')).toBe('nvidia-geforce-rtx-4070-laptop');
    });
  });

  // --------------------------------------------------------------------------
  // TEST 4: Deterministic Normalization
  // --------------------------------------------------------------------------
  describe('4. Deterministic Normalization', () => {
    it('should normalize various Intel CPU input strings to canonical name', () => {
      expect(normalizeCpuName('i5 12400F')).toBe('Intel Core i5-12400F');
      expect(normalizeCpuName('Intel i5-12400F')).toBe('Intel Core i5-12400F');
      expect(normalizeCpuName('Intel Core i5 12400F')).toBe('Intel Core i5-12400F');
      expect(normalizeCpuName('Intel Core i5-12400F')).toBe('Intel Core i5-12400F');
    });

    it('should normalize various NVIDIA GPU input strings to canonical name', () => {
      expect(normalizeGpuName('RTX 4070')).toBe('NVIDIA GeForce RTX 4070');
      expect(normalizeGpuName('NVIDIA RTX 4070')).toBe('NVIDIA GeForce RTX 4070');
      expect(normalizeGpuName('GeForce RTX 4070')).toBe('NVIDIA GeForce RTX 4070');
      expect(normalizeGpuName('NVIDIA GeForce RTX 4070')).toBe('NVIDIA GeForce RTX 4070');
    });

    it('should preserve critical product suffixes (Ti, SUPER, XT, XTX, GRE, X3D, K, F)', () => {
      expect(normalizeGpuName('RTX 4070 Ti')).toBe('NVIDIA GeForce RTX 4070 Ti');
      expect(normalizeGpuName('RTX 4070 SUPER')).toBe('NVIDIA GeForce RTX 4070 SUPER');
      expect(normalizeGpuName('RTX 4070')).not.toBe(normalizeGpuName('RTX 4070 Ti'));
      expect(normalizeGpuName('RTX 4070')).not.toBe(normalizeGpuName('RTX 4070 SUPER'));

      expect(normalizeGpuName('RX 7800 XT')).toBe('AMD Radeon RX 7800 XT');
      expect(normalizeGpuName('RX 7900 XTX')).toBe('AMD Radeon RX 7900 XTX');
      expect(normalizeGpuName('RX 7900 GRE')).toBe('AMD Radeon RX 7900 GRE');

      expect(normalizeCpuName('Ryzen 7 7800X3D')).toBe('AMD Ryzen 7 7800X3D');
      expect(normalizeCpuName('Ryzen 7 7700X')).toBe('AMD Ryzen 7 7700X');
    });
  });

  // --------------------------------------------------------------------------
  // TEST 5: Desktop vs Laptop Separation
  // --------------------------------------------------------------------------
  describe('5. Desktop vs Laptop Separation', () => {
    it('should maintain separate hardwareIds and slugs for desktop and laptop variants', () => {
      const desktopId = generateHardwareId('gpu', 'NVIDIA', 'RTX 4070', 'desktop');
      const laptopId = generateHardwareId('gpu', 'NVIDIA', 'RTX 4070', 'laptop');
      expect(desktopId).not.toBe(laptopId);
      expect(desktopId).toBe('gpu_nvidia_rtx_4070_desktop');
      expect(laptopId).toBe('gpu_nvidia_rtx_4070_laptop');
    });
  });

  // --------------------------------------------------------------------------
  // TEST 6: Alias Collision Safety
  // --------------------------------------------------------------------------
  describe('6. Alias Collision Detection', () => {
    it('should detect when two distinct SKUs claim the exact same normalized alias', () => {
      const mockRecords = [
        {
          hardwareId: 'gpu_nvidia_rtx_4070_desktop',
          canonicalName: 'NVIDIA GeForce RTX 4070',
          aliases: ['RTX 4070', 'GeForce 4070'],
        },
        {
          hardwareId: 'gpu_nvidia_rtx_4070_laptop',
          canonicalName: 'NVIDIA GeForce RTX 4070 Laptop',
          aliases: ['RTX 4070', '4070 Mobile'], // 'RTX 4070' collides with desktop!
        },
      ];

      const collisions = detectAliasCollisions(mockRecords);
      expect(collisions.length).toBeGreaterThan(0);
      expect(collisions[0].normalizedAlias).toBe('rtx4070');
      expect(collisions[0].hardwareIdA).toBe('gpu_nvidia_rtx_4070_desktop');
      expect(collisions[0].hardwareIdB).toBe('gpu_nvidia_rtx_4070_laptop');
    });

    it('should report zero collisions for clean, well-differentiated datasets', () => {
      const mockClean = [
        {
          hardwareId: 'gpu_nvidia_rtx_4070_desktop',
          canonicalName: 'NVIDIA GeForce RTX 4070',
          aliases: ['RTX 4070', 'GeForce RTX 4070'],
        },
        {
          hardwareId: 'gpu_nvidia_rtx_4070_ti_desktop',
          canonicalName: 'NVIDIA GeForce RTX 4070 Ti',
          aliases: ['RTX 4070 Ti', 'GeForce RTX 4070 Ti'],
        },
      ];

      const collisions = detectAliasCollisions(mockClean);
      expect(collisions).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // TEST 7: ML Readiness Evaluator
  // --------------------------------------------------------------------------
  describe('7. ML Readiness Evaluator', () => {
    it('should return mlReady = false when performance scores are null/unavailable', () => {
      const cpu = {
        cores: { total: 8 },
        threads: 16,
        clocks: { boostClockGHz: 5.0 },
        cache: { l3CacheMB: 32 },
        performance: { singleCoreScore: null, multiCoreScore: null },
        quality: { specQuality: 'verified', performanceQuality: 'unavailable' },
      };
      expect(isCpuMlReady(cpu)).toBe(false);

      const gpu = {
        memory: { vramGB: 12, memoryBandwidthGBs: 504.2 },
        power: { defaultTgpWatts: 200 },
        performance: { rasterPerformanceScore: null },
        quality: { specQuality: 'verified', performanceQuality: 'unavailable' },
      };
      expect(isGpuMlReady(gpu)).toBe(false);
    });

    it('should return mlReady = true when all required features and benchmark scores are verified', () => {
      const completeCpu = {
        cores: { total: 8 },
        threads: 16,
        clocks: { boostClockGHz: 5.0 },
        cache: { l3CacheMB: 32 },
        performance: { singleCoreScore: 2100, multiCoreScore: 15400 },
        quality: { specQuality: 'verified', performanceQuality: 'verified' },
      };
      expect(isCpuMlReady(completeCpu)).toBe(true);

      const completeGpu = {
        memory: { vramGB: 12, memoryBandwidthGBs: 504.2 },
        power: { defaultTgpWatts: 200 },
        performance: { rasterPerformanceScore: 82.5 },
        quality: { specQuality: 'verified', performanceQuality: 'verified' },
      };
      expect(isGpuMlReady(completeGpu)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // TEST 8: Zero Synthetic CUDA Generation
  // --------------------------------------------------------------------------
  describe('8. Zero Synthetic CUDA Generation Policy', () => {
    it('HardwareGpu schema must NOT contain or persist synthetic CUDA formulas', () => {
      const sampleGpu = new HardwareGpu({
        hardwareId: 'gpu_amd_radeon_rx_7800_xt_desktop',
        type: 'gpu',
        manufacturer: 'AMD',
        canonicalName: 'AMD Radeon RX 7800 XT',
        slug: 'amd-radeon-rx-7800-xt',
        marketSegment: 'desktop',
        family: 'Radeon RX 7000',
        generation: 'RDNA 3',
        releaseYear: 2023,
        memory: { vramGB: 16, memoryType: 'GDDR6', memoryBusBits: 256, memoryBandwidthGBs: 624 },
        cores: { shaderUnits: 3840 },
        clocks: { boostClockMHz: 2430 },
        power: { defaultTgpWatts: 263 },
        features: { rayTracingSupport: true },
        quality: { specQuality: 'verified', performanceQuality: 'unavailable', mlReady: false },
        provenance: { specifications: { sourceName: 'AMD Specs', verificationMethod: 'manual' } },
      });

      const json = sampleGpu.toJSON();
      expect(json).not.toHaveProperty('CUDA');
      expect(json.performance.rasterPerformanceScore).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // TEST 9: REST API Endpoints
  // --------------------------------------------------------------------------
  describe('9. Hardware Master REST API Endpoints', () => {
    it('GET /api/hardware/cpus/search should return bounded search results', async () => {
      jest.spyOn(HardwareCpu, 'find').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { hardwareId: 'cpu_intel_core_i5_12400f_desktop', canonicalName: 'Intel Core i5-12400F' },
        ]),
      });

      const res = await request(app).get('/api/hardware/cpus/search?q=12400&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].canonicalName).toBe('Intel Core i5-12400F');

      HardwareCpu.find.mockRestore();
    });

    it('GET /api/hardware/gpus/search should return bounded search results', async () => {
      jest.spyOn(HardwareGpu, 'find').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { hardwareId: 'gpu_nvidia_geforce_rtx_4070_desktop', canonicalName: 'NVIDIA GeForce RTX 4070' },
        ]),
      });

      const res = await request(app).get('/api/hardware/gpus/search?q=4070&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].canonicalName).toBe('NVIDIA GeForce RTX 4070');

      HardwareGpu.find.mockRestore();
    });

    it('GET /api/hardware/cpus/:slug should return 404 for unknown slug', async () => {
      jest.spyOn(HardwareCpu, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app).get('/api/hardware/cpus/non-existent-cpu');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('CPU not found');

      HardwareCpu.findOne.mockRestore();
    });

    it('GET /api/hardware/stats should return hardware master counts', async () => {
      jest.spyOn(HardwareCpu, 'countDocuments').mockResolvedValue(20);
      jest.spyOn(HardwareGpu, 'countDocuments').mockResolvedValue(20);

      const res = await request(app).get('/api/hardware/stats');
      expect(res.status).toBe(200);
      expect(res.body.cpus.total).toBe(20);
      expect(res.body.gpus.total).toBe(20);

      HardwareCpu.countDocuments.mockRestore();
      HardwareGpu.countDocuments.mockRestore();
    });
  });
});
