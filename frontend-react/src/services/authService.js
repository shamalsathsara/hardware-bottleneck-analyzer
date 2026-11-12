import apiClient, { TOKEN_KEY, USER_KEY } from './apiClient';

export async function loginUser(email, password) {
  const { data } = await apiClient.post('/api/auth/login', { email, password });
  return data;
}

export async function registerUser(username, email, password, contact) {
  const { data } = await apiClient.post('/api/auth/register', { username, email, password, contact });
  return data;
}

export async function forgotPassword(email) {
  const { data } = await apiClient.post('/api/auth/forgot-password', { email });
  return data;
}

export async function verifyResetCode(email, code) {
  const { data } = await apiClient.post('/api/auth/verify-code', { email, code });
  return data;
}

export async function resetPassword(email, code, newPassword) {
  const { data } = await apiClient.post('/api/auth/reset-password', { email, code, newPassword });
  return data;
}

export function getCurrentUser() {
  try {
    if (!localStorage.getItem(TOKEN_KEY)) return null;
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  if (!token || !user) throw new Error('Invalid session returned by the server.');
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('token'); // legacy key from older builds
}
