const fs = require('fs');
const path = require('path');
const csvtojson = require('csvtojson');
const { resolveCanonicalGame, resolveCanonicalCpu, resolveCanonicalGpu } = require('./canonicalResolver');

/**
 * Normalizes boolean strings strictly:
 * true / 1 / yes / y -> true
 * false / 0 / no / n -> false
 * empty / null / undefined -> null
 * any other string -> throws Error
 */
function parseBoolean(val, fieldName) {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'boolean') return val;
  const str = String(val).trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(str)) return true;
  if (['false', '0', 'no', 'n'].includes(str)) return false;
  throw new Error(`INVALID_BOOLEAN: Field "${fieldName}" has invalid boolean value "${val}". Must be true/false/yes/no/1/0.`);
}

/**
 * Parses numeric fields safely. Empty strings become null (NOT 0).
 */
function parseNumber(val, fieldName, isRequired = false) {
  if (val === undefined || val === null || val === '') {
    if (isRequired) {
      throw new Error(`MISSING_FIELD: Required numeric field "${fieldName}" is missing or empty.`);
    }
    return null;
  }
  const num = Number(val);
  if (!Number.isFinite(num)) {
    throw new Error(`INVALID_NUMBER: Field "${fieldName}" value "${val}" is not a valid finite number.`);
  }
  return num;
}

/**
 * Validates and parses ISO-8601 timestamps.
 */
function parseDate(val, fieldName) {
  if (val === undefined || val === null || val === '') return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    throw new Error(`INVALID_DATE: Field "${fieldName}" value "${val}" is not a valid ISO date.`);
  }
  return d;
}

/**
 * Generates a deterministic record identifier from session and row index.
 */
function generateDeterministicRecordId(sessionId, rowIndex) {
  return `pa_${sessionId}_row${rowIndex + 1}`;
}

/**
 * Parses a CSV or JSON benchmark file and returns array of normalized raw rows.
 *
 * @param {string} filePath Absolute or relative path to .csv or .json file
 * @returns {Promise<{ rows: Array<Object>, fileExtension: string }>}
 */
async function parseBenchmarkFile(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    const err = new Error('File path is required.');
    err.code = 'MISSING_FILE_ARGUMENT';
    throw err;
  }

  const resolvedPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolvedPath)) {
    const err = new Error(`File not found at path: "${resolvedPath}".`);
    err.code = 'FILE_NOT_FOUND';
    throw err;
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  if (ext !== '.csv' && ext !== '.json') {
    const err = new Error(`Unsupported file extension: "${ext}". Must be .csv or .json.`);
    err.code = 'UNSUPPORTED_EXTENSION';
    throw err;
  }

  let rawRows = [];

  if (ext === '.csv') {
    const content = fs.readFileSync(resolvedPath, 'utf8');
    if (!content.trim()) {
      return { rows: [], fileExtension: '.csv' };
    }

    // Inspect headers
    const firstLine = content.split(/\r?\n/).find(l => l.trim().length > 0);
    if (firstLine) {
      const headers = firstLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      const lowerHeaders = headers.map(h => h.toLowerCase());
      
      const hasGame = lowerHeaders.some(h => ['game', 'gameslug', 'gameid', 'gamename'].includes(h));
      const hasCpu = lowerHeaders.some(h => ['cpu', 'cpuhardwareid', 'cpuname'].includes(h));
      const hasGpu = lowerHeaders.some(h => ['gpu', 'gpuhardwareid', 'gpuname'].includes(h));
      const hasFps = lowerHeaders.some(h => ['avgfps', 'fps', 'performance.avgfps'].includes(h));

      if (!hasGame || !hasCpu || !hasGpu || !hasFps) {
        const missing = [];
        if (!hasGame) missing.push('game');
        if (!hasCpu) missing.push('cpu');
        if (!hasGpu) missing.push('gpu');
        if (!hasFps) missing.push('avgFps');
        const err = new Error(`Missing required CSV headers: ${missing.join(', ')}.`);
        err.code = 'MISSING_REQUIRED_HEADERS';
        throw err;
      }
    }

    rawRows = await csvtojson({
      trim: true,
      checkType: false, // keep as strings so we control strict normalization
    }).fromString(content);
  } else if (ext === '.json') {
    const content = fs.readFileSync(resolvedPath, 'utf8');
    if (!content.trim()) {
      return { rows: [], fileExtension: '.json' };
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      const err = new Error(`Malformed JSON in file "${resolvedPath}": ${e.message}`);
      err.code = 'INVALID_JSON';
      throw err;
    }

    if (Array.isArray(parsed)) {
      rawRows = parsed;
    } else if (parsed && typeof parsed === 'object') {
      rawRows = [parsed];
    } else {
      const err = new Error('JSON benchmark file must contain an array of objects or a single object.');
      err.code = 'INVALID_JSON_STRUCTURE';
      throw err;
    }
  }

  return {
    rows: rawRows,
    fileExtension: ext,
  };
}

