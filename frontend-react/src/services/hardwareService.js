import apiClient from './apiClient';

export async function searchCpus(query) {
  const { data } = await apiClient.get('/api/cpus/search', {
    params: { q: query },
  });
  return data;
}

export async function searchGpus(query) {
  const { data } = await apiClient.get('/api/gpus/search', {
    params: { q: query },
  });
  return data;
}

export async function fetchHardwareStats() {
  try {
    const { data } = await apiClient.get('/api/hardware/stats');
    return data;
  } catch {
    return { maxCpuMark: 100000, maxGpuCuda: 500000 };
  }
}

export async function fetchAllCpusLightweight() {
  const { data } = await apiClient.get('/api/cpus/all-lightweight');
  return data;
}

export async function fetchAllGpusLightweight() {
  const { data } = await apiClient.get('/api/gpus/all-lightweight');
  return data;
}
