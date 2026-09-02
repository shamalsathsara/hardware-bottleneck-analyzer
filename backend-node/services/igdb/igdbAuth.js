const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config();

/**
 * In-memory OAuth token cache for IGDB API requests.
 */
let cachedToken = null;
let tokenExpiresAt = null;

const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const EXPIRY_BUFFER_SECONDS = 60; // Refresh 60 seconds before actual expiry

/**
 * Retrieves a valid Twitch OAuth app access token for IGDB API.
 * Reuses in-memory cached token if still valid.
 * 
 * @param {Object} [options]
 * @param {boolean} [options.forceRefresh=false]
 * @returns {Promise<string>} Valid access token
 */
async function getAccessToken(options = {}) {
  const { forceRefresh = false } = options;
  const now = Date.now();

  if (!forceRefresh && cachedToken && tokenExpiresAt && now < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('IGDB credentials missing: IGDB_CLIENT_ID and IGDB_CLIENT_SECRET must be configured.');
  }

  try {
    const response = await axios.post(
      TWITCH_TOKEN_URL,
      null,
      {
        params: {
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
        },
        timeout: 10000,
      }
    );

    const { access_token, expires_in } = response.data || {};

    if (!access_token || typeof expires_in !== 'number') {
      throw new Error('Invalid OAuth response received from Twitch authorization server.');
    }

    cachedToken = access_token;
    tokenExpiresAt = now + Math.max(0, expires_in - EXPIRY_BUFFER_SECONDS) * 1000;

    return cachedToken;
  } catch (error) {
    // Invalidate cache on failure
    cachedToken = null;
    tokenExpiresAt = null;

    if (error.response) {
      const status = error.response.status;
      const errorMsg = error.response.data?.message || error.response.statusText || 'Authentication failed';
      throw new Error(`IGDB OAuth Authentication Error (${status}): ${errorMsg}`);
    }

    throw new Error(`IGDB OAuth Network Error: ${error.message}`);
  }
}

/**
 * Clears the in-memory token cache (useful on 401 or in test teardown).
 */
function clearTokenCache() {
  cachedToken = null;
  tokenExpiresAt = null;
}

/**
 * Returns current token cache status without revealing the token.
 */
function getTokenStatus() {
  return {
    hasToken: Boolean(cachedToken),
    expiresAt: tokenExpiresAt ? new Date(tokenExpiresAt).toISOString() : null,
    isValid: Boolean(cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt),
  };
}

module.exports = {
  getAccessToken,
  clearTokenCache,
  getTokenStatus,
  TWITCH_TOKEN_URL,
};
