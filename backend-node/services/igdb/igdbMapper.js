/**
 * IGDB Platform Identifiers for PC Gaming.
 * Reference: https://api-docs.igdb.com/#platforms
 */
const IGDB_PLATFORM_IDS = {
  WINDOWS: 6, // PC (Microsoft Windows)
  LINUX: 3,   // Linux
  MAC: 14,    // Mac / macOS
};

/**
 * Normalizes a raw string or slug to conform to Project Aura's strict slug regex:
 * /^[a-z0-9]+(?:-[a-z0-9]+)*$/
 * 
 * @param {string} rawSlug 
 * @param {string} nameFallback 
 * @returns {string|null}
 */
function normalizeSlug(rawSlug, nameFallback = '') {
  const source = (rawSlug || nameFallback || '').toString().toLowerCase().trim();
  const slug = source
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')     // Trim leading and trailing hyphens
    .replace(/-{2,}/g, '-');     // Collapse consecutive hyphens

  return slug || null;
}

/**
 * Builds a high-resolution secure HTTPS image URL from an IGDB cover object.
 * 
 * @param {Object|null} cover 
 * @returns {string|null}
 */
function formatCoverUrl(cover) {
  if (!cover) return null;

  if (cover.image_id) {
    return `https://images.igdb.com/igdb/image/upload/t_cover_big/${cover.image_id}.jpg`;
  }

  if (typeof cover.url === 'string' && cover.url.trim()) {
    let url = cover.url.trim();
    if (url.startsWith('//')) {
      url = `https:${url}`;
    }
    // Upgrade thumb to cover_big if present in URL
    url = url.replace('/t_thumb/', '/t_cover_big/');
    return url;
  }

  return null;
}

/**
 * Maps a single raw IGDB game record to a normalized Project Aura Game document structure.
 * 
 * @param {Object} rawGame - Raw game payload from IGDB API
 * @returns {{ isValid: boolean, error?: string, data?: Object }}
 */
function mapIgdbGame(rawGame) {
  if (!rawGame || typeof rawGame !== 'object') {
    return { isValid: false, error: 'Empty or invalid IGDB game payload.' };
  }

  // 1. Mandatory Identity Fields
  const igdbId = Number(rawGame.id);
  if (!Number.isInteger(igdbId) || igdbId <= 0) {
    return { isValid: false, error: `Invalid or missing IGDB ID: ${rawGame.id}` };
  }

  const name = typeof rawGame.name === 'string' ? rawGame.name.trim() : '';
  if (!name) {
    return { isValid: false, error: `Game ID ${igdbId} is missing a valid title name.` };
  }

  const slug = normalizeSlug(rawGame.slug, name);
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { isValid: false, error: `Game "${name}" (ID ${igdbId}) produced an invalid slug: "${slug}"` };
  }

  // 2. Alternate Names
  const alternateNames = [];
  if (Array.isArray(rawGame.alternative_names)) {
    for (const alt of rawGame.alternative_names) {
      const altName = typeof alt === 'string' ? alt.trim() : (alt?.name || '').trim();
      if (altName && !alternateNames.includes(altName) && altName !== name) {
        alternateNames.push(altName);
      }
    }
  }

  // 3. Release Date & Year
  let releaseDate = null;
  let releaseYear = null;
  if (typeof rawGame.first_release_date === 'number' && rawGame.first_release_date > 0) {
    const d = new Date(rawGame.first_release_date * 1000);
    if (!isNaN(d.getTime())) {
      releaseDate = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const year = d.getUTCFullYear();
      if (year >= 1970 && year <= 2050) {
        releaseYear = year;
      }
    }
  }

  // 4. Genres
  const genres = [];
  if (Array.isArray(rawGame.genres)) {
    for (const g of rawGame.genres) {
      const genreName = typeof g === 'string' ? g.trim() : (g?.name || '').trim();
      if (genreName && !genres.includes(genreName)) {
        genres.push(genreName);
      }
    }
  }

  // 5. Platforms (Ensure PC is reflected)
  const platforms = ['PC'];
  if (Array.isArray(rawGame.platforms)) {
    for (const p of rawGame.platforms) {
      const pName = typeof p === 'string' ? p.trim() : (p?.name || '').trim();
      if (pName && !platforms.includes(pName) && pName !== 'PC') {
        platforms.push(pName);
      }
    }
  }

  // 6. Developer & Publisher Extraction
  let developer = null;
  let publisher = null;
  if (Array.isArray(rawGame.involved_companies)) {
    for (const item of rawGame.involved_companies) {
      const compName = item.company?.name || (typeof item.company === 'string' ? item.company : null);
      if (compName) {
        if (item.developer && !developer) {
          developer = compName.trim();
        }
        if (item.publisher && !publisher) {
          publisher = compName.trim();
        }
      }
    }
  }

  // 7. Cover / Thumbnail URL
  const thumbnailUrl = formatCoverUrl(rawGame.cover);

  // 8. Construct Normalized Document
  const mappedGame = {
    name,
    slug,
    alternateNames,
    developer,
    publisher,
    releaseDate,
    releaseYear,
    genres,
    platforms,
    thumbnailUrl,
    externalIds: {
      igdb: igdbId,
      steam: null,
    },
    metadataSource: 'igdb',
    metadataLastSyncedAt: new Date(),
    dataQuality: 'metadata_only',
  };

  return {
    isValid: true,
    data: mappedGame,
  };
}

module.exports = {
  IGDB_PLATFORM_IDS,
  normalizeSlug,
  formatCoverUrl,
  mapIgdbGame,
};
