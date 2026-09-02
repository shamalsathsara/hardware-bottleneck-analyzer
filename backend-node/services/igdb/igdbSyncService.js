const Game = require('../../models/Game');
const { query } = require('./igdbClient');
const { mapIgdbGame, IGDB_PLATFORM_IDS } = require('./igdbMapper');
const {
  createInitialState,
  loadCheckpoint,
  saveCheckpoint,
  clearCheckpoint,
} = require('./igdbCheckpoint');

/**
 * Utility helper for async sleep.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
 * Supports multi-batch pagination, bounded memory, bulk operations, checkpoint/resume,
 * and rate-limit pacing.
 * 
 * @param {Object} [options]
 * @param {number} [options.limit=50] - Total games to synchronize
 * @param {number} [options.batchSize=50] - Games per batch / request (1-100)
 * @param {number} [options.offset=0] - Starting offset
 * @param {boolean} [options.dryRun=false] - If true, skips DB writes & checkpoint advancement
 * @param {boolean} [options.resume=false] - If true, resumes from saved checkpoint
 * @param {boolean} [options.fresh=false] - If true, resets existing checkpoint
 * @param {string} [options.mode='initial'] - 'initial' or 'incremental'
 * @param {number} [options.pacingMs=250] - Pause between batches for rate-limit safety
 * @param {Function} [options.onBatchComplete] - Progress callback (batchSummary, state) => {}
 * @param {Function} [options.shouldStop] - Interruption check function () => boolean
 * @returns {Promise<Object>} Final synchronization summary
 */
