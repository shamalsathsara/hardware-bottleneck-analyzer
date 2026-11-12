const request = require('supertest');
const axios = require('axios');
const app = require('../server');
const {
  resolveModelV2Payload,
  normalizeV2GameName,
  normalizeSettingOrdinal,
} = require('../services/datasetV2/modelV2Resolver');

jest.mock('axios');

describe('Project Aura V2.4 — Model V2 Backend Integration & Prediction Bridge', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Feature & Setting Normalization Primitives', () => {
    test('normalizeV2GameName normalizes known games and preserves unseen titles', () => {
      expect(normalizeV2GameName('Apex Legends')).toBe('apexLegends');
      expect(normalizeV2GameName('Grand Theft Auto V')).toBe('grandTheftAuto5');
      expect(normalizeV2GameName('cs:go')).toBe('counterStrikeGlobalOffensive');
      expect(normalizeV2GameName('Forza Horizon 5')).toBe('Forza Horizon 5');
      expect(normalizeV2GameName(null)).toBeNull();
    });

    test('normalizeSettingOrdinal maps supported presets and rejects untrained ones', () => {
      expect(normalizeSettingOrdinal('Medium')).toBe(2);
      expect(normalizeSettingOrdinal('Ultra')).toBe(4);
      expect(normalizeSettingOrdinal(4)).toBe(4);
      expect(normalizeSettingOrdinal('4')).toBe(4);
      expect(normalizeSettingOrdinal(null)).toBe(2);
      // Model V2 was only trained on Medium and Ultra.
      expect(normalizeSettingOrdinal('low')).toBeNull();
      expect(normalizeSettingOrdinal('high')).toBeNull();
      expect(normalizeSettingOrdinal(3)).toBeNull();
      expect(normalizeSettingOrdinal({})).toBeNull();
    });
  });

  describe('2. Model V2 Payload Resolution & Validation', () => {
    test('resolveModelV2Payload accepts valid direct physical features', async () => {
      const input = {
        GameName: 'apexLegends',
        GameSetting_Ordinal: 2,
        CpuNumberOfCores: 6,
        CpuNumberOfThreads: 6,
        CpuFrequency: 3000,
        CpuTurboClock: 4400,
        CpuCacheL3: 9,
        CpuTDP: 65,
        GpuMemorySize: 6000,
        GpuBandwidth: 336000,
        GpuMemoryBus: 192,
        GpuNumberOfShadingUnits: 1408,
        GpuBaseClock: 1530,
        GpuBoostClock: 1785,
        GpuNumberOfROPs: 48,
        GpuFP32Performance: 5027000,
      };

      const result = await resolveModelV2Payload(input);
      expect(result.valid).toBe(true);
      expect(result.missingFields).toHaveLength(0);
      expect(result.v2Payload.CpuNumberOfCores).toBe(6);
      expect(result.v2Payload.GpuNumberOfShadingUnits).toBe(1408);
      expect(result.v2Payload.GameName).toBe('apexLegends');
      expect(result.v2Payload.GameSetting_Ordinal).toBe(2);
    });

    test('resolveModelV2Payload flags missing physical specs without fake fallbacks', async () => {
      const input = {
        GameName: 'apexLegends',
        GameSetting_Ordinal: 2,
        CpuNumberOfCores: 6,
        // Missing other CPU & GPU physical features
      };

      const result = await resolveModelV2Payload(input);
      expect(result.valid).toBe(false);
      expect(result.missingFields.length).toBeGreaterThan(0);
      expect(result.missingFields).toContain('CpuNumberOfThreads');
      expect(result.missingFields).toContain('GpuNumberOfShadingUnits');
    });
  });

  describe('3. POST /api/predict End-to-End API Integration', () => {
    test('POST /api/predict executes Model V2 flow with validated physical features', async () => {
      const mockV2Response = {
        predictedFps: 105.63,
        predicted_fps: 105.63,
        modelVersion: 'v2',
        gameCoverage: 'known',
        resolution: '1080p',
        preset: 'Ultra',
        game: 'battlefield4',
      };

      axios.post.mockResolvedValueOnce({ data: mockV2Response });

      const payload = {
        modelVersion: 'v2',
        GameName: 'battlefield4',
        GameSetting_Ordinal: 4,
        CpuNumberOfCores: 8,
        CpuNumberOfThreads: 16,
        CpuFrequency: 3600,
        CpuTurboClock: 5000,
        CpuCacheL3: 16,
        CpuTDP: 95,
        GpuMemorySize: 11000,
        GpuBandwidth: 616000,
        GpuMemoryBus: 352,
        GpuNumberOfShadingUnits: 4352,
        GpuBaseClock: 1350,
        GpuBoostClock: 1545,
        GpuNumberOfROPs: 88,
        GpuFP32Performance: 13450000,
      };

      const res = await request(app).post('/api/predict').send(payload);

      expect(res.status).toBe(200);
      expect(res.body.modelVersion).toBe('v2');
      expect(res.body.predictedFps).toBe(105.63);
      expect(res.body.gameCoverage).toBe('known');
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    test('POST /api/predict returns 400 MODEL_V2_HARDWARE_DATA_INCOMPLETE on incomplete hardware', async () => {
      const payload = {
        modelVersion: 'v2',
        GameName: 'battlefield4',
        CpuNumberOfCores: 8,
        // Missing other physical features
      };

      const res = await request(app).post('/api/predict').send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('MODEL_V2_HARDWARE_DATA_INCOMPLETE');
      expect(Array.isArray(res.body.missingFields)).toBe(true);
      expect(res.body.missingFields.length).toBeGreaterThan(0);
      expect(axios.post).not.toHaveBeenCalled();
    });

    test('POST /api/predict ignores a client-supplied modelVersion (server decides)', async () => {
      const res = await request(app).post('/api/predict').send({
        modelVersion: 'v1',
        CPU: 'Intel i7-12700F',
        GPU: 'RTX 3060',
        'Graphics Settings': 'Ultra',
      });

      // MODEL_VERSION=v2 on the server: request goes through V2 resolution, not V1.
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('MODEL_V2_HARDWARE_DATA_INCOMPLETE');
      expect(axios.post).not.toHaveBeenCalled();
    });

    test('POST /api/predict rejects presets Model V2 was not trained on', async () => {
      const res = await request(app).post('/api/predict').send({
        CPU: 'Intel Core i5-9500 @ 3.00GHz',
        GPU: 'GeForce GTX 1660 SUPER',
        GameName: 'grandTheftAuto5',
        'Graphics Settings': 'High',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('UNSUPPORTED_PRESET');
      expect(res.body.supportedPresets).toEqual(['Medium', 'Ultra']);
      expect(axios.post).not.toHaveBeenCalled();
    });

    test('POST /api/predict maps an unreachable AI service to 503 and a timeout to 504', async () => {
      const body = {
        CPU: 'Intel Core i5-9500 @ 3.00GHz',
        GPU: 'GeForce GTX 1660 SUPER',
        GameName: 'grandTheftAuto5',
        GameSetting_Ordinal: 2,
      };

      axios.post.mockRejectedValueOnce(Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }));
      const down = await request(app).post('/api/predict').send(body);
      expect(down.status).toBe(503);
      expect(down.body.error).toBe('AI_SERVICE_UNAVAILABLE');

      axios.post.mockRejectedValueOnce(Object.assign(new Error('timeout'), { code: 'ECONNABORTED' }));
      const slow = await request(app).post('/api/predict').send(body);
      expect(slow.status).toBe(504);

      axios.post.mockRejectedValueOnce(Object.assign(new Error('boom'), { response: { status: 500, data: { error: 'secret stack' } } }));
      const crashed = await request(app).post('/api/predict').send(body);
      expect(crashed.status).toBe(503);
      expect(JSON.stringify(crashed.body)).not.toContain('secret stack');

      axios.post.mockRejectedValueOnce(Object.assign(new Error('bad'), { response: { status: 400, data: { error: 'MODEL_V2_INVALID_FEATURE' } } }));
      const invalid = await request(app).post('/api/predict').send(body);
      expect(invalid.status).toBe(400);
      expect(invalid.body.error).toBe('MODEL_V2_INVALID_FEATURE');
    });

    test('MODEL_VERSION=v1 rollback forwards only whitelisted V1 fields', async () => {
      let rollbackApp;
      const previous = process.env.MODEL_VERSION;
      process.env.MODEL_VERSION = 'v1';
      jest.isolateModules(() => {
        rollbackApp = require('../server');
      });
      process.env.MODEL_VERSION = previous;

      const isolatedAxios = jest.requireMock('axios');
      isolatedAxios.post.mockResolvedValueOnce({ data: { predictedFps: 84.5, modelVersion: 'v1' } });

      const res = await request(rollbackApp).post('/api/predict').send({
        CPU: 'Intel i7-12700F',
        GPU: 'RTX 3060',
        'RAM (GB)': 16,
        rawCpu: { huge: 'object' },
      });

      expect(res.status).toBe(200);
      expect(res.body.modelVersion).toBe('v1');
      const forwarded = isolatedAxios.post.mock.calls.at(-1)[1];
      expect(forwarded).toEqual({ CPU: 'Intel i7-12700F', GPU: 'RTX 3060', 'RAM (GB)': 16 });
    });

    test('POST /api/predict routes selected game slugs correctly to Model V2', async () => {
      const baseHardware = {
        CpuNumberOfCores: 6,
        CpuNumberOfThreads: 6,
        CpuFrequency: 3000,
        CpuTurboClock: 4400,
        CpuCacheL3: 9,
        CpuTDP: 65,
        GpuMemorySize: 6000,
        GpuBandwidth: 336000,
        GpuMemoryBus: 192,
        GpuNumberOfShadingUnits: 1408,
        GpuBaseClock: 1530,
        GpuBoostClock: 1785,
        GpuNumberOfROPs: 48,
        GpuFP32Performance: 5027000,
        GameSetting_Ordinal: 2,
      };

      // Test Game A: apex-legends -> apexLegends
      axios.post.mockResolvedValueOnce({
        data: { predictedFps: 114.98, modelVersion: 'v2', gameCoverage: 'known', game: 'apexLegends' },
      });
      const resA = await request(app).post('/api/predict').send({ ...baseHardware, gameSlug: 'apex-legends' });
      expect(resA.status).toBe(200);
      expect(axios.post).toHaveBeenLastCalledWith(
        expect.stringContaining('/predict'),
        expect.objectContaining({ GameName: 'apexLegends' }),
        expect.any(Object)
      );

      // Test Game B: grand-theft-auto-v -> grandTheftAuto5
      axios.post.mockResolvedValueOnce({
        data: { predictedFps: 94.98, modelVersion: 'v2', gameCoverage: 'known', game: 'grandTheftAuto5' },
      });
      const resB = await request(app).post('/api/predict').send({ ...baseHardware, gameSlug: 'grand-theft-auto-v' });
      expect(resB.status).toBe(200);
      expect(axios.post).toHaveBeenLastCalledWith(
        expect.stringContaining('/predict'),
        expect.objectContaining({ GameName: 'grandTheftAuto5' }),
        expect.any(Object)
      );

      // Test Game C: cs:go -> counterStrikeGlobalOffensive
      axios.post.mockResolvedValueOnce({
        data: { predictedFps: 281.84, modelVersion: 'v2', gameCoverage: 'known', game: 'counterStrikeGlobalOffensive' },
      });
      const resC = await request(app).post('/api/predict').send({ ...baseHardware, game: 'cs:go' });
      expect(resC.status).toBe(200);
      expect(axios.post).toHaveBeenLastCalledWith(
        expect.stringContaining('/predict'),
        expect.objectContaining({ GameName: 'counterStrikeGlobalOffensive' }),
        expect.any(Object)
      );

      // Test Game D: Unseen game -> preserved as-is
      axios.post.mockResolvedValueOnce({
        data: { predictedFps: 138.42, modelVersion: 'v2', gameCoverage: 'unseen', game: 'Cyberpunk 2077' },
      });
      const resD = await request(app).post('/api/predict').send({ ...baseHardware, game: 'Cyberpunk 2077' });
      expect(resD.status).toBe(200);
      expect(axios.post).toHaveBeenLastCalledWith(
        expect.stringContaining('/predict'),
        expect.objectContaining({ GameName: 'Cyberpunk 2077' }),
        expect.any(Object)
      );
    });

    test('POST /api/predict executes Model V2 for legacy hardware with legitimate project specs (i5-8400 + GTX 1660 SUPER)', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          predictedFps: 90.76,
          predicted_fps: 90.76,
          modelVersion: 'v2',
          gameCoverage: 'known',
          game: 'grandTheftAuto5',
        },
      });

      const payload = {
        CPU: 'Intel Core i5-8400 @ 2.80GHz',
        GPU: 'GeForce GTX 1660 SUPER',
        GameName: 'grandTheftAuto5',
        GameSetting_Ordinal: 4,
      };

      const res = await request(app).post('/api/predict').send(payload);
      expect(res.status).toBe(200);
      expect(res.body.modelVersion).toBe('v2');
      expect(res.body.predictedFps).toBe(90.76);
      expect(axios.post).toHaveBeenLastCalledWith(
        expect.stringContaining('/predict'),
        expect.objectContaining({
          CpuNumberOfCores: 6,
          CpuNumberOfThreads: 6,
          CpuCacheL3: 9,
          GpuNumberOfShadingUnits: 1408,
          GpuMemoryBus: 192,
          GpuNumberOfROPs: 48,
          GameName: 'grandTheftAuto5',
        }),
        expect.any(Object)
      );
    });

    test('POST /api/predict executes Model V2 for i5-9500 with verified project specs', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          predictedFps: 94.98,
          predicted_fps: 94.98,
          modelVersion: 'v2',
          gameCoverage: 'known',
          game: 'grandTheftAuto5',
        },
      });

      const payload = {
        CPU: 'Intel Core i5-9500 @ 3.00GHz',
        GPU: 'GeForce GTX 1660 SUPER',
        GameName: 'grandTheftAuto5',
        GameSetting_Ordinal: 4,
      };

      const res = await request(app).post('/api/predict').send(payload);
      expect(res.status).toBe(200);
      expect(res.body.modelVersion).toBe('v2');
      expect(res.body.predictedFps).toBe(94.98);
    });

    test('POST /api/predict returns 400 for legacy hardware with genuinely missing physical specs', async () => {
      const payload = {
        CPU: 'Intel Celeron 300A',
        GPU: 'GeForce GTX 1660 SUPER',
        GameName: 'grandTheftAuto5',
        GameSetting_Ordinal: 4,
      };

      const res = await request(app).post('/api/predict').send(payload);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('MODEL_V2_HARDWARE_DATA_INCOMPLETE');
      expect(res.body.missingFields.length).toBeGreaterThan(0);
    });
  });
});
