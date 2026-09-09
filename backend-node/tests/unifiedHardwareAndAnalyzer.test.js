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
    test('finds older CPUs from legacy database (i5-8400, i5-9500, i5-10400F)', async () => {
      const res8400 = await searchUnifiedCpus('i5 8400');
      expect(res8400.length).toBeGreaterThan(0);
      expect(res8400.some(c => c.cpuName.includes('8400'))).toBe(true);
      expect(res8400[0].hardwareSource).toBeDefined();

      const res9500 = await searchUnifiedCpus('i5-9500');
      expect(res9500.length).toBeGreaterThan(0);
      expect(res9500.some(c => c.cpuName.includes('9500'))).toBe(true);

      const res10400 = await searchUnifiedCpus('i5 10400F');
      expect(res10400.length).toBeGreaterThan(0);
      expect(res10400.some(c => c.cpuName.includes('10400'))).toBe(true);
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
      expect(res1660.some(g => g.Device.includes('1660 SUPER'))).toBe(true);
      expect(res1660[0].hardwareSource).toBe('legacy');

      const res3060Ti = await searchUnifiedGpus('RTX 3060 Ti');
      expect(res3060Ti.length).toBeGreaterThan(0);
      expect(res3060Ti.some(g => g.Device.includes('3060 Ti'))).toBe(true);
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

  describe('4. Model V2 Hardware Spec Safety', () => {
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

    test('rejects incomplete physical hardware without fabricating synthetic tiers', async () => {
      const payload = {
        CPU: 'Intel Core i5-8400 @ 2.80GHz', // Legacy CPU not in master
        GPU: 'GeForce GTX 1660 SUPER',       // Legacy GPU not in master
        GameName: 'grandTheftAuto5',
        GameSetting_Ordinal: 3,
      };

      const result = await resolveModelV2Payload(payload);
      expect(result.valid).toBe(false);
      expect(result.missingFields.length).toBeGreaterThan(0);
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
