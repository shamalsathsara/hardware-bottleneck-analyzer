import apiClient from './apiClient';

export async function predictFps(payload) {
  const { data } = await apiClient.post('/api/predict', payload);
  return data;
}
