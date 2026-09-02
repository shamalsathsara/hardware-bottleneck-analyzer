const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config();
const { getAccessToken, clearTokenCache } = require('./igdbAuth');

const IGDB_BASE_URL = 'https://api.igdb.com/v4';
const DEFAULT_TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

/**
 * Utility helper for async sleep.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes an Apicalypse query against the IGDB API v4 with resilience,
 * token auto-injection, 401 retry, 429 rate limit backoff, and 5xx transient retry.
 * 
 * @param {string} endpoint - IGDB API endpoint (e.g., '/games', '/covers')
 * @param {string} apicalypseQuery - Apicalypse query string (e.g., 'fields name, slug; limit 10;')
 * @param {Object} [options]
 * @param {number} [options.timeout=10000] - Request timeout in ms
 * @param {number} [options.maxRetries=3] - Maximum retry attempts for transient errors
 * @returns {Promise<Array<Object>>} JSON response data array
 */
async function query(endpoint, apicalypseQuery = '', options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${IGDB_BASE_URL}${cleanEndpoint}`;
  const timeout = options.timeout || DEFAULT_TIMEOUT_MS;
  const maxRetries = typeof options.maxRetries === 'number' ? options.maxRetries : MAX_RETRIES;

  const clientId = process.env.IGDB_CLIENT_ID;
  if (!clientId) {
    throw new Error('IGDB_CLIENT_ID is not configured in backend environment.');
  }

  let attempt = 0;
  let hasRetriedAuth = false;

  while (attempt <= maxRetries) {
    try {
      const token = await getAccessToken();

      const response = await axios.post(
        url,
        apicalypseQuery.trim(),
        {
          headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'text/plain',
          },
          timeout,
        }
      );

      return response.data;
    } catch (error) {
      attempt++;

      // Case 1: 401 Unauthorized -> Token might be revoked or expired. Invalidate cache and retry once.
      if (error.response?.status === 401 && !hasRetriedAuth) {
        hasRetriedAuth = true;
        clearTokenCache();
        continue;
      }

      // Case 2: 429 Rate Limit -> Backoff and retry
      if (error.response?.status === 429) {
        if (attempt > maxRetries) {
          throw new Error('IGDB API rate limit exceeded (429). Maximum retries reached.');
        }
        const retryAfterSec = parseInt(error.response.headers?.['retry-after'], 10) || 1;
        const delay = Math.max(retryAfterSec * 1000, INITIAL_BACKOFF_MS * Math.pow(2, attempt));
        await sleep(delay);
        continue;
      }

      // Case 3: 5xx Server Error or Network Timeout -> Transient error retry with exponential backoff
      const is5xx = error.response && error.response.status >= 500 && error.response.status < 600;
      const isNetworkError = !error.response && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.message.includes('timeout') || error.message.includes('Network Error'));

      if ((is5xx || isNetworkError) && attempt <= maxRetries) {
        const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }

      // Permanent 4xx client errors (400, 404, etc.) or exhausted retries
      const status = error.response?.status;
      const details = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      const err = new Error(`IGDB API error on [${cleanEndpoint}] (status ${status || 'network'}): ${details}`);
      err.statusCode = status;
      err.isIgdbError = true;
      throw err;
    }
  }

  throw new Error(`IGDB API request to ${cleanEndpoint} failed after ${maxRetries} retries.`);
}

module.exports = {
  query,
  IGDB_BASE_URL,
};
