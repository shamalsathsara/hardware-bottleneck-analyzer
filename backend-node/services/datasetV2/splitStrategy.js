/**
 * Project Aura V2 — Milestone V2.1.3E
 * Multi-Protocol Dataset Split Strategy Foundation
 *
 * Implements deterministic seeded splitting across 3 evaluation protocols:
 * 1. Protocol 1 (Grouped Source Split by sourceGroupId / benchmarkSessionId)
 * 2. Protocol 2 (Unseen Hardware Holdout by cpuHardwareId / gpuHardwareId)
 * 3. Protocol 3 (Unseen Game Holdout by gameSlug)
 */

/**
 * Deterministic pseudo-random number generator (Mulberry32).
 * @param {number} seed
 * @returns {Function} returns a float in [0, 1)
 */
function createSeededRandom(seed = 42) {
  let s = Math.abs(Math.floor(seed)) + 1;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic shuffle using Fisher-Yates and seeded PRNG.
 * @param {Array} array
 * @param {Function} rng
 * @returns {Array} new shuffled array
 */
function seededShuffle(array, rng) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Protocol 1: Grouped Source Split.
 * Groups observations by `sourceGroupId` (or `benchmarkSessionId` / `benchmarkId`)
 * so that whole source groups are allocated exclusively to Train, Val, or Test.
 *
 * @param {Array} rows - Dataset V2 rows
 * @param {Object} options
 * @param {number} options.seed
 * @param {number} options.trainRatio - default 0.70
 * @param {number} options.valRatio - default 0.15
 * @param {number} options.testRatio - default 0.15
 * @returns {Object} { train, val, test, metadata }
 */
function splitGroupedSource(rows = [], options = {}) {
  const seed = typeof options.seed === 'number' ? options.seed : 42;
  const trainRatio = options.trainRatio || 0.70;
  const valRatio = options.valRatio || 0.15;
  const testRatio = options.testRatio || 0.15;
  const rng = createSeededRandom(seed);

  if (!rows || rows.length === 0) {
    return {
      train: [],
      val: [],
      test: [],
      metadata: {
        protocol: 'grouped_source',
        seed,
        ratios: { train: trainRatio, val: valRatio, test: testRatio },
        counts: { total: 0, train: 0, val: 0, test: 0 },
        uniqueGroups: 0,
      },
    };
  }

  // 1. Group rows by sourceGroupId (fallback to benchmarkSessionId or benchmarkId)
  const groupMap = new Map();
  rows.forEach((row) => {
    const groupId = row.audit?.sourceGroupId || row.audit?.benchmarkSessionId || row.audit?.benchmarkId || 'unassigned_group';
    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, []);
    }
    groupMap.get(groupId).push(row);
  });

  // 2. Deterministically shuffle group keys
  const groupKeys = Array.from(groupMap.keys());
  const shuffledKeys = seededShuffle(groupKeys, rng);

  // 3. Allocate groups by row counts
  const totalRows = rows.length;
  const trainTarget = Math.round(totalRows * trainRatio);
  const valTarget = Math.round(totalRows * valRatio);

  const train = [];
  const val = [];
  const test = [];

  for (const key of shuffledKeys) {
    const groupRows = groupMap.get(key);
    if (train.length + groupRows.length <= trainTarget || (train.length === 0 && val.length === 0 && test.length === 0)) {
      train.push(...groupRows);
    } else if (val.length + groupRows.length <= valTarget) {
      val.push(...groupRows);
    } else {
      test.push(...groupRows);
    }
  }

  // If test is empty because of coarse grouping, ensure test or train has expected assignment
  if (test.length === 0 && val.length > 0 && groupKeys.length >= 3) {
    const moved = val.pop();
    if (moved) test.push(moved);
  }

  return {
    train,
    val,
    test,
    metadata: {
      protocol: 'grouped_source',
      seed,
      ratios: { train: trainRatio, val: valRatio, test: testRatio },
      counts: { total: totalRows, train: train.length, val: val.length, test: test.length },
      uniqueGroups: groupKeys.length,
    },
  };
}

/**
 * Protocol 2: Unseen Hardware Holdout.
 * Holds out specified or deterministically selected CPU / GPU hardware IDs into the Test set.
 *
 * @param {Array} rows
 * @param {Object} options
 * @param {number} options.seed
 * @param {string[]} options.holdoutGpuIds
 * @param {string[]} options.holdoutCpuIds
 * @param {number} options.holdoutHardwareFraction - fraction of HW to hold out if not explicitly provided (default 0.15)
 * @returns {Object} { train, val, test, metadata }
 */