async function syncIgdbGames(options = {}) {
  const dryRun = Boolean(options.dryRun);
  const resume = Boolean(options.resume);
  const fresh = Boolean(options.fresh);
  const pacingMs = typeof options.pacingMs === 'number' ? options.pacingMs : 250;
  const onBatchComplete = typeof options.onBatchComplete === 'function' ? options.onBatchComplete : null;
  const shouldStop = typeof options.shouldStop === 'function' ? options.shouldStop : null;

  if (fresh && !dryRun) {
    clearCheckpoint();
  }

  // Determine starting state
  let state = null;
  if (resume && !dryRun) {
    const saved = loadCheckpoint();
    if (saved && saved.status !== 'completed') {
      state = saved;
      state.status = 'in_progress';
      state.lastError = null;
    }
  }

  if (!state) {
    const requestedLimit = typeof options.limit === 'number' ? options.limit : 50;
    const batchSize = Math.min(Math.max(1, typeof options.batchSize === 'number' ? options.batchSize : 50), 100);
    const startOffset = typeof options.offset === 'number' ? options.offset : 0;

    state = createInitialState({
      limit: requestedLimit,
      batchSize,
      offset: startOffset,
      mode: options.mode || 'initial',
      dryRun,
    });
  }

  const allDetails = [];
  const allErrors = [];

  try {
    while (state.processedTotal < state.requestedLimit) {
      // Check graceful stop flag before starting next batch
      if (shouldStop && shouldStop()) {
        state.status = 'interrupted';
        if (!dryRun) saveCheckpoint(state);
        break;
      }

      const remaining = state.requestedLimit - state.processedTotal;
      const currentBatchLimit = Math.min(state.batchSize, remaining);
      const currentOffset = state.currentOffset;

      const apicalypse = buildPcGamesQuery({ limit: currentBatchLimit, offset: currentOffset });
      const rawGames = await query('/games', apicalypse);

      if (!Array.isArray(rawGames) || rawGames.length === 0) {
        // End of external catalog reached
        break;
      }

      // Map and validate raw games in current batch
      const validMappedGames = [];
      const batchDetails = [];
      let batchSkipped = 0;
      let batchFailed = 0;

      for (const rawGame of rawGames) {
        try {
          const mappingResult = mapIgdbGame(rawGame);
          if (!mappingResult.isValid) {
            batchSkipped++;
            batchDetails.push({
              name: rawGame.name || 'Unknown',
              igdbId: rawGame.id,
              action: 'SKIPPED',
              reason: mappingResult.error,
            });
            continue;
          }
          validMappedGames.push(mappingResult.data);
        } catch (mapErr) {
          batchFailed++;
          const errMsg = `Mapping error for game ID ${rawGame?.id}: ${mapErr.message}`;
          allErrors.push(errMsg);
          batchDetails.push({
            name: rawGame?.name || 'Unknown',
            igdbId: rawGame?.id,
            action: 'FAILED',
            reason: mapErr.message,
          });
        }
      }

      // Bulk duplicate reconciliation against MongoDB for current batch
      let batchCreated = 0;
      let batchUpdated = 0;

      if (validMappedGames.length > 0) {
        const batchIgdbIds = validMappedGames.map((g) => g.externalIds.igdb).filter(Boolean);
        const batchSlugs = validMappedGames.map((g) => g.slug).filter(Boolean);

        // Single indexed lookup for all matching games in batch
        const existingDocs = await Game.find({
          $or: [
            { 'externalIds.igdb': { $in: batchIgdbIds } },
            { slug: { $in: batchSlugs } },
          ],
        }).lean();

        const byIgdbId = new Map();
        const bySlug = new Map();

        for (const doc of existingDocs) {
          if (doc.externalIds?.igdb) {
            byIgdbId.set(doc.externalIds.igdb, doc);
          }
          if (doc.slug) {
            bySlug.set(doc.slug, doc);
          }
        }

        const bulkOperations = [];
        const insertDocs = [];

        for (const mapped of validMappedGames) {
          const existing = byIgdbId.get(mapped.externalIds.igdb) || bySlug.get(mapped.slug);

          if (existing) {
            // Reconcile and update IGDB-owned fields only (Preserving manual requirements/SEO)
            const updateFields = {
              name: mapped.name,
              alternateNames: Array.from(new Set([...(existing.alternateNames || []), ...(mapped.alternateNames || [])])),
              genres: mapped.genres.length > 0 ? mapped.genres : existing.genres,
              platforms: Array.from(new Set([...(existing.platforms || []), ...(mapped.platforms || [])])),
              releaseDate: mapped.releaseDate || existing.releaseDate,
              releaseYear: mapped.releaseYear || existing.releaseYear,
              developer: mapped.developer || existing.developer,
              publisher: mapped.publisher || existing.publisher,
              thumbnailUrl: mapped.thumbnailUrl || existing.thumbnailUrl,
              'externalIds.igdb': mapped.externalIds.igdb,
              metadataSource: 'igdb',
              metadataLastSyncedAt: mapped.metadataLastSyncedAt,
            };

            bulkOperations.push({
              updateOne: {
                filter: { _id: existing._id },
                update: { $set: updateFields },
              },
            });

            batchUpdated++;
            batchDetails.push({
              name: mapped.name,
              slug: existing.slug,
              igdbId: mapped.externalIds.igdb,
              action: dryRun ? 'WOULD_UPDATE' : 'UPDATED',
              preservedRequirements: Boolean(existing.dataSource?.requirementsVerified),
            });
          } else {
            if (state.mode === 'incremental') {
              batchSkipped++;
              batchDetails.push({
                name: mapped.name,
                slug: mapped.slug,
                igdbId: mapped.externalIds.igdb,
                action: 'SKIPPED_INCREMENTAL',
              });
              continue;
            }

            insertDocs.push(mapped);
            batchCreated++;
            batchDetails.push({
              name: mapped.name,
              slug: mapped.slug,
              igdbId: mapped.externalIds.igdb,
              action: dryRun ? 'WOULD_CREATE' : 'CREATED',
            });
          }
        }

        // Execute MongoDB bulk operations if not dry run
        if (!dryRun) {
          if (insertDocs.length > 0) {
            await Game.insertMany(insertDocs, { ordered: false });
          }
          if (bulkOperations.length > 0) {
            await Game.bulkWrite(bulkOperations, { ordered: false });
          }
        }
      }

      // Update state strictly after batch has successfully completed
      state.processedTotal += rawGames.length;
      state.createdTotal += batchCreated;
      state.updatedTotal += batchUpdated;
      state.skippedTotal += batchSkipped;
      state.failedTotal += batchFailed;
      state.batchesCompleted++;
      state.currentOffset += rawGames.length;

      allDetails.push(...batchDetails);

      // Persist checkpoint after successful batch write
      if (!dryRun) {
        saveCheckpoint(state);
      }

      if (onBatchComplete) {
        onBatchComplete(
          {
            batchIndex: state.batchesCompleted,
            fetched: rawGames.length,
            created: batchCreated,
            updated: batchUpdated,
            skipped: batchSkipped,
            failed: batchFailed,
            offset: state.currentOffset,
          },
          state
        );
      }

      // Check graceful stop flag after batch write
      if (shouldStop && shouldStop()) {
        state.status = 'interrupted';
        if (!dryRun) saveCheckpoint(state);
        break;
      }

      // Rate limit safety pacing between batches
      if (state.processedTotal < state.requestedLimit && rawGames.length === currentBatchLimit) {
        await sleep(pacingMs);
      }
    }

    if (state.status !== 'interrupted') {
      state.status = 'completed';
      state.completedAt = new Date().toISOString();
      if (!dryRun) {
        saveCheckpoint(state);
      }
    }

    return {
      success: true,
      syncRunId: state.syncRunId,
      status: state.status,
      dryRun: state.dryRun,
      mode: state.mode,
      requestedLimit: state.requestedLimit,
      batchSize: state.batchSize,
      currentOffset: state.currentOffset,
      fetched: state.processedTotal,
      mapped: state.createdTotal + state.updatedTotal,
      created: state.createdTotal,
      updated: state.updatedTotal,
      skipped: state.skippedTotal,
      failed: state.failedTotal,
      batchesCompleted: state.batchesCompleted,
      details: allDetails,
      errors: allErrors,
      startedAt: state.startedAt,
      completedAt: state.completedAt,
    };
  } catch (fatalError) {
    state.status = 'failed';
    state.lastError = fatalError.message;
    allErrors.push(fatalError.message);

    if (!dryRun) {
      saveCheckpoint(state);
    }

    return {
      success: false,
      syncRunId: state.syncRunId,
      status: 'failed',
      dryRun: state.dryRun,
      mode: state.mode,
      requestedLimit: state.requestedLimit,
      batchSize: state.batchSize,
      currentOffset: state.currentOffset,
      fetched: state.processedTotal,
      mapped: state.createdTotal + state.updatedTotal,
      created: state.createdTotal,
      updated: state.updatedTotal,
      skipped: state.skippedTotal,
      failed: state.failedTotal,
      batchesCompleted: state.batchesCompleted,
      details: allDetails,
      errors: allErrors,
      startedAt: state.startedAt,
      completedAt: null,
      lastError: fatalError.message,
    };
  }
}

module.exports = {
  syncIgdbGames,
  buildPcGamesQuery,
};
