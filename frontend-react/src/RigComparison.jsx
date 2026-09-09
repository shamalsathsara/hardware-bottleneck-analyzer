import { useState, useEffect } from 'react';
import { analyzeBottleneck } from './utils/BottleneckLogic';
import { fetchAllCpusLightweight, fetchAllGpusLightweight, searchCpus, searchGpus } from './services/hardwareService';
import { fetchUserRigs } from './services/rigService';
import { predictFps } from './services/analysisService';
import HardwareSearch from './HardwareSearch';

// SVG Icons
const IconCpu = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="15" x2="23" y2="15" />
    <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="15" x2="4" y2="15" />
  </svg>
);

const IconGpu = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="8" cy="12" r="2.5" /><circle cx="16" cy="12" r="2.5" />
    <line x1="6" y1="18" x2="6" y2="21" /><line x1="10" y1="18" x2="10" y2="21" />
    <line x1="14" y1="18" x2="14" y2="21" /><line x1="18" y1="18" x2="18" y2="21" />
  </svg>
);

const IconRam = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="10" rx="1" />
    <line x1="6" y1="17" x2="6" y2="19" />
    <line x1="10" y1="17" x2="10" y2="19" />
    <line x1="14" y1="17" x2="14" y2="19" />
    <line x1="18" y1="17" x2="18" y2="19" />
    <line x1="5" y1="11" x2="7" y2="11" />
    <line x1="9" y1="11" x2="11" y2="11" />
    <line x1="13" y1="11" x2="15" y2="11" />
    <line x1="17" y1="11" x2="19" y2="11" />
  </svg>
);

const IconMonitor = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const IconSliders = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

const IconSwords = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
    <line x1="13" y1="19" x2="19" y2="13" />
    <line x1="16" y1="16" x2="20" y2="20" />
    <line x1="19" y1="21" x2="21" y2="19" />
    <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
    <line x1="5" y1="14" x2="9" y2="18" />
    <line x1="7" y1="17" x2="4" y2="20" />
    <line x1="3" y1="19" x2="5" y2="21" />
  </svg>
);

const IconTrophy = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M5 4h14a1 1 0 0 1 1 1v1a5 5 0 0 1-4 4.9 6 6 0 0 1-3 4.1V18h3a1 1 0 0 1 1 1v2H7v-2a1 1 0 0 1 1-1h3v-3a6 6 0 0 1-3-4.1A5 5 0 0 1 4 7V5a1 1 0 0 1 1-1zm-1 3a3 3 0 0 0 2 2.83V6H4v1zm16 0h-2v2.83A3 3 0 0 0 20 7z" />
  </svg>
);

const IconEquals = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="5" y1="9" x2="19" y2="9" />
    <line x1="5" y1="15" x2="19" y2="15" />
  </svg>
);

const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconScan = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
    <rect x="7" y="7" width="10" height="10" rx="1" />
  </svg>
);

const IconInfoCircle = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const IconBulb = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
  </svg>
);

const IconBarChart = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

// Empty Rig Factory
const emptyRig = () => ({
  cpu: '', gpu: '', ram: '16', resolution: '1920x1080', settings: 'High',
});

