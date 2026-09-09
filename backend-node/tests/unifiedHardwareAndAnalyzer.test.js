const mongoose = require('mongoose');
const { searchUnifiedCpus, searchUnifiedGpus, normalizeSkuKey } = require('../services/hardware/hardwareSearchService');
const { resolveModelV2Payload } = require('../services/datasetV2/modelV2Resolver');
const HardwareCpu = require('../models/HardwareCpu');
const HardwareGpu = require('../models/HardwareGpu');
const { CPU, GPU } = require('../models/Hardware');
require('dotenv').config();

describe('Unified Hardware Search & Analyzer Mode Separation', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('1. SKU Normalization & Deduplication', () => {
    test('normalizes hardware names to consistent deduplication keys', () => {
      expect(normalizeSkuKey('NVIDIA GeForce RTX 4070')).toBe('rtx4070');
      expect(normalizeSkuKey('GeForce RTX 4070')).toBe('rtx4070');
      expect(normalizeSkuKey('RTX 4070')).toBe('rtx4070');
      expect(normalizeSkuKey('Intel Core i5-8400 @ 2.80GHz')).toBe('i58400');
      expect(normalizeSkuKey('Core i5-8400')).toBe('i58400');
      expect(normalizeSkuKey('AMD Ryzen 7 7800X3D')).toBe('77800x3d');
      expect(normalizeSkuKey('Ryzen 7 7800X3D')).toBe('77800x3d');
    });
  });

  describe('2. Unified CPU Search', () => {
    test('finds older CPUs from legacy database (i3-10105, i5-8400, i5-9500, i5-10400F)', async () => {
      const res10105 = await searchUnifiedCpus('i3 10105');
      expect(res10105.length).toBeGreaterThan(0);
      expect(res10105.some(c => (c.cpuName || c.displayName || '').includes('10105'))).toBe(true);
      expect(res10105[0].hardwareSource).toBeDefined();

      const res8400 = await searchUnifiedCpus('i5 8400');
      expect(res8400.length).toBeGreaterThan(0);
      expect(res8400.some(c => (c.cpuName || c.displayName || '').includes('8400'))).toBe(true);
      expect(res8400[0].hardwareSource).toBeDefined();

      const res9500 = await searchUnifiedCpus('i5-9500');
      expect(res9500.length).toBeGreaterThan(0);
      expect(res9500.some(c => (c.cpuName || c.displayName || '').includes('9500'))).toBe(true);

      const res10400 = await searchUnifiedCpus('i5 10400F');
      expect(res10400.length).toBeGreaterThan(0);
      expect(res10400.some(c => (c.cpuName || c.displayName || '').includes('10400'))).toBe(true);
    });

    test('finds modern CPUs from Hardware Master with canonical priority', async () => {
      const res7800 = await searchUnifiedCpus('7800X3D');
      expect(res7800.length).toBeGreaterThan(0);
      expect(res7800[0].hardwareSource).toBe('master');
      expect(res7800[0].canonicalName).toBe('AMD Ryzen 7 7800X3D');
      expect(res7800[0].cores).toBe(8);
    });
  });

  describe('3. Unified GPU Search', () => {
    test('finds newer GPUs from Hardware Master (RTX 4070, RX 7800 XT)', async () => {
      const res4070 = await searchUnifiedGpus('RTX 4070');
      expect(res4070.length).toBeGreaterThan(0);
      expect(res4070[0].hardwareSource).toBe('master');
      expect(res4070.some(g => g.canonicalName === 'NVIDIA GeForce RTX 4070')).toBe(true);

      const res7800 = await searchUnifiedGpus('RX 7800 XT');
      expect(res7800.length).toBeGreaterThan(0);
      expect(res7800[0].hardwareSource).toBe('master');
      expect(res7800[0].canonicalName).toBe('AMD Radeon RX 7800 XT');
    });

    test('finds legacy/older GPUs from legacy collection (GTX 1660 SUPER, RTX 3060 Ti)', async () => {
      const res1660 = await searchUnifiedGpus('GTX 1660 SUPER');
      expect(res1660.length).toBeGreaterThan(0);
      expect(res1660.some(g => (g.Device || g.displayName || '').includes('1660 SUPER'))).toBe(true);
      expect(res1660[0].hardwareSource).toBe('legacy');

      const res3060Ti = await searchUnifiedGpus('RTX 3060 Ti');
      expect(res3060Ti.length).toBeGreaterThan(0);
      expect(res3060Ti.some(g => (g.Device || g.displayName || '').includes('3060 Ti'))).toBe(true);
      expect(res3060Ti[0].hardwareSource).toBe('legacy');
    });

    test('deduplicates equivalent hardware and gives priority to Master', async () => {
      const res3060 = await searchUnifiedGpus('RTX 3060');
      expect(res3060.length).toBeGreaterThan(0);
      // Master RTX 3060 must be first
      expect(res3060[0].hardwareSource).toBe('master');
      expect(res3060[0].canonicalName).toBe('NVIDIA GeForce RTX 3060');
      // No duplicate legacy RTX 3060
      const matchingCount = res3060.filter(g => normalizeSkuKey(g.Device || g.canonicalName) === 'rtx3060').length;
      expect(matchingCount).toBe(1);
    });
  });

  describe('4. Model V2 Hardware Spec Safety & Resolution', () => {
    test('resolves full physical specs when master hardware is provided', async () => {
      const payload = {
        cpuHardwareId: 'cpu_amd_ryzen_7_7800x3d_desktop',
        gpuHardwareId: 'gpu_nvidia_geforce_rtx_4070_desktop',
        GameName: 'grandTheftAuto5',
        GameSetting_Ordinal: 3,
      };

      const result = await resolveModelV2Payload(payload);
      expect(result.valid).toBe(true);
      expect(result.v2Payload.CpuNumberOfCores).toBe(8);
      expect(result.v2Payload.GpuNumberOfShadingUnits).toBe(5888);
      expect(result.v2Payload.GameName).toBe('grandTheftAuto5');
    });

    test('resolves legitimate physical specs for legacy hardware from verified project data (i5-8400 + GTX 1660 SUPER)', async () => {
      const payload = {
        CPU: 'Intel Core i5-8400 @ 2.80GHz',
        GPU: 'GeForce GTX 1660 SUPER',
        GameName: 'grandTheftAuto5',
        GameSetting_Ordinal: 3,
      };

      const result = await resolveModelV2Payload(payload);
      expect(result.valid).toBe(true);
      expect(result.v2Payload.CpuNumberOfCores).toBe(6);
      expect(result.v2Payload.CpuNumberOfThreads).toBe(6);
      expect(result.v2Payload.CpuCacheL3).toBe(9);
      expect(result.v2Payload.GpuNumberOfShadingUnits).toBe(1408);
      expect(result.v2Payload.GpuMemoryBus).toBe(192);
      expect(result.v2Payload.GpuNumberOfROPs).toBe(48);
      expect(result.missingFields).toHaveLength(0);
    });

    test('resolves legitimate physical specs for i5-9500 and i3-10105 from project data', async () => {
      const payload9500 = {
        CPU: 'Intel Core i5-9500 @ 3.00GHz',
        GPU: 'GeForce GTX 1660 SUPER',
        GameName: 'grandTheftAuto5',
        GameSetting_Ordinal: 3,
      };
      const res9500 = await resolveModelV2Payload(payload9500);
      expect(res9500.valid).toBe(true);
      expect(res9500.v2Payload.CpuNumberOfCores).toBe(6);
      expect(res9500.v2Payload.CpuCacheL3).toBe(9);

      const payload10105 = {
        CPU: 'Intel Core i3-10105 @ 3.70GHz',
        GPU: 'GeForce GTX 1660 SUPER',
        GameName: 'grandTheftAuto5',
        GameSetting_Ordinal: 3,
      };
      const res10105 = await resolveModelV2Payload(payload10105);
      expect(res10105.valid).toBe(true);
      expect(res10105.v2Payload.CpuNumberOfCores).toBe(4);
      expect(res10105.v2Payload.CpuNumberOfThreads).toBe(8);
      expect(res10105.v2Payload.CpuCacheL3).toBe(6);
    });

    test('returns controlled fallback for hardware with genuinely missing physical specs', async () => {
      const payload = {
        CPU: 'Generic Legacy Pentium 4',
        GPU: 'GeForce GTX 1660 SUPER',
        GameName: 'grandTheftAuto5',
        GameSetting_Ordinal: 3,
      };

      const result = await resolveModelV2Payload(payload);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('CpuNumberOfCores');
    });

    test('does NOT fake a fallback game (e.g. Apex Legends) when no game is supplied', async () => {
      const payload = {
        cpuHardwareId: 'cpu_amd_ryzen_7_7800x3d_desktop',
        gpuHardwareId: 'gpu_nvidia_geforce_rtx_4070_desktop',
        GameSetting_Ordinal: 3,
      };

      const result = await resolveModelV2Payload(payload);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('GameName');
      expect(result.v2Payload.GameName).toBeNull();
    });
  });
});
