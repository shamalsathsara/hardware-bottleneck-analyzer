const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const CHECKPOINT_FILE = path.join(DATA_DIR, 'igdb_sync_checkpoint.json');

/**
 * Generates a unique sync run identifier.
 * @returns {string}
 */
function generateSyncRunId() {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  return `sync_${timestamp}_${randomSuffix}`;
}

/**
 * Creates a fresh initial sync state object.
 * 
 * @param {Object} [options]
 * @param {number} [options.limit=50]
 * @param {number} [options.batchSize=50]
 * @param {number} [options.offset=0]
 * @param {string} [options.mode='initial']
 * @param {boolean} [options.dryRun=false]
 * @returns {Object} Initial sync state
 */
function createInitialState(options = {}) {
  return {
    syncRunId: generateSyncRunId(),
    mode: options.mode || 'initial',
    dryRun: Boolean(options.dryRun),
    requestedLimit: typeof options.limit === 'number' ? options.limit : 50,
    batchSize: typeof options.batchSize === 'number' ? options.batchSize : 50,
    currentOffset: typeof options.offset === 'number' ? options.offset : 0,
    processedTotal: 0,
    createdTotal: 0,
    updatedTotal: 0,
    skippedTotal: 0,
    failedTotal: 0,
    batchesCompleted: 0,
    status: 'in_progress', // 'in_progress' | 'completed' | 'failed' | 'interrupted'
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    lastError: null,
  };
}

/**
 * Loads the existing checkpoint from disk.
 * @returns {Object|null}
 */
function loadCheckpoint() {
  try {
    if (!fs.existsSync(CHECKPOINT_FILE)) {
      return null;
    }
    const content = fs.readFileSync(CHECKPOINT_FILE, 'utf8');
    if (!content.trim()) return null;
    return JSON.parse(content);
  } catch (error) {
    console.warn(`[Checkpoint] Failed to read checkpoint file: ${error.message}`);
    return null;
  }
}

/**
 * Persists the synchronization checkpoint safely to disk.
 * Checkpoints must never contain credentials.
 * 
 * @param {Object} state 
 * @returns {boolean}
 */
function saveCheckpoint(state) {
  if (!state || typeof state !== 'object') return false;

  // Never persist secrets
  const sanitizedState = {
    syncRunId: state.syncRunId,
    mode: state.mode,
    dryRun: state.dryRun,
    requestedLimit: state.requestedLimit,
    batchSize: state.batchSize,
    currentOffset: state.currentOffset,
    processedTotal: state.processedTotal,
    createdTotal: state.createdTotal,
    updatedTotal: state.updatedTotal,
    skippedTotal: state.skippedTotal,
    failedTotal: state.failedTotal,
    batchesCompleted: state.batchesCompleted,
    status: state.status,
    startedAt: state.startedAt,
    updatedAt: new Date().toISOString(),
    completedAt: state.completedAt || null,
    lastError: state.lastError || null,
  };

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${CHECKPOINT_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(sanitizedState, null, 2), 'utf8');
    fs.renameSync(tempFile, CHECKPOINT_FILE);
    return true;
  } catch (error) {
    console.error(`[Checkpoint] Failed to save checkpoint file: ${error.message}`);
    return false;
  }
}

/**
 * Clears or deletes the saved checkpoint file.
 * @returns {boolean}
 */
function clearCheckpoint() {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      fs.unlinkSync(CHECKPOINT_FILE);
    }
    return true;
  } catch (error) {
    console.warn(`[Checkpoint] Failed to delete checkpoint file: ${error.message}`);
    return false;
  }
}

module.exports = {
  CHECKPOINT_FILE,
  generateSyncRunId,
  createInitialState,
  loadCheckpoint,
  saveCheckpoint,
  clearCheckpoint,
};
