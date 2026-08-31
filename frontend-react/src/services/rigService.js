import apiClient from './apiClient';

export async function fetchUserRigs() {
  const { data } = await apiClient.get('/api/user/rigs');
  return data;
}

export async function saveUserRig(rigData) {
  const { data } = await apiClient.post('/api/user/rigs', rigData);
  return data;
}

export async function deleteUserRig(rigId) {
  const { data } = await apiClient.delete(`/api/user/rigs/${rigId}`);
  return data;
}
