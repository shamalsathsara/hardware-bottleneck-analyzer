const Game = require('../../models/Game');
const { query } = require('./igdbClient');
const { mapIgdbGame, IGDB_PLATFORM_IDS } = require('./igdbMapper');

/**
 * Builds the Apicalypse query string for fetching PC games from IGDB.
 * 
 * @param {Object} params
 * @param {number} params.limit
 * @param {number} params.offset
 * @returns {string}
 */
function buildPcGamesQuery({ limit = 50, offset = 0 } = {}) {
  // Platform 6: Windows PC
  // Sort by rating_count desc to prioritize major, well-established PC games
  return `
    fields id, name, slug, alternative_names.name, first_release_date, genres.name, platforms.name, cover.image_id, cover.url, involved_companies.developer, involved_companies.publisher, involved_companies.company.name;
    where platforms = (${IGDB_PLATFORM_IDS.WINDOWS}) & rating_count != null;
    sort rating_count desc;
    limit ${Math.min(Math.max(1, limit), 100)};
    offset ${Math.max(0, offset)};
  `.trim();
}

/**
 * Synchronizes PC games from IGDB into Project Aura's MongoDB Game catalog.
 * Supports dry-run execution, duplicate reconciliation, and manual field preservation.
 * 
 * @param {Object} [options]
 * @param {number} [options.limit=50] - Number of games to fetch (1-100)
 * @param {number} [options.offset=0] - Offset for pagination
 * @param {boolean} [options.dryRun=false] - If true, performs all mapping/diffing without DB writes
 * @param {string} [options.mode='initial'] - 'initial' (import all) or 'incremental' (update existing)
 * @returns {Promise<Object>} Sync execution summary
 */
async function syncIgdbGames(options = {}) {
  const limit = typeof options.limit === 'number' ? options.limit : 50;
  const offset = typeof options.offset === 'number' ? options.offset : 0;
  const dryRun = Boolean(options.dryRun);
  const mode = options.mode || 'initial';

  const summary = {
    success: false,
    dryRun,
    mode,
    fetched: 0,
    mapped: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    details: [],
    errors: [],
  };

  try {
    const apicalypse = buildPcGamesQuery({ limit, offset });
    const rawGames = await query('/games', apicalypse);

    if (!Array.isArray(rawGames)) {
      throw new Error(`Unexpected non-array response from IGDB: ${typeof rawGames}`);
    }

    summary.fetched = rawGames.length;

    for (const rawGame of rawGames) {
      try {
        const mappingResult = mapIgdbGame(rawGame);

        if (!mappingResult.isValid) {
          summary.skipped++;
          summary.details.push({
            name: rawGame.name || 'Unknown',
            igdbId: rawGame.id,
            action: 'SKIPPED',
            reason: mappingResult.error,
          });
          continue;
        }

        summary.mapped++;
        const mapped = mappingResult.data;

        // Step 1: Duplicate reconciliation by externalIds.igdb
        let existingGame = await Game.findOne({ 'externalIds.igdb': mapped.externalIds.igdb });

        // Step 2: Fallback reconciliation by exact slug
        if (!existingGame) {
          existingGame = await Game.findOne({ slug: mapped.slug });
        }

        if (existingGame) {
          // Merge metadata safely preserving manual / Project-Aura-owned fields
          const updateFields = {
            name: mapped.name,
            alternateNames: Array.from(new Set([...(existingGame.alternateNames || []), ...(mapped.alternateNames || [])])),
            genres: mapped.genres.length > 0 ? mapped.genres : existingGame.genres,
            platforms: Array.from(new Set([...(existingGame.platforms || []), ...(mapped.platforms || [])])),
            releaseDate: mapped.releaseDate || existingGame.releaseDate,
            releaseYear: mapped.releaseYear || existingGame.releaseYear,
            developer: mapped.developer || existingGame.developer,
            publisher: mapped.publisher || existingGame.publisher,
            thumbnailUrl: mapped.thumbnailUrl || existingGame.thumbnailUrl,
            'externalIds.igdb': mapped.externalIds.igdb,
            metadataSource: 'igdb',
            metadataLastSyncedAt: mapped.metadataLastSyncedAt,
          };

          // DO NOT overwrite verified requirements or SEO if already curated
          if (!dryRun) {
            await Game.updateOne({ _id: existingGame._id }, { $set: updateFields });
          }

          summary.updated++;
          summary.details.push({
            name: mapped.name,
            slug: existingGame.slug,
            igdbId: mapped.externalIds.igdb,
            action: dryRun ? 'WOULD_UPDATE' : 'UPDATED',
            preservedRequirements: Boolean(existingGame.dataSource?.requirementsVerified),
          });
        } else {
          // New game import
          if (mode === 'incremental') {
            // Incremental sync only updates existing linked records
            summary.skipped++;
            summary.details.push({
              name: mapped.name,
              slug: mapped.slug,
              igdbId: mapped.externalIds.igdb,
              action: 'SKIPPED_INCREMENTAL',
            });
            continue;
          }

          if (!dryRun) {
            await Game.create(mapped);
          }

          summary.created++;
          summary.details.push({
            name: mapped.name,
            slug: mapped.slug,
            igdbId: mapped.externalIds.igdb,
            action: dryRun ? 'WOULD_CREATE' : 'CREATED',
          });
        }
      } catch (itemError) {
        summary.failed++;
        const errMsg = `Error syncing game ID ${rawGame?.id || 'unknown'} (${rawGame?.name || 'unknown'}): ${itemError.message}`;
        summary.errors.push(errMsg);
        summary.details.push({
          name: rawGame?.name || 'Unknown',
          igdbId: rawGame?.id,
          action: 'FAILED',
          reason: itemError.message,
        });
      }
    }

    summary.success = true;
    return summary;
  } catch (error) {
    summary.errors.push(error.message);
    throw error;
  }
}

module.exports = {
  syncIgdbGames,
  buildPcGamesQuery,
};
