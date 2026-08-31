import apiClient from './apiClient';

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
    return JSON.parse(localStorage.getItem('aura_user')) || null;
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem('aura_token', token);
  localStorage.setItem('aura_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('aura_token');
  localStorage.removeItem('aura_user');
}
