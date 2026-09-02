const axios = require('axios');
const mongoose = require('mongoose');

// Mock axios for all external IGDB / Twitch HTTP requests
jest.mock('axios');

const { getAccessToken, clearTokenCache } = require('../services/igdb/igdbAuth');
const { query } = require('../services/igdb/igdbClient');
const { mapIgdbGame } = require('../services/igdb/igdbMapper');
const { syncIgdbGames } = require('../services/igdb/igdbSyncService');
const {
  loadCheckpoint,
  saveCheckpoint,
  clearCheckpoint,
} = require('../services/igdb/igdbCheckpoint');
const Game = require('../models/Game');

describe('Production-Ready Large IGDB Catalog Sync Test Suite', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    clearTokenCache();
    clearCheckpoint();

    process.env = {
      ...originalEnv,
      IGDB_CLIENT_ID: 'mock_client_id',
      IGDB_CLIENT_SECRET: 'mock_client_secret',
    };

    // Default: automatically return valid OAuth token for Twitch URL, empty array for IGDB
    axios.post.mockImplementation((url) => {
      if (url && url.includes('twitch.tv')) {
        return Promise.resolve({ data: { access_token: 'fake_test_token', expires_in: 3600 } });
      }
      return Promise.resolve({ data: [] });
    });
  });

  afterAll(() => {
    process.env = originalEnv;
    clearCheckpoint();
  });

  // --------------------------------------------------------------------------
  // TEST 1: IGDB Data Mapping
  // --------------------------------------------------------------------------
  describe('1. IGDB Data Mapping', () => {
    it('should map a complete raw IGDB record to normalized Project Aura Game structure', () => {
      const rawIgdbGame = {
        id: 1942,
        name: 'The Witcher 3: Wild Hunt',
        slug: 'the-witcher-3-wild-hunt',
        alternative_names: [{ id: 10, name: 'Witcher 3' }],
        first_release_date: 1431993600,
        genres: [{ id: 12, name: 'RPG' }],
        platforms: [{ id: 6, name: 'PC (Microsoft Windows)' }],
        cover: { id: 99, image_id: 'co1r7f' },
        involved_companies: [
          { developer: true, publisher: false, company: { name: 'CD Projekt Red' } },
        ],
      };

      const result = mapIgdbGame(rawIgdbGame);
      expect(result.isValid).toBe(true);
      expect(result.data.name).toBe('The Witcher 3: Wild Hunt');
      expect(result.data.externalIds.igdb).toBe(1942);
      expect(result.data.thumbnailUrl).toBe('https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7f.jpg');
    });
  });

  // --------------------------------------------------------------------------
  // TEST 2: Missing Optional Fields
  // --------------------------------------------------------------------------
  describe('2. Missing Optional Fields', () => {
    it('should map minimal game without crashing', () => {
      const minimal = { id: 500, name: 'Minimal PC Game', slug: 'minimal-pc-game' };
      const result = mapIgdbGame(minimal);
      expect(result.isValid).toBe(true);
      expect(result.data.developer).toBeNull();
      expect(result.data.thumbnailUrl).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // TEST 3: Validation Layer
  // --------------------------------------------------------------------------
  describe('3. Validation Layer', () => {
    it('should reject games missing ID or name', () => {
      expect(mapIgdbGame({ name: 'No ID' }).isValid).toBe(false);
      expect(mapIgdbGame({ id: 10, name: '' }).isValid).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // TEST 4: Multi-Batch Pagination & Total Limit Handling
  // --------------------------------------------------------------------------
  describe('4. Multi-Batch Synchronization', () => {
    it('should fetch and process games in multiple batches according to batchSize and total limit', async () => {
      let callCount = 0;
      axios.post.mockImplementation((url) => {
        if (url && url.includes('twitch.tv')) {
          return Promise.resolve({ data: { access_token: 'fake_test_token', expires_in: 3600 } });
        }
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: [
              { id: 1, name: 'Batch 1 Game A', slug: 'b1-game-a' },
              { id: 2, name: 'Batch 1 Game B', slug: 'b1-game-b' },
            ],
          });
        }
        return Promise.resolve({
          data: [
            { id: 3, name: 'Batch 2 Game C', slug: 'b2-game-c' },
            { id: 4, name: 'Batch 2 Game D', slug: 'b2-game-d' },
          ],
        });
      });

      jest.spyOn(Game, 'find').mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      const insertManySpy = jest.spyOn(Game, 'insertMany').mockResolvedValue([]);
      const bulkWriteSpy = jest.spyOn(Game, 'bulkWrite').mockResolvedValue({});

      const batchLogs = [];
      const result = await syncIgdbGames({
        limit: 4,
        batchSize: 2,
        pacingMs: 1,
        dryRun: false,
        onBatchComplete: (b) => batchLogs.push(b.batchIndex),
      });

      expect(result.fetched).toBe(4);
      expect(result.created).toBe(4);
      expect(result.batchesCompleted).toBe(2);
      expect(batchLogs).toEqual([1, 2]);

      insertManySpy.mockRestore();
      bulkWriteSpy.mockRestore();
      Game.find.mockRestore();
    });
  });

  // --------------------------------------------------------------------------
  // TEST 5: Checkpoint Advances ONLY After Successful Batch
  // --------------------------------------------------------------------------
  describe('5. Checkpoint Lifecycle', () => {
    it('should save checkpoint with updated offset after each successful batch', async () => {
      axios.post.mockImplementation((url) => {
        if (url && url.includes('twitch.tv')) {
          return Promise.resolve({ data: { access_token: 'fake_test_token', expires_in: 3600 } });
        }
        return Promise.resolve({
          data: [{ id: 101, name: 'Game 101', slug: 'game-101' }],
        });
      });

      jest.spyOn(Game, 'find').mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      jest.spyOn(Game, 'insertMany').mockResolvedValue([]);

      const result = await syncIgdbGames({ limit: 1, batchSize: 1, dryRun: false });

      expect(result.success).toBe(true);
      const saved = loadCheckpoint();
      expect(saved).not.toBeNull();
      expect(saved.currentOffset).toBe(1);
      expect(saved.batchesCompleted).toBe(1);
      expect(saved.status).toBe('completed');

      Game.find.mockRestore();
      Game.insertMany.mockRestore();
    });

    it('should NOT advance checkpoint if batch write fails', async () => {
      axios.post.mockImplementation((url) => {
        if (url && url.includes('twitch.tv')) {
          return Promise.resolve({ data: { access_token: 'fake_test_token', expires_in: 3600 } });
        }
        return Promise.resolve({
          data: [{ id: 101, name: 'Game 101', slug: 'game-101' }],
        });
      });

      jest.spyOn(Game, 'find').mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      jest.spyOn(Game, 'insertMany').mockRejectedValueOnce(new Error('MongoDB write error'));

      const result = await syncIgdbGames({ limit: 1, batchSize: 1, dryRun: false });

      expect(result.success).toBe(false);
      const saved = loadCheckpoint();
      expect(saved.status).toBe('failed');
      expect(saved.currentOffset).toBe(0); // Offset was not advanced

      Game.find.mockRestore();
      Game.insertMany.mockRestore();
    });
  });

  // --------------------------------------------------------------------------
  // TEST 6: Resume Starts From Exact Checkpoint Position
  // --------------------------------------------------------------------------
  describe('6. Checkpoint Resume', () => {
    it('should resume from saved checkpoint offset', async () => {
      saveCheckpoint({
        syncRunId: 'sync_test_resume',
        mode: 'initial',
        dryRun: false,
        requestedLimit: 4,
        batchSize: 2,
        currentOffset: 2,
        processedTotal: 2,
        createdTotal: 2,
        updatedTotal: 0,
        skippedTotal: 0,
        failedTotal: 0,
        batchesCompleted: 1,
        status: 'interrupted',
        startedAt: new Date().toISOString(),
      });

      axios.post.mockImplementation((url) => {
        if (url && url.includes('twitch.tv')) {
          return Promise.resolve({ data: { access_token: 'fake_test_token', expires_in: 3600 } });
        }
        return Promise.resolve({
          data: [
            { id: 3, name: 'Resumed Game 3', slug: 'resumed-game-3' },
            { id: 4, name: 'Resumed Game 4', slug: 'resumed-game-4' },
          ],
        });
      });

      jest.spyOn(Game, 'find').mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      jest.spyOn(Game, 'insertMany').mockResolvedValue([]);

      const result = await syncIgdbGames({ resume: true, dryRun: false, pacingMs: 1 });

      expect(result.syncRunId).toBe('sync_test_resume');
      expect(result.fetched).toBe(4);
      expect(result.created).toBe(4);
      expect(result.currentOffset).toBe(4);
      expect(result.batchesCompleted).toBe(2);

      Game.find.mockRestore();
      Game.insertMany.mockRestore();
    });
  });

  // --------------------------------------------------------------------------
  // TEST 7: Fresh Sync Option
  // --------------------------------------------------------------------------
  describe('7. Fresh Sync Option', () => {
    it('should clear old checkpoint and start from offset 0 when fresh=true', async () => {
      saveCheckpoint({
        syncRunId: 'old_run',
        currentOffset: 50,
        status: 'interrupted',
      });

      axios.post.mockImplementation((url) => {
        if (url && url.includes('twitch.tv')) {
          return Promise.resolve({ data: { access_token: 'fake_test_token', expires_in: 3600 } });
        }
        return Promise.resolve({
          data: [{ id: 1, name: 'Fresh Game', slug: 'fresh-game' }],
        });
      });

      jest.spyOn(Game, 'find').mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      jest.spyOn(Game, 'insertMany').mockResolvedValue([]);

      const result = await syncIgdbGames({ limit: 1, batchSize: 1, fresh: true, dryRun: false });

      expect(result.syncRunId).not.toBe('old_run');
      expect(result.currentOffset).toBe(1);

      Game.find.mockRestore();
      Game.insertMany.mockRestore();
    });
  });

  // --------------------------------------------------------------------------
  // TEST 8: Field Ownership & Manual Data Protection
  // --------------------------------------------------------------------------
  describe('8. Field Ownership & Manual Data Protection', () => {
    it('should never include requirements, performanceProfile, or SEO in bulk update payloads', async () => {
      axios.post.mockImplementation((url) => {
        if (url && url.includes('twitch.tv')) {
          return Promise.resolve({ data: { access_token: 'fake_test_token', expires_in: 3600 } });
        }
        return Promise.resolve({
          data: [{ id: 1877, name: 'Cyberpunk 2077 Updated', slug: 'cyberpunk-2077' }],
        });
      });

      const existingCp = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Cyberpunk 2077',
        slug: 'cyberpunk-2077',
        externalIds: { igdb: 1877 },
        requirements: { minimum: { cpu: { name: 'Intel i7-6700' } } },
        performanceProfile: { rayTracingSupported: true },
        seo: { title: 'Custom SEO' },
        dataSource: { requirementsVerified: true },
      };

      jest.spyOn(Game, 'find').mockReturnValue({ lean: jest.fn().mockResolvedValue([existingCp]) });
      const bulkWriteSpy = jest.spyOn(Game, 'bulkWrite').mockResolvedValue({});

      await syncIgdbGames({ limit: 1, batchSize: 1, dryRun: false });

      expect(bulkWriteSpy).toHaveBeenCalledTimes(1);
      const updateOp = bulkWriteSpy.mock.calls[0][0][0].updateOne.update.$set;

      expect(updateOp).toHaveProperty('name', 'Cyberpunk 2077 Updated');
      expect(updateOp).not.toHaveProperty('requirements');
      expect(updateOp).not.toHaveProperty('performanceProfile');
      expect(updateOp).not.toHaveProperty('seo');
      expect(updateOp).not.toHaveProperty('dataSource');

      bulkWriteSpy.mockRestore();
      Game.find.mockRestore();
    });
  });

  // --------------------------------------------------------------------------
  // TEST 9: Dry Run Safety
  // --------------------------------------------------------------------------
  describe('9. Dry Run Safety', () => {
    it('should simulate operations without writing to DB or saving persistent checkpoint', async () => {
      axios.post.mockImplementation((url) => {
        if (url && url.includes('twitch.tv')) {
          return Promise.resolve({ data: { access_token: 'fake_test_token', expires_in: 3600 } });
        }
        return Promise.resolve({
          data: [{ id: 999, name: 'Dry Run Game', slug: 'dry-run-game' }],
        });
      });

      jest.spyOn(Game, 'find').mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      const insertManySpy = jest.spyOn(Game, 'insertMany');
      const bulkWriteSpy = jest.spyOn(Game, 'bulkWrite');

      const result = await syncIgdbGames({ limit: 1, batchSize: 1, dryRun: true });

      expect(result.dryRun).toBe(true);
      expect(result.created).toBe(1);
      expect(insertManySpy).not.toHaveBeenCalled();
      expect(bulkWriteSpy).not.toHaveBeenCalled();
      expect(loadCheckpoint()).toBeNull();

      insertManySpy.mockRestore();
      bulkWriteSpy.mockRestore();
      Game.find.mockRestore();
    });
  });

  // --------------------------------------------------------------------------
  // TEST 10: Graceful Interruption
  // --------------------------------------------------------------------------
  describe('10. Graceful Interruption', () => {
    it('should complete current batch and mark checkpoint as interrupted when shouldStop returns true', async () => {
      axios.post.mockImplementation((url) => {
        if (url && url.includes('twitch.tv')) {
          return Promise.resolve({ data: { access_token: 'fake_test_token', expires_in: 3600 } });
        }
        return Promise.resolve({
          data: [{ id: 1, name: 'Batch 1 Game', slug: 'b1-game' }],
        });
      });

      jest.spyOn(Game, 'find').mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      jest.spyOn(Game, 'insertMany').mockResolvedValue([]);

      let stopRequested = false;

      const result = await syncIgdbGames({
        limit: 10,
        batchSize: 1,
        dryRun: false,
        shouldStop: () => stopRequested,
        onBatchComplete: () => {
          stopRequested = true; // Request stop after batch 1 completes
        },
      });

      expect(result.status).toBe('interrupted');
      expect(result.batchesCompleted).toBe(1);

      const saved = loadCheckpoint();
      expect(saved.status).toBe('interrupted');
      expect(saved.currentOffset).toBe(1);

      Game.find.mockRestore();
      Game.insertMany.mockRestore();
    });
  });

  // --------------------------------------------------------------------------
  // TEST 11: Rate Limit & Network Resilience
  // --------------------------------------------------------------------------
  describe('11. Rate Limit & Network Resilience', () => {
    it('should handle 429 rate limit backoff and recover', async () => {
      let attempts = 0;
      axios.post.mockImplementation((url) => {
        if (url && url.includes('twitch.tv')) {
          return Promise.resolve({ data: { access_token: 'fake_test_token', expires_in: 3600 } });
        }
        attempts++;
        if (attempts === 1) {
          const err = new Error('Rate Limited');
          err.response = { status: 429, headers: { 'retry-after': '0' } };
          return Promise.reject(err);
        }
        return Promise.resolve({ data: [{ id: 1, name: '429 Recovered', slug: '429-recovered' }] });
      });

      const res = await query('/games', 'fields name; limit 1;');
      expect(res[0].name).toBe('429 Recovered');
    });

    it('should handle 503 transient error and recover with exponential backoff', async () => {
      let attempts = 0;
      axios.post.mockImplementation((url) => {
        if (url && url.includes('twitch.tv')) {
          return Promise.resolve({ data: { access_token: 'fake_test_token', expires_in: 3600 } });
        }
        attempts++;
        if (attempts === 1) {
          const err = new Error('Temporary Outage');
          err.response = { status: 503, data: 'Service Unavailable' };
          return Promise.reject(err);
        }
        return Promise.resolve({ data: [{ id: 2, name: '503 Recovered', slug: '503-recovered' }] });
      });

      const res = await query('/games', 'fields name; limit 1;');
      expect(res[0].name).toBe('503 Recovered');
    });
  });
});
