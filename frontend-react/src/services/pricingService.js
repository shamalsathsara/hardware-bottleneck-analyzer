import apiClient from './apiClient';

export async function estimatePrices(payload) {
  const { data } = await apiClient.post('/api/pricing/estimate', payload);
  return data;
}
