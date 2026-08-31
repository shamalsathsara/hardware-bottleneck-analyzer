import apiClient from './apiClient';

/**
 * Autocomplete game search
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchGames(query) {
  if (!query || !query.trim()) return [];
  const { data } = await apiClient.get('/api/games/search', {
    params: { q: query.trim() },
  });
  return data;
}

/**
 * Fetch a single game by its unique URL slug
 * @param {string} slug
 * @returns {Promise<Object>}
 */
export async function getGameBySlug(slug) {
  const { data } = await apiClient.get(`/api/games/${encodeURIComponent(slug)}`);
  return data;
}

/**
 * Fetch paginated games catalog with optional filtering
 * @param {Object} params { page, limit, genre, search }
 * @returns {Promise<{ games: Array, pagination: Object }>}
 */
export async function getGames(params = {}) {
  const { data } = await apiClient.get('/api/games', { params });
  return data;
}
