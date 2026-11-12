import { useState, useEffect } from 'react';
import { fetchAllCpusLightweight, fetchAllGpusLightweight, fetchHardwareStats } from '../services/hardwareService';

const DEFAULT_STATS = { maxCpuMark: 100000, maxGpuCuda: 500000 };

/** Loads the compact CPU/GPU lists (used for upgrade suggestions) and score maxima. */
export function useHardwareData() {
  const [cpuList, setCpuList] = useState([]);
  const [gpuList, setGpuList] = useState([]);
  const [maxStats, setMaxStats] = useState(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([fetchAllCpusLightweight(), fetchAllGpusLightweight(), fetchHardwareStats()])
      .then(([cpus, gpus, stats]) => {
        if (cancelled) return;
        if (cpus.status === 'fulfilled' && Array.isArray(cpus.value)) setCpuList(cpus.value);
        if (gpus.status === 'fulfilled' && Array.isArray(gpus.value)) setGpuList(gpus.value);
        if (stats.status === 'fulfilled' && stats.value) setMaxStats({ ...DEFAULT_STATS, ...stats.value });

        const failed = [cpus, gpus].some((r) => r.status === 'rejected');
        setError(failed ? 'Could not load the full hardware database. Search still works; upgrade suggestions may be limited.' : null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { cpuList, gpuList, maxStats, loading, error };
}

export default useHardwareData;