/**
 * Transforms a single raw input row into a normalized benchmark payload,
 * resolving Game, CPU, and GPU against catalog collections.
 *
 * @param {Object} row Raw key-value row from CSV/JSON
 * @param {number} rowIndex 0-indexed row number
 * @param {Object} context Import session context { benchmarkSessionId, sessionTime }
 * @returns {Promise<{ valid: boolean, payload: Object|null, error: { code: string, message: string }|null }>}
 */
async function normalizeAndResolveRow(row, rowIndex, context = {}) {
  try {
    // 1. Resolve Game
    const rawGame = row.game || row.gameSlug || row.gameId || row.gameName;
    const gameRes = await resolveCanonicalGame(rawGame);
    if (gameRes.errorCode) {
      return {
        valid: false,
        payload: null,
        error: { code: gameRes.errorCode, message: gameRes.reason },
      };
    }

    // 2. Resolve CPU
    const rawCpu = row.cpu || row.cpuHardwareId || row.cpuName;
    const cpuRes = await resolveCanonicalCpu(rawCpu);
    if (cpuRes.errorCode) {
      return {
        valid: false,
        payload: null,
        error: { code: cpuRes.errorCode, message: cpuRes.reason },
      };
    }

    // 3. Resolve GPU
    const rawGpu = row.gpu || row.gpuHardwareId || row.gpuName;
    const gpuRes = await resolveCanonicalGpu(rawGpu);
    if (gpuRes.errorCode) {
      return {
        valid: false,
        payload: null,
        error: { code: gpuRes.errorCode, message: gpuRes.reason },
      };
    }

    // 4. Display Parsing
    let width = parseNumber(row.width || row.resolutionWidth, 'width');
    let height = parseNumber(row.height || row.resolutionHeight, 'height');

    // Handle "1920x1080" format if resolution is provided as a single string
    if ((!width || !height) && (row.resolution || row.display)) {
      const resStr = String(row.resolution || row.display).trim();
      const parts = resStr.split('x');
      if (parts.length === 2) {
        width = parseInt(parts[0], 10);
        height = parseInt(parts[1], 10);
      }
    }

    if (!width || !height) {
      return {
        valid: false,
        payload: null,
        error: { code: 'INVALID_RESOLUTION', message: 'Both width and height (or resolution "WxH") are required.' },
      };
    }

    // 5. Preset Parsing
    const rawPreset = row.preset || row.rawPreset || row.graphicsPreset || 'unknown';
    const normalizedPreset = String(rawPreset).trim().toLowerCase();

    // 6. Ray Tracing Parsing
    const rtEnabled = parseBoolean(row.rayTracingEnabled ?? row.rtEnabled ?? row.rayTracing, 'rayTracingEnabled');
    if (rtEnabled === null) {
      return {
        valid: false,
        payload: null,
        error: { code: 'MISSING_RT_STATE', message: 'rayTracingEnabled (true/false) must be explicitly specified.' },
      };
    }

    // 7. Upscaling Parsing
    const upscalingEnabled = parseBoolean(row.upscalingEnabled ?? row.upscaling, 'upscalingEnabled');
    if (upscalingEnabled === null) {
      return {
        valid: false,
        payload: null,
        error: { code: 'MISSING_UPSCALING_STATE', message: 'upscalingEnabled (true/false) must be explicitly specified.' },
      };
    }

    // 8. Frame Generation Parsing
    const fgEnabled = parseBoolean(row.frameGenerationEnabled ?? row.fgEnabled ?? row.frameGeneration, 'frameGenerationEnabled');
    if (fgEnabled === null) {
      return {
        valid: false,
        payload: null,
        error: { code: 'MISSING_FRAME_GENERATION_STATE', message: 'frameGenerationEnabled (true/false) must be explicitly specified.' },
      };
    }

    // 9. Performance Metrics Parsing
    const avgFps = parseNumber(row.avgFps || row.fps, 'avgFps', true);
    if (avgFps === null || avgFps < 5 || avgFps > 1200) {
      return {
        valid: false,
        payload: null,
        error: { code: 'INVALID_AVG_FPS', message: `avgFps must be a finite number between 5 and 1200 FPS (got "${row.avgFps || row.fps}").` },
      };
    }

    const onePercentLowFps = parseNumber(row.onePercentLowFps || row['1%LowFps'] || row['1PercentLowFps'], 'onePercentLowFps');
    const pointOnePercentLowFps = parseNumber(row.pointOnePercentLowFps || row['0.1%LowFps'] || row['0.1PercentLowFps'], 'pointOnePercentLowFps');
    const minFps = parseNumber(row.minFps, 'minFps');
    const maxFps = parseNumber(row.maxFps, 'maxFps');
    const medianFps = parseNumber(row.medianFps, 'medianFps');
    const avgFrameTimeMs = parseNumber(row.avgFrameTimeMs, 'avgFrameTimeMs');
    const p99FrameTimeMs = parseNumber(row.p99FrameTimeMs, 'p99FrameTimeMs');

    // 10. System Configuration Parsing
    const ramGB = parseNumber(row.ramGB || row.ram, 'ramGB');
    const ramChannels = row.ramChannels ? String(row.ramChannels).trim() : null;
    const ramType = row.ramType ? String(row.ramType).trim() : null;
    const ramSpeedMTs = parseNumber(row.ramSpeedMTs || row.ramSpeed, 'ramSpeedMTs');
    const operatingSystem = row.operatingSystem || row.os ? String(row.operatingSystem || row.os).trim() : null;
    const driverVersion = row.driverVersion ? String(row.driverVersion).trim() : null;
    const gameVersion = row.gameVersion ? String(row.gameVersion).trim() : null;
    const api = row.api ? String(row.api).trim() : null;
    const resizableBarEnabled = parseBoolean(row.resizableBarEnabled ?? row.rebarEnabled, 'resizableBarEnabled');
    const cpuOverclocked = parseBoolean(row.cpuOverclocked, 'cpuOverclocked');
    const gpuOverclocked = parseBoolean(row.gpuOverclocked, 'gpuOverclocked');

    // 11. Test Conditions Parsing
    const sampleDurationSeconds = parseNumber(row.sampleDurationSeconds, 'sampleDurationSeconds');
    const runCount = parseNumber(row.runCount, 'runCount') || 1;
    const benchmarkScene = row.benchmarkScene ? String(row.benchmarkScene).trim() : null;
    const benchmarkType = row.benchmarkType ? String(row.benchmarkType).trim() : 'unknown';
    const captureTool = row.captureTool ? String(row.captureTool).trim() : null;
    const captureToolVersion = row.captureToolVersion ? String(row.captureToolVersion).trim() : null;

    // 12. Provenance (Authoritative First-Party Enforcement)
    const sessionId = row.benchmarkSessionId || context.benchmarkSessionId || `session_${Date.now()}`;
    const sourceRecordId = row.sourceRecordId ? String(row.sourceRecordId).trim() : generateDeterministicRecordId(sessionId, rowIndex);
    const sourceGroupId = row.sourceGroupId ? String(row.sourceGroupId).trim() : null;
    const collectedAt = parseDate(row.collectedAt, 'collectedAt') || context.sessionTime || new Date();

    const payload = {
      gameId: gameRes.resolved._id,
      gameSlug: gameRes.resolved.slug,
      rawGameName: gameRes.resolved.name,
      cpuHardwareId: cpuRes.resolved.hardwareId,
      rawCpuString: cpuRes.resolved.canonicalName,
      gpuHardwareId: gpuRes.resolved.hardwareId,
      rawGpuString: gpuRes.resolved.canonicalName,
      display: {
        width,
        height,
      },
      graphics: {
        rawPreset: String(rawPreset).trim(),
        normalizedPreset,
        renderScale: parseNumber(row.renderScale, 'renderScale') || 1.0,
      },
      rayTracing: {
        enabled: rtEnabled,
        preset: row.rayTracingPreset ? String(row.rayTracingPreset).trim() : (rtEnabled ? 'on' : 'off'),
        pathTracing: parseBoolean(row.pathTracing, 'pathTracing') || false,
      },
      upscaling: {
        enabled: upscalingEnabled,
        technology: row.upscalingTechnology ? String(row.upscalingTechnology).trim() : (upscalingEnabled ? 'Custom' : 'None'),
        mode: row.upscalingMode ? String(row.upscalingMode).trim() : null,
        internalResolution: {
          width: parseNumber(row.internalWidth, 'internalWidth'),
          height: parseNumber(row.internalHeight, 'internalHeight'),
        },
      },
      frameGeneration: {
        enabled: fgEnabled,
        technology: row.frameGenerationTechnology ? String(row.frameGenerationTechnology).trim() : (fgEnabled ? 'Custom' : 'None'),
      },
      performance: {
        avgFps,
        onePercentLowFps,
        pointOnePercentLowFps,
        minFps,
        maxFps,
        medianFps,
        frameTimeMs: {
          avg: avgFrameTimeMs,
          p99: p99FrameTimeMs,
        },
      },
      system: {
        ramGB,
        ramChannels,
        ramType,
        ramSpeedMTs,
        operatingSystem,
        driverVersion,
        gameVersion,
        api,
        resizableBarEnabled,
        cpuOverclocked,
        gpuOverclocked,
      },
      testConditions: {
        sampleDurationSeconds,
        runCount,
        benchmarkScene,
        benchmarkType,
        captureTool,
        captureToolVersion,
      },
      provenance: {
        sourceType: 'project_aura_test',
        sourceName: 'Project Aura First-Party Benchmark',
        sourceUrl: null,
        sourceRecordId,
        sourceGroupId,
        benchmarkSessionId: sessionId,
        collectedAt,
        verifiedAt: new Date(),
        ingestionMethod: 'curated_batch',
      },
    };

    return {
      valid: true,
      payload,
      error: null,
    };
  } catch (err) {
    const code = err.message.startsWith('INVALID_') || err.message.startsWith('MISSING_') 
      ? err.message.split(':')[0] 
      : 'ROW_VALIDATION_FAILURE';
    return {
      valid: false,
      payload: null,
      error: { code, message: err.message },
    };
  }
}

module.exports = {
  parseBoolean,
  parseNumber,
  parseDate,
  generateDeterministicRecordId,
  parseBenchmarkFile,
  normalizeAndResolveRow,
};