function splitUnseenHardwareHoldout(rows = [], options = {}) {
  const seed = typeof options.seed === 'number' ? options.seed : 42;
  const rng = createSeededRandom(seed);

  if (!rows || rows.length === 0) {
    return {
      train: [],
      val: [],
      test: [],
      metadata: {
        protocol: 'unseen_hardware_holdout',
        seed,
        counts: { total: 0, train: 0, val: 0, test: 0 },
        holdoutGpus: [],
        holdoutCpus: [],
      },
    };
  }

  let holdoutGpus = options.holdoutGpuIds || [];
  let holdoutCpus = options.holdoutCpuIds || [];

  if (holdoutGpus.length === 0 && holdoutCpus.length === 0) {
    // Collect all unique GPU IDs and hold out deterministically
    const allGpus = Array.from(new Set(rows.map((r) => r.audit?.gpuHardwareId).filter(Boolean)));
    const shuffledGpus = seededShuffle(allGpus, rng);
    const holdoutCount = Math.max(1, Math.floor(allGpus.length * (options.holdoutHardwareFraction || 0.15)));
    holdoutGpus = shuffledGpus.slice(0, holdoutCount);
  }

  const holdoutGpuSet = new Set(holdoutGpus);
  const holdoutCpuSet = new Set(holdoutCpus);

  const test = [];
  const nonTest = [];

  for (const row of rows) {
    if (holdoutGpuSet.has(row.audit?.gpuHardwareId) || holdoutCpuSet.has(row.audit?.cpuHardwareId)) {
      test.push(row);
    } else {
      nonTest.push(row);
    }
  }

  // Split remainder into Train (85%) and Val (15%)
  const train = [];
  const val = [];
  const nonTestShuffled = seededShuffle(nonTest, rng);
  const valTarget = Math.round(nonTestShuffled.length * 0.15);

  nonTestShuffled.forEach((row, idx) => {
    if (idx < valTarget) {
      val.push(row);
    } else {
      train.push(row);
    }
  });

  return {
    train,
    val,
    test,
    metadata: {
      protocol: 'unseen_hardware_holdout',
      seed,
      counts: { total: rows.length, train: train.length, val: val.length, test: test.length },
      holdoutGpus,
      holdoutCpus,
    },
  };
}

/**
 * Protocol 3: Unseen Game Holdout.
 * Holds out specified or deterministically selected game titles into the Test set.
 *
 * @param {Array} rows
 * @param {Object} options
 * @param {number} options.seed
 * @param {string[]} options.holdoutGameSlugs
 * @param {number} options.holdoutGameFraction - fraction of games to hold out (default 0.15)
 * @returns {Object} { train, val, test, metadata }
 */
function splitUnseenGameHoldout(rows = [], options = {}) {
  const seed = typeof options.seed === 'number' ? options.seed : 42;
  const rng = createSeededRandom(seed);

  if (!rows || rows.length === 0) {
    return {
      train: [],
      val: [],
      test: [],
      metadata: {
        protocol: 'unseen_game_holdout',
        seed,
        counts: { total: 0, train: 0, val: 0, test: 0 },
        holdoutGames: [],
      },
    };
  }

  let holdoutGames = options.holdoutGameSlugs || [];
  if (holdoutGames.length === 0) {
    const allGames = Array.from(new Set(rows.map((r) => r.audit?.gameSlug).filter(Boolean)));
    const shuffledGames = seededShuffle(allGames, rng);
    const holdoutCount = Math.max(1, Math.floor(allGames.length * (options.holdoutGameFraction || 0.15)));
    holdoutGames = shuffledGames.slice(0, holdoutCount);
  }

  const holdoutGameSet = new Set(holdoutGames);
  const test = [];
  const nonTest = [];

  for (const row of rows) {
    if (holdoutGameSet.has(row.audit?.gameSlug)) {
      test.push(row);
    } else {
      nonTest.push(row);
    }
  }

  const train = [];
  const val = [];
  const nonTestShuffled = seededShuffle(nonTest, rng);
  const valTarget = Math.round(nonTestShuffled.length * 0.15);

  nonTestShuffled.forEach((row, idx) => {
    if (idx < valTarget) {
      val.push(row);
    } else {
      train.push(row);
    }
  });

  return {
    train,
    val,
    test,
    metadata: {
      protocol: 'unseen_game_holdout',
      seed,
      counts: { total: rows.length, train: train.length, val: val.length, test: test.length },
      holdoutGames,
    },
  };
}

module.exports = {
  createSeededRandom,
  seededShuffle,
  splitGroupedSource,
  splitUnseenHardwareHoldout,
  splitUnseenGameHoldout,
};