// Single Rig Configuration Card
function RigPanel({ label, rig, onChange, onClear, savedRigs }) {
  const handleSelectSavedRig = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) return;
    const found = savedRigs.find((r) => String(r._id) === String(selectedId));
    if (found) {
      onChange({
        cpu: found.cpu,
        gpu: found.gpu,
        ram: String(found.ram || '16'),
        resolution: found.resolution || '1920x1080',
        settings: found.settings || 'High',
      });
    }
  };

  return (
    <div className="cmp-rig-card">
      
      {/* Card Header */}
      <div className="cmp-card-header">
        <div className="cmp-card-title-wrap">
          <span className="cmp-monitor-icon"><IconMonitor /></span>
          <h2 className="cmp-card-title">{label}</h2>
        </div>
        <button className="cmp-clear-btn" onClick={onClear} type="button">
          Clear All <IconTrash />
        </button>
      </div>

      {/* Saved Rigs Quick Selector */}
      {savedRigs && savedRigs.length > 0 && (
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label" style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '700' }}>
            ⚡ Load From Your Saved Rigs
          </label>
          <select 
            className="form-control cmp-select"
            defaultValue=""
            onChange={handleSelectSavedRig}
          >
            <option value="" disabled>-- Select a saved build to populate --</option>
            {savedRigs.map((sr) => (
              <option key={sr._id} value={sr._id}>
                {sr.name} ({sr.cpu} + {sr.gpu})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Processor (CPU) */}
      <div className="form-group">
        <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: '600', color: 'var(--text-sub)' }}>
          Processor (CPU)
        </label>
        <HardwareSearch 
          type="cpu" 
          placeholder="Type to search CPUs (e.g. Ryzen 7 7800X3D, Core i5-12400F)..." 
          value={rig.cpu}
          onSelect={(item) => onChange({ ...rig, cpu: item.displayName || item.canonicalName || item.cpuName, cpuData: item })} 
        />
      </div>

      {/* Graphics Card (GPU) */}
      <div className="form-group">
        <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: '600', color: 'var(--text-sub)' }}>
          Graphics Card (GPU)
        </label>
        <HardwareSearch 
          type="gpu" 
          placeholder="Type to search GPUs (e.g. RTX 4070, RX 7800 XT)..." 
          value={rig.gpu}
          onSelect={(item) => onChange({ ...rig, gpu: item.displayName || item.canonicalName || item.Device, gpuData: item })} 
        />
      </div>

      {/* System RAM */}
      <div className="form-group">
        <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: '600', color: 'var(--text-sub)' }}>
          System RAM
        </label>
        <select 
          className="form-control cmp-select" 
          value={rig.ram} 
          onChange={e => onChange({ ...rig, ram: e.target.value })}
        >
          <option value="4">4 GB</option>
          <option value="8">8 GB</option>
          <option value="16">16 GB</option>
          <option value="32">32 GB</option>
          <option value="64">64 GB</option>
        </select>
      </div>

      {/* Resolution + Quality Row */}
      <div className="form-row-2col">
        <div className="form-group">
          <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: '600', color: 'var(--text-sub)' }}>
            Resolution
          </label>
          <select 
            className="form-control cmp-select" 
            value={rig.resolution} 
            onChange={e => onChange({ ...rig, resolution: e.target.value })}
          >
            <option value="1920x1080">1080p (FHD)</option>
            <option value="2560x1440">1440p (QHD)</option>
            <option value="3840x2160">4K (UHD)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: '600', color: 'var(--text-sub)' }}>
            Graphics Quality Preset
          </label>
          <select 
            className="form-control cmp-select" 
            value={rig.settings} 
            onChange={e => onChange({ ...rig, settings: e.target.value })}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Ultra">Ultra</option>
          </select>
        </div>
      </div>

    </div>
  );
}

// FPS Summary Card (top row)
function FpsSummaryCard({ label, accent, result, isWinner, isTied }) {
  const { fps, bottleneck, rigName } = result;
  const fpsInt = Math.round(parseFloat(fps));
  const severity = bottleneck?.severity !== undefined ? bottleneck.severity : 0;
  const bkColor = bottleneck?.color || '#10b981';
  const bkType = bottleneck?.type
    ? bottleneck.type.charAt(0).toUpperCase() + bottleneck.type.slice(1) + ' Bottleneck'
    : 'Balanced';

  return (
    <div
      className={`cmp-fps-summary-card${isWinner && !isTied ? ' cmp-fps-summary-card--winner' : ''}`}
      style={{ '--card-accent': accent }}
    >
      {isWinner && !isTied && (
        <div className="cmp-fps-badge-winner">
          <IconTrophy /> Winner
        </div>
      )}
      {isTied && (
        <div className="cmp-fps-badge-tied">
          <IconEquals /> Tied
        </div>
      )}

      <div className="cmp-fps-card-label">{label}</div>
      <div className="cmp-fps-card-rigname">{rigName}</div>

      <div className="cmp-fps-card-number" style={{ color: isWinner && !isTied ? '#fbbf24' : accent }}>
        {fpsInt}
        <span className="cmp-fps-card-unit">FPS</span>
      </div>

      <div className="cmp-fps-bk-row">
        <div className="cmp-fps-bk-bar-track">
          <div className="cmp-fps-bk-bar-fill" style={{ width: `${severity}%`, background: bkColor }} />
        </div>
        <span className="cmp-fps-bk-tag" style={{ color: bkColor }}>{bkType}</span>
      </div>
    </div>
  );
}

