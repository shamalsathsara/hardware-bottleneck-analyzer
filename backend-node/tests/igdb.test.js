const axios = require('axios');
const mongoose = require('mongoose');

// Mock axios for all external IGDB / Twitch HTTP requests
jest.mock('axios');

const { getAccessToken, clearTokenCache, getTokenStatus, TWITCH_TOKEN_URL } = require('../services/igdb/igdbAuth');
const { query, IGDB_BASE_URL } = require('../services/igdb/igdbClient');
const { mapIgdbGame, normalizeSlug, formatCoverUrl, IGDB_PLATFORM_IDS } = require('../services/igdb/igdbMapper');
const { syncIgdbGames, buildPcGamesQuery } = require('../services/igdb/igdbSyncService');
const Game = require('../models/Game');

describe('IGDB Game Catalog Data Source Foundation Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    clearTokenCache();
    process.env = {
      ...originalEnv,
      IGDB_CLIENT_ID: 'mock_client_id',
      IGDB_CLIENT_SECRET: 'mock_client_secret',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // --------------------------------------------------------------------------
  // TEST 1: IGDB mapping works for complete game payload
  // --------------------------------------------------------------------------
  describe('1. IGDB Data Mapping', () => {
    it('should map a complete raw IGDB record to normalized Project Aura Game structure', () => {
      const rawIgdbGame = {
        id: 1942,
        name: 'The Witcher 3: Wild Hunt',
        slug: 'the-witcher-3-wild-hunt',
        alternative_names: [{ id: 10, name: 'Witcher 3' }, { id: 11, name: 'TW3' }],
        first_release_date: 1431993600, // 2015-05-19
        genres: [{ id: 12, name: 'RPG' }, { id: 14, name: 'Action' }],
        platforms: [{ id: 6, name: 'PC (Microsoft Windows)' }],
        cover: { id: 99, image_id: 'co1r7f' },
        involved_companies: [
          { developer: true, publisher: false, company: { name: 'CD Projekt Red' } },
          { developer: false, publisher: true, company: { name: 'CD Projekt' } },
        ],
      };

      const result = mapIgdbGame(rawIgdbGame);

      expect(result.isValid).toBe(true);
      expect(result.data.name).toBe('The Witcher 3: Wild Hunt');
      expect(result.data.slug).toBe('the-witcher-3-wild-hunt');
      expect(result.data.externalIds.igdb).toBe(1942);
      expect(result.data.releaseDate).toBe('2015-05-19');
      expect(result.data.releaseYear).toBe(2015);
      expect(result.data.developer).toBe('CD Projekt Red');
      expect(result.data.publisher).toBe('CD Projekt');
      expect(result.data.alternateNames).toEqual(['Witcher 3', 'TW3']);
      expect(result.data.genres).toEqual(['RPG', 'Action']);
      expect(result.data.platforms).toContain('PC');
      expect(result.data.thumbnailUrl).toBe('https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7f.jpg');
      expect(result.data.metadataSource).toBe('igdb');
      expect(result.data.dataQuality).toBe('metadata_only');
    });
  });

  // --------------------------------------------------------------------------
  // TEST 2: Missing optional fields do not crash mapper
  // --------------------------------------------------------------------------
  describe('2. Missing Optional Fields Handling', () => {
    it('should safely map games with missing cover, companies, genres, release date, and alt names', () => {
      const minimalGame = {
        id: 8888,
        name: 'Indie Survival PC Game',
        slug: 'indie-survival-pc-game',
      };

      const result = mapIgdbGame(minimalGame);

      expect(result.isValid).toBe(true);
      expect(result.data.name).toBe('Indie Survival PC Game');
      expect(result.data.slug).toBe('indie-survival-pc-game');
      expect(result.data.developer).toBeNull();
      expect(result.data.publisher).toBeNull();
      expect(result.data.releaseDate).toBeNull();
      expect(result.data.releaseYear).toBeNull();
      expect(result.data.thumbnailUrl).toBeNull();
      expect(result.data.alternateNames).toEqual([]);
      expect(result.data.genres).toEqual([]);
      expect(result.data.platforms).toEqual(['PC']);
    });
  });

  // --------------------------------------------------------------------------
  // TEST 3: Invalid games are rejected/skipped
  // --------------------------------------------------------------------------
  describe('3. Validation Layer', () => {
    it('should reject game payloads missing ID', () => {
      const invalid = { name: 'No ID Game', slug: 'no-id' };
      const result = mapIgdbGame(invalid);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid or missing IGDB ID');
    });

    it('should reject game payloads with empty name', () => {
      const invalid = { id: 123, name: '', slug: 'empty-name' };
      const result = mapIgdbGame(invalid);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('missing a valid title name');
    });

    it('should reject or handle malformed payloads', () => {
      expect(mapIgdbGame(null).isValid).toBe(false);
      expect(mapIgdbGame(undefined).isValid).toBe(false);
      expect(mapIgdbGame('not-an-object').isValid).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // TEST 4: Same IGDB ID cannot create duplicate records
  // --------------------------------------------------------------------------
  describe('4. IGDB ID Duplicate Reconciliation', () => {
    it('should match and update existing game if externalIds.igdb exists', async () => {
      const mockRawGames = [
        {
          id: 1942,
          name: 'The Witcher 3: Wild Hunt Updated',
          slug: 'the-witcher-3-wild-hunt',
          first_release_date: 1431993600,
        },
      ];

      axios.post.mockResolvedValueOnce({ data: { access_token: 'fake_token', expires_in: 3600 } });
      axios.mockResolvedValueOnce({ data: mockRawGames });

      const mockExistingGame = {
        _id: new mongoose.Types.ObjectId(),
        name: 'The Witcher 3: Wild Hunt',
        slug: 'the-witcher-3-wild-hunt',
        externalIds: { igdb: 1942 },
        alternateNames: ['TW3'],
      };

      jest.spyOn(Game, 'findOne').mockResolvedValueOnce(mockExistingGame);
      const updateOneSpy = jest.spyOn(Game, 'updateOne').mockResolvedValueOnce({ modifiedCount: 1 });
      const createSpy = jest.spyOn(Game, 'create').mockResolvedValueOnce({});

      const result = await syncIgdbGames({ limit: 1, dryRun: false });

      expect(result.fetched).toBe(1);
      expect(result.updated).toBe(1);
      expect(result.created).toBe(0);
      expect(updateOneSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).not.toHaveBeenCalled();

      updateOneSpy.mockRestore();
      createSpy.mockRestore();
    });
  });

  // --------------------------------------------------------------------------
  // TEST 5: Existing slug reconciliation works safely
  // --------------------------------------------------------------------------
  describe('5. Slug Reconciliation', () => {
    it('should match existing game by slug when externalIds.igdb is not yet linked', async () => {
      const mockRawGames = [
        {
          id: 3333,
          name: 'Cyberpunk 2077',
          slug: 'cyberpunk-2077',
          first_release_date: 1607558400,
        },
      ];

      axios.post.mockResolvedValueOnce({ data: { access_token: 'fake_token', expires_in: 3600 } });
      axios.mockResolvedValueOnce({ data: mockRawGames });

      const mockExistingGame = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Cyberpunk 2077',
        slug: 'cyberpunk-2077',
        externalIds: { igdb: null },
      };

      // 1st findOne by IGDB ID -> null, 2nd findOne by slug -> mockExistingGame
      jest.spyOn(Game, 'findOne')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockExistingGame);

      const updateOneSpy = jest.spyOn(Game, 'updateOne').mockResolvedValueOnce({ modifiedCount: 1 });

      const result = await syncIgdbGames({ limit: 1, dryRun: false });

      expect(result.updated).toBe(1);
      expect(result.created).toBe(0);
      expect(updateOneSpy).toHaveBeenCalledWith(
        { _id: mockExistingGame._id },
        expect.objectContaining({
          $set: expect.objectContaining({
            'externalIds.igdb': 3333,
            metadataSource: 'igdb',
          }),
        })
      );

      updateOneSpy.mockRestore();
    });
  });

  // --------------------------------------------------------------------------
  // TEST 6: Manually verified requirements survive metadata sync
  // --------------------------------------------------------------------------
  describe('6. Verified Requirements Preservation', () => {
    it('should never include requirements or verification flags in the update payload', async () => {
      const mockRawGames = [
        {
          id: 3333,
          name: 'Cyberpunk 2077',
          slug: 'cyberpunk-2077',
        },
      ];

      axios.post.mockResolvedValueOnce({ data: { access_token: 'fake_token', expires_in: 3600 } });
      axios.mockResolvedValueOnce({ data: mockRawGames });

      const mockExistingGame = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Cyberpunk 2077',
        slug: 'cyberpunk-2077',
        externalIds: { igdb: 3333 },
        requirements: {
          minimum: { cpu: { name: 'Intel Core i7-6700' }, ramGB: 12 },
        },
        dataSource: {
          requirementsSource: 'Official Developer Manual',
          requirementsVerified: true,
        },
      };

      jest.spyOn(Game, 'findOne').mockResolvedValueOnce(mockExistingGame);
      const updateOneSpy = jest.spyOn(Game, 'updateOne').mockResolvedValueOnce({ modifiedCount: 1 });

      await syncIgdbGames({ limit: 1, dryRun: false });

      expect(updateOneSpy).toHaveBeenCalled();
      const updateSet = updateOneSpy.mock.calls[0][1].$set;
      expect(updateSet).not.toHaveProperty('requirements');
      expect(updateSet).not.toHaveProperty('dataSource');
      expect(updateSet).not.toHaveProperty('dataQuality');

      updateOneSpy.mockRestore();
    });
  });

  // --------------------------------------------------------------------------
  // TEST 7: Performance profile survives metadata sync
  // --------------------------------------------------------------------------
  describe('7. Performance Profile Preservation', () => {
    it('should never overwrite performanceProfile during metadata sync', async () => {
      const mockRawGames = [{ id: 100, name: 'Test Game', slug: 'test-game' }];

      axios.post.mockResolvedValueOnce({ data: { access_token: 'fake_token', expires_in: 3600 } });
      axios.mockResolvedValueOnce({ data: mockRawGames });

      const mockExistingGame = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Game',
        slug: 'test-game',
        externalIds: { igdb: 100 },
        performanceProfile: { rayTracingSupported: true, dlssSupported: true },
      };

      jest.spyOn(Game, 'findOne').mockResolvedValueOnce(mockExistingGame);
      const updateOneSpy = jest.spyOn(Game, 'updateOne').mockResolvedValueOnce({ modifiedCount: 1 });

      await syncIgdbGames({ limit: 1, dryRun: false });

      const updateSet = updateOneSpy.mock.calls[0][1].$set;
      expect(updateSet).not.toHaveProperty('performanceProfile');

      updateOneSpy.mockRestore();
    });
  });

  // --------------------------------------------------------------------------
  // TEST 8: Existing SEO data survives when manually owned
  // --------------------------------------------------------------------------
  describe('8. SEO Preservation', () => {
    it('should never overwrite custom SEO title or description', async () => {
      const mockRawGames = [{ id: 100, name: 'Test Game', slug: 'test-game' }];

      axios.post.mockResolvedValueOnce({ data: { access_token: 'fake_token', expires_in: 3600 } });
      axios.mockResolvedValueOnce({ data: mockRawGames });

      const mockExistingGame = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Game',
        slug: 'test-game',
        externalIds: { igdb: 100 },
        seo: { title: 'Custom SEO Title', description: 'Custom Description' },
      };

      jest.spyOn(Game, 'findOne').mockResolvedValueOnce(mockExistingGame);
      const updateOneSpy = jest.spyOn(Game, 'updateOne').mockResolvedValueOnce({ modifiedCount: 1 });

      await syncIgdbGames({ limit: 1, dryRun: false });

      const updateSet = updateOneSpy.mock.calls[0][1].$set;
      expect(updateSet).not.toHaveProperty('seo');

      updateOneSpy.mockRestore();
    });
  });

  // --------------------------------------------------------------------------
  // TEST 9: IGDB authentication failure is handled safely
  // --------------------------------------------------------------------------
  describe('9. Authentication Failure Handling', () => {
    it('should handle OAuth rejection without crashing or leaking secrets', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          status: 403,
          data: { message: 'Invalid client credentials' },
        },
      });

      await expect(getAccessToken()).rejects.toThrow('IGDB OAuth Authentication Error (403)');
      expect(getTokenStatus().isValid).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // TEST 10: IGDB API 429 does not crash application
  // --------------------------------------------------------------------------
  describe('10. 429 Rate Limit Handling', () => {
    it('should back off and retry upon receiving 429 rate-limit response', async () => {
      axios.post.mockResolvedValueOnce({ data: { access_token: 'fake_token', expires_in: 3600 } });

      // First query call returns 429, second succeeds
      axios
        .mockRejectedValueOnce({
          response: {
            status: 429,
            headers: { 'retry-after': '0' },
          },
        })
        .mockResolvedValueOnce({ data: [{ id: 1, name: 'Rate Limited Game', slug: 'rate-limited' }] });

      const result = await query('/games', 'fields name; limit 1;');

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].name).toBe('Rate Limited Game');
    });
  });

  // --------------------------------------------------------------------------
  // TEST 11: IGDB API 5xx does not crash application
  // --------------------------------------------------------------------------
  describe('11. 5xx Server Error Transient Retry', () => {
    it('should retry transient 500/503 errors with backoff', async () => {
      axios.post.mockResolvedValueOnce({ data: { access_token: 'fake_token', expires_in: 3600 } });

      // First call returns 503, second call succeeds
      axios
        .mockRejectedValueOnce({
          response: {
            status: 503,
            data: 'Service Unavailable',
          },
        })
        .mockResolvedValueOnce({ data: [{ id: 2, name: 'Recovered Game', slug: 'recovered-game' }] });

      const result = await query('/games', 'fields name; limit 1;');

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].name).toBe('Recovered Game');
    });
  });

  // --------------------------------------------------------------------------
  // TEST 12: Import can run twice without duplicates (Idempotency)
  // --------------------------------------------------------------------------
  describe('12. Idempotency Test', () => {
    it('should produce 0 created records on second run when records already exist', async () => {
      const mockRawGames = [
        { id: 10, name: 'Game A', slug: 'game-a' },
        { id: 20, name: 'Game B', slug: 'game-b' },
      ];

      axios.post.mockResolvedValue({ data: { access_token: 'fake_token', expires_in: 3600 } });
      axios.mockResolvedValue({ data: mockRawGames });

      // Simulate second run where both games are found by externalIds.igdb
      jest.spyOn(Game, 'findOne')
        .mockResolvedValueOnce({ _id: '1', slug: 'game-a', externalIds: { igdb: 10 } })
        .mockResolvedValueOnce({ _id: '2', slug: 'game-b', externalIds: { igdb: 20 } });

      const updateOneSpy = jest.spyOn(Game, 'updateOne').mockResolvedValue({ modifiedCount: 1 });
      const createSpy = jest.spyOn(Game, 'create');

      const result = await syncIgdbGames({ limit: 2, dryRun: false });

      expect(result.fetched).toBe(2);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(2);
      expect(createSpy).not.toHaveBeenCalled();

      updateOneSpy.mockRestore();
    });
  });
});
