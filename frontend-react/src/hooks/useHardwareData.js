import { useState, useEffect } from 'react';
import { fetchAllCpusLightweight, fetchAllGpusLightweight, fetchHardwareStats } from '../services/hardwareService';

export function useHardwareData() {
  const [cpuList, setCpuList] = useState([]);
  const [gpuList, setGpuList] = useState([]);
  const [maxStats, setMaxStats] = useState({ maxCpuMark: 100000, maxGpuCuda: 500000 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const [cpus, gpus, stats] = await Promise.all([
          fetchAllCpusLightweight().catch(() => []),
          fetchAllGpusLightweight().catch(() => []),
          fetchHardwareStats().catch(() => ({ maxCpuMark: 100000, maxGpuCuda: 500000 })),
        ]);

        if (isMounted) {
          setCpuList(cpus);
          setGpuList(gpus);
          setMaxStats(stats);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load hardware database');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    cpuList,
    gpuList,
    maxStats,
    loading,
    error,
  };
}

export default useHardwareData;