// Main Component
export default function RigComparison({ cpuList, gpuList, onBack, initialRig, currentUser }) {
  const [rigA, setRigA] = useState(() => initialRig
    ? {
        cpu:        initialRig.cpu || '',
        gpu:        initialRig.gpu || '',
        ram:        String(initialRig.ram || '16'),
        resolution: initialRig.resolution || '1920x1080',
        settings:   initialRig.settings || 'High',
      }
    : emptyRig()
  );
  const [rigB, setRigB] = useState(emptyRig);

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const [localCpuList, setLocalCpuList] = useState(cpuList || []);
  const [localGpuList, setLocalGpuList] = useState(gpuList || []);
  const [savedRigs, setSavedRigs] = useState([]);

  useEffect(() => {
    if (cpuList && cpuList.length > 0) setLocalCpuList(cpuList);
    if (gpuList && gpuList.length > 0) setLocalGpuList(gpuList);
  }, [cpuList, gpuList]);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      if ((!cpuList || cpuList.length === 0) || (!gpuList || gpuList.length === 0)) {
        try {
          const [c, g] = await Promise.all([
            fetchAllCpusLightweight().catch(() => []),
            fetchAllGpusLightweight().catch(() => []),
          ]);
          if (isMounted) {
            if (c.length > 0) setLocalCpuList(c);
            if (g.length > 0) setLocalGpuList(g);
          }
        } catch {
          // silently handle
        }
      }

      try {
        const rigs = await fetchUserRigs();
        if (isMounted && Array.isArray(rigs)) {
          setSavedRigs(rigs);
        }
      } catch {
        // user may not be logged in
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [cpuList, gpuList, currentUser]);

  const resolveCpu = async (cpuName) => {
    if (!cpuName) return null;
    const clean = cpuName.trim();
    const lower = clean.toLowerCase();

    let found = localCpuList.find(c => 
      (c.cpuName && c.cpuName.trim() === clean) || 
      (c.canonicalName && c.canonicalName.trim() === clean)
    );
    if (found) return found;

    found = localCpuList.find(c => 
      (c.cpuName && c.cpuName.toLowerCase().trim() === lower) || 
      (c.canonicalName && c.canonicalName.toLowerCase().trim() === lower)
    );
    if (found) return found;

    try {
      const searchRes = await searchCpus(clean);
      if (Array.isArray(searchRes) && searchRes.length > 0) {
        return searchRes[0];
      }
    } catch {
      // ignore
    }

    return null;
  };

  const resolveGpu = async (gpuName) => {
    if (!gpuName) return null;
    const clean = gpuName.trim();
    const lower = clean.toLowerCase();

    let found = localGpuList.find(g => 
      (g.Device && g.Device.trim() === clean) || 
      (g.canonicalName && g.canonicalName.trim() === clean)
    );
    if (found) return found;

    found = localGpuList.find(g => 
      (g.Device && g.Device.toLowerCase().trim() === lower) || 
      (g.canonicalName && g.canonicalName.toLowerCase().trim() === lower)
    );
    if (found) return found;

    try {
      const searchRes = await searchGpus(clean);
      if (Array.isArray(searchRes) && searchRes.length > 0) {
        return searchRes[0];
      }
    } catch {
      // ignore
    }

    return null;
  };

  const analyzeRig = async (rig) => {
    const fullCpu = rig.cpuData || await resolveCpu(rig.cpu);
    const fullGpu = rig.gpuData || await resolveGpu(rig.gpu);

    if (!fullCpu) {
      throw new Error(`CPU not found: "${rig.cpu}". Please choose from the autocomplete suggestions.`);
    }
    if (!fullGpu) {
      throw new Error(`GPU not found: "${rig.gpu}". Please choose from the autocomplete suggestions.`);
    }

    let cores = 6;
    if (typeof fullCpu.cores === 'number') {
      cores = fullCpu.cores;
    } else if (typeof fullCpu.cores === 'object' && fullCpu.cores !== null) {
      cores = fullCpu.cores.total || fullCpu.cores.performanceCores || 6;
    } else if (typeof fullCpu.cores === 'string') {
      cores = parseInt(fullCpu.cores, 10) || 6;
    }

    const threads = cores * 2;
    const cpuTDP = Math.min(cores * 10, 125);

    let cuda = 100000;
    if (typeof fullGpu.CUDA === 'number' && Number.isFinite(fullGpu.CUDA)) {
      cuda = fullGpu.CUDA;
    } else if (typeof fullGpu.CUDA === 'string') {
      cuda = parseInt(fullGpu.CUDA, 10) || 100000;
    }

    let vram = 4;
    let gpuTdp = 75;
    let bandwidth = 128;

    let gpuBaseClock = 1200, gpuBoostClock = 1500, gpuMemoryBus = 128, gpuROPs = 32;
    if (fullGpu.memory?.vramGB) {
      vram = fullGpu.memory.vramGB;
      gpuTdp = fullGpu.power?.defaultTgpWatts || 200;
      bandwidth = fullGpu.memory.memoryBandwidthGBs || 448;
      gpuBaseClock = fullGpu.clocks?.baseClockMHz || 1800;
      gpuBoostClock = fullGpu.clocks?.boostClockMHz || 2100;
      gpuMemoryBus = fullGpu.memory?.busWidthBits || 192;
      gpuROPs = fullGpu.renderUnits?.rops || 80;
    } else {
      if (cuda > 250000) {
        vram = 24; gpuTdp = 350; bandwidth = 1008;
        gpuBaseClock = 2235; gpuBoostClock = 2520; gpuMemoryBus = 384; gpuROPs = 176;
      } else if (cuda > 175000) {
        vram = 16; gpuTdp = 280; bandwidth = 760;
        gpuBaseClock = 2100; gpuBoostClock = 2400; gpuMemoryBus = 256; gpuROPs = 112;
      } else if (cuda > 100000) {
        vram = 12; gpuTdp = 200; bandwidth = 448;
        gpuBaseClock = 1800; gpuBoostClock = 2100; gpuMemoryBus = 192; gpuROPs = 80;
      } else if (cuda > 75000) {
        vram = 8;  gpuTdp = 130; bandwidth = 256;
        gpuBaseClock = 1700; gpuBoostClock = 1950; gpuMemoryBus = 128; gpuROPs = 64;
      } else if (cuda > 45000) {
        vram = 6;  gpuTdp = 90;  bandwidth = 192;
        gpuBaseClock = 1530; gpuBoostClock = 1785; gpuMemoryBus = 192; gpuROPs = 48;
      } else {
        vram = 4;  gpuTdp = 75;  bandwidth = 112;
        gpuBaseClock = 1300; gpuBoostClock = 1550; gpuMemoryBus = 128; gpuROPs = 32;
      }
    }

    const gpuFP32 = Math.round((2 * cuda * gpuBoostClock) / 1e6 * 10) / 10;
    const cpuBaseFreqMHz = 2800 + Math.min(cores, 16) * 50;
    const cpuTurboFreqMHz = cpuBaseFreqMHz + 1200;
    const cpuCacheL3MB = Math.max(6, Math.min(cores * 2, 64));

    const payload = {
      'CPU': fullCpu.cpuName || fullCpu.canonicalName || rig.cpu,
      'CPU Cores': cores,
      'CPU Threads': threads,
      'CPU TDP (W)': cpuTDP,
      'GPU': fullGpu.Device || fullGpu.canonicalName || rig.gpu,
      'GPU Series': fullGpu.Manufacturer || 'Nvidia',
      'GPU VRAM (GB)': vram,
      'GPU Bandwidth (GB/s)': bandwidth,
      'GPU TDP (W)': gpuTdp,
      'RAM (GB)': parseInt(rig.ram, 10) || 16,
      'Resolution': rig.resolution || '1920x1080',
      'Graphics Settings': rig.settings || 'High',
      'cpuFrequency': cpuBaseFreqMHz,
      'cpuTurboClock': cpuTurboFreqMHz,
      'cpuCacheL3': cpuCacheL3MB,
      'gpuShaders': cuda,
      'gpuBaseClock': gpuBaseClock,
      'gpuBoostClock': gpuBoostClock,
      'gpuMemoryBus': gpuMemoryBus,
      'gpuRops': gpuROPs,
      'gpuFp32': gpuFP32,
    };

    const data = await predictFps(payload);
    const analysis = analyzeBottleneck(fullCpu, fullGpu);
    const cpuScore = parseInt(fullCpu.cpuMark, 10) || 8000;
    let finalFps = Number(data?.predicted_fps ?? data?.predictedFps) || 60;
    finalFps = Math.max(5, Math.min(900, finalFps));
    if (!Number.isFinite(finalFps)) finalFps = 60;

    const rigName =
      (rig.cpu || 'CPU').split(' ').slice(0, 3).join(' ') +
      ' + ' +
      (rig.gpu || 'GPU').split(' ').slice(0, 3).join(' ');

    return { 
      fps: finalFps.toFixed(1), 
      bottleneck: analysis, 
      rigName 
    };
  };

  const handleCompare = async () => {
    setError(null);
    if (!rigA.cpu || !rigA.gpu) { 
      setError('Please fill in both CPU and GPU for Rig A.'); 
      return; 
    }
    if (!rigB.cpu || !rigB.gpu) { 
      setError('Please fill in both CPU and GPU for Rig B.'); 
      return; 
    }

    setLoading(true);
    setResults(null);
    try {
      const [resA, resB] = await Promise.all([analyzeRig(rigA), analyzeRig(rigB)]);
      setResults({ a: resA, b: resB });
    } catch (err) {
      setError(err.message || 'Analysis failed. Make sure backend and ML services are running.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setResults(null); setError(null); };

  const fpsA  = results ? (parseFloat(results.a.fps) || 0) : 0;
  const fpsB  = results ? (parseFloat(results.b.fps) || 0) : 0;
  const aWins = results && fpsA > fpsB;
  const bWins = results && fpsB > fpsA;
  const tied  = results && Math.abs(fpsA - fpsB) < 0.05;

  const buildVerdict = () => {
    if (!results) return '';
    if (tied) return 'Both rigs produce identical performance at these settings. Consider changing resolution or quality to see a difference.';

    const winner    = aWins ? 'Rig A' : 'Rig B';
    const loserSide = aWins ? 'Rig B' : 'Rig A';
    
    const fpsDiff   = Math.abs(fpsA - fpsB).toFixed(1);
    const minFps    = Math.max(1, Math.min(fpsA, fpsB));
    const pctRaw    = ((Math.abs(fpsA - fpsB) / minFps) * 100);
    const pct       = (Number.isFinite(pctRaw) ? pctRaw : 0).toFixed(0);
    
    const wBk       = aWins ? results.a.bottleneck : results.b.bottleneck;
    const lBk       = aWins ? results.b.bottleneck : results.a.bottleneck;

    let text = `${winner} wins by ${fpsDiff} FPS (${pct}% faster). `;

    if (wBk && lBk) {
      if (wBk.type === null && lBk.type !== null) {
        text += `${winner} has a perfectly balanced build, while ${loserSide} suffers a ${String(lBk.type).toUpperCase()} bottleneck — this is the primary reason for the performance gap.`;
      } else if (wBk.severity < lBk.severity) {
        text += `${winner} has a lower bottleneck severity (${wBk.severity}% vs ${lBk.severity}%), giving it a significant efficiency advantage.`;
      } else {
        text += `${winner}'s components are better matched for the selected resolution and quality settings.`;
      }
    }

    return text;
  };

  return (
    <div className="cmp-page-container">

      {/* Top Header Bar */}
      <div className="cmp-header-layout">
        
        <div className="cmp-header-left-group">
          <button className="cmp-back-btn" onClick={onBack}>
            <IconArrowLeft />
            Back to Analyzer
          </button>
          <div className="cmp-header-title-box">
            <h1 className="cmp-main-title">Side-by-Side Rig Comparison</h1>
            <p className="cmp-main-subtitle">
              Configure two PC builds and let Project Aura battle-test them head-to-head.
            </p>
          </div>
        </div>

        {/* Right Info Box */}
        <div className="cmp-header-info-box">
          <span className="cmp-info-icon"><IconInfoCircle /></span>
          <span className="cmp-info-text">
            Select your components manually or load from your saved rigs to compare performance and bottlenecks.
          </span>
        </div>

      </div>

      {/* Main Configuration Form */}
      {!results && (
        <div className="cmp-content-section">
          
          <div className="cmp-battle-grid">
            
            {/* Rig A Card */}
            <RigPanel
              label="Rig A"
              rig={rigA}
              onChange={setRigA}
              onClear={() => setRigA(emptyRig())}
              savedRigs={savedRigs}
            />

            {/* Central VS Divider */}
            <div className="cmp-vs-column">
              <div className="cmp-vs-dotted-line top" />
              <div className="cmp-vs-badge">VS</div>
              <div className="cmp-vs-dotted-line bottom" />
            </div>

            {/* Rig B Card */}
            <RigPanel
              label="Rig B"
              rig={rigB}
              onChange={setRigB}
              onClear={() => setRigB(emptyRig())}
              savedRigs={savedRigs}
            />

          </div>

          {/* Error Banner */}
          {error && (
            <div className="error-banner" style={{ marginTop: '1.25rem' }}>
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Tip Banner */}
          <div className="cmp-tip-card">
            <span className="cmp-tip-icon"><IconBulb /></span>
            <span className="cmp-tip-text">
              <strong>TIP</strong> Compare different CPUs, GPUs, resolutions, and settings to see which build delivers better performance for your games.
            </span>
          </div>

          {/* Big Action Button */}
          <div className="cmp-run-action-wrap">
            <button
              className={`cmp-run-gradient-btn${loading ? ' loading' : ''}`}
              onClick={handleCompare}
              disabled={loading}
            >
              <div className="btn-main-label">
                <IconScan />
                <span>{loading ? 'Analyzing Both Rigs…' : 'Run Comparison'}</span>
              </div>
              <div className="btn-sub-label">
                See performance and bottleneck results
              </div>
            </button>
          </div>

        </div>
      )}

      {/* Results View */}
      {results && (
        <div className="cmp-results-section">

          {/* Action Bar */}
          <div className="cmp-results-action-bar">
            <button className="cmp-back-btn" onClick={handleReset}>
              <IconArrowLeft /> Edit Configurations
            </button>
          </div>

          {/* ── 1. FPS Summary Row ── */}
          <div className="cmp-fps-summary-row">
            <FpsSummaryCard
              label="Rig A"
              accent="var(--primary)"
              result={results.a}
              isWinner={aWins}
              isTied={tied}
            />

            {/* Center Verdict Pill */}
            <div className="cmp-center-verdict">
              {(() => {
                const fpsAv = parseFloat(results.a.fps) || 0;
                const fpsBv = parseFloat(results.b.fps) || 0;
                const absDiff = Math.abs(fpsAv - fpsBv);
                const pctRaw = (absDiff / Math.max(1, Math.min(fpsAv, fpsBv))) * 100;
                const pct = Number.isFinite(pctRaw) ? Math.round(pctRaw) : 0;
                const isTooClose = absDiff < 2 || pct < 3;

                if (isTooClose) {
                  return (
                    <>
                      <div className="cmp-cv-icon cmp-cv-icon--tied"><IconEquals /></div>
                      <div className="cmp-cv-label">Essentially Tied</div>
                      <div className="cmp-cv-diff">≈ 0%</div>
                    </>
                  );
                }
                return (
                  <>
                    <div className="cmp-cv-icon"><IconSwords /></div>
                    <div className="cmp-cv-label">{aWins ? 'Rig A Wins' : 'Rig B Wins'}</div>
                    <div className="cmp-cv-diff">{pct}% faster</div>
                  </>
                );
              })()}
            </div>

            <FpsSummaryCard
              label="Rig B"
              accent="#818cf8"
              result={results.b}
              isWinner={bWins}
              isTied={tied}
            />
          </div>

          {/* ── 2. Spec Comparison Table ── */}
          <div className="cmp-spec-table-card">
            <div className="cmp-spec-table-header">
              <span className="cmp-spec-table-header-icon"><IconBarChart /></span>
              <span>Component Breakdown</span>
            </div>
            <div className="cmp-spec-table-wrap">
              <table className="cmp-spec-table">
                <thead>
                  <tr>
                    <th className="cmp-spec-th-label">Component</th>
                    <th className="cmp-spec-th-a">Rig A</th>
                    <th className="cmp-spec-th-b">Rig B</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="cmp-spec-td-label">
                      <span className="cmp-spec-icon"><IconCpu /></span>CPU
                    </td>
                    <td className={`cmp-spec-td${aWins || tied ? ' cmp-spec-td--highlight-a' : ''}`}>{rigA.cpu || '—'}</td>
                    <td className={`cmp-spec-td${bWins || tied ? ' cmp-spec-td--highlight-b' : ''}`}>{rigB.cpu || '—'}</td>
                  </tr>
                  <tr>
                    <td className="cmp-spec-td-label">
                      <span className="cmp-spec-icon"><IconGpu /></span>GPU
                    </td>
                    <td className={`cmp-spec-td${aWins || tied ? ' cmp-spec-td--highlight-a' : ''}`}>{rigA.gpu || '—'}</td>
                    <td className={`cmp-spec-td${bWins || tied ? ' cmp-spec-td--highlight-b' : ''}`}>{rigB.gpu || '—'}</td>
                  </tr>
                  <tr>
                    <td className="cmp-spec-td-label">
                      <span className="cmp-spec-icon"><IconRam /></span>RAM
                    </td>
                    <td className="cmp-spec-td">{rigA.ram} GB</td>
                    <td className="cmp-spec-td">{rigB.ram} GB</td>
                  </tr>
                  <tr>
                    <td className="cmp-spec-td-label">
                      <span className="cmp-spec-icon"><IconMonitor /></span>Resolution
                    </td>
                    <td className="cmp-spec-td">{rigA.resolution}</td>
                    <td className="cmp-spec-td">{rigB.resolution}</td>
                  </tr>
                  <tr>
                    <td className="cmp-spec-td-label">
                      <span className="cmp-spec-icon"><IconSliders /></span>Quality
                    </td>
                    <td className="cmp-spec-td">{rigA.settings}</td>
                    <td className="cmp-spec-td">{rigB.settings}</td>
                  </tr>
                  <tr>
                    <td className="cmp-spec-td-label">Bottleneck</td>
                    <td className="cmp-spec-td" style={{ color: results.a.bottleneck?.color || '#10b981', fontWeight: 600 }}>
                      {results.a.bottleneck?.type
                        ? results.a.bottleneck.type.charAt(0).toUpperCase() + results.a.bottleneck.type.slice(1)
                        : 'Balanced'}
                      {' '}({results.a.bottleneck?.severity ?? 0}%)
                    </td>
                    <td className="cmp-spec-td" style={{ color: results.b.bottleneck?.color || '#10b981', fontWeight: 600 }}>
                      {results.b.bottleneck?.type
                        ? results.b.bottleneck.type.charAt(0).toUpperCase() + results.b.bottleneck.type.slice(1)
                        : 'Balanced'}
                      {' '}({results.b.bottleneck?.severity ?? 0}%)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 3. Takeaway Banner ── */}
          <div className="cmp-takeaway-banner">
            <div className="cmp-takeaway-icon"><IconBulb /></div>
            <div className="cmp-takeaway-text">
              <span className="cmp-takeaway-label">Takeaway</span>
              <span className="cmp-takeaway-body">{buildVerdict()}</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
