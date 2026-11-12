import apiClient from './apiClient';

export async function estimatePrices(payload) {
  // The backend waits up to 20s for the pricing model; give the browser a bit longer.
  const { data } = await apiClient.post('/api/pricing/estimate', payload, { timeout: 25000 });
  return data;
}
