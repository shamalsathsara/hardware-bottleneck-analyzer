import axios from 'axios';

export const UNAUTHORIZED_EVENT = 'aura:unauthorized';
export const TOKEN_KEY = 'aura_token';
export const USER_KEY = 'aura_user';

// Production builds default to the same origin (nginx proxies /api to the API).
// Set VITE_API_URL at build time to target a different host.
const BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:4000' : '');

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired/invalid session anywhere in the app logs the user out (see useAuth).
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  }
);

/** Best user-facing message for a failed request. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (data?.message) return data.message;
  if (typeof data?.error === 'string' && !/^[A-Z0-9_]+$/.test(data.error)) return data.error;
  if (error?.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (error?.request && !error?.response) return 'Cannot reach the server. Please check your connection.';
  return fallback;
}

export default apiClient;
