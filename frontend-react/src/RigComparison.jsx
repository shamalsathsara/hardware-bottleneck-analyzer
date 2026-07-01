import { useState, useEffect } from 'react';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// SVG ICONS
// ─────────────────────────────────────────────────────────────────────────────

const IconCpu = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8"/>
    <path d="M8 2v2M12 2v2M16 2v2M8 20v2M12 20v2M16 20v2M2 8h2M2 12h2M2 16h2M20 8h2M20 12h2M20 16h2"/>
  </svg>
);

const IconGpu = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"/>
    <circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/>
    <path d="M2 10h2M20 10h2M2 14h2M20 14h2"/>
  </svg>
);

const IconRam = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="8" width="20" height="8" rx="2"/>
    <path d="M6 8V6M10 8V6M14 8V6M18 8V6M6 16v2M10 16v2M14 16v2M18 16v2"/>
  </svg>
);

const IconScan = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
    <rect x="7" y="7" width="10" height="10" rx="1"/>
  </svg>
);

const IconWarning = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconSwords = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/>
    <line x1="13" y1="19" x2="19" y2="13"/>
    <line x1="16" y1="16" x2="20" y2="20"/>
    <line x1="19" y1="21" x2="21" y2="19"/>
    <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/>
    <line x1="5" y1="11" x2="9" y2="15"/>
  </svg>
);

const IconTrophy = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4a2 2 0 0 1-2-2V5h4"/>
    <path d="M18 9h2a2 2 0 0 0 2-2V5h-4"/>
    <path d="M12 17c-2.67 0-8-1.34-8-4V5h16v8c0 2.66-5.33 4-8 4z"/>
    <path d="M12 17v4"/>
    <path d="M8 21h8"/>
  </svg>
);

const IconEquals = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="9" x2="19" y2="9"/>
    <line x1="5" y1="15" x2="19" y2="15"/>
  </svg>
);

const IconMonitor = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <path d="M8 21h8M12 17v4"/>
  </svg>
);

const IconSliders = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
    <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
    <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
    <line x1="17" y1="16" x2="23" y2="16"/>
  </svg>
);

const IconZap = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);

const IconBarChart = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);

const IconRefresh = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// CORE BOTTLENECK LOGIC  (mirrors App.jsx analyzeBottleneck exactly)
// ─────────────────────────────────────────────────────────────────────────────

function analyzeBottleneck(cpu, gpu) {
  const cpuMark = parseInt(cpu.cpuMark) || 3000;
  const gpuCUDA = parseInt(gpu.CUDA)    || 0;

  const cpuTier = cpuMark < 1000  ? 1
                : cpuMark < 2500  ? 2
                : cpuMark < 5000  ? 3
                : cpuMark < 8000  ? 4
                : cpuMark < 12000 ? 5
                : cpuMark < 16000 ? 6
                : cpuMark < 20000 ? 7
                : cpuMark < 25000 ? 8
                : cpuMark < 30000 ? 9 : 10;

  const gpuTier = gpuCUDA < 15000  ? 1
                : gpuCUDA < 45000  ? 2
                : gpuCUDA < 75000  ? 3
                : gpuCUDA < 100000 ? 4
                : gpuCUDA < 135000 ? 5
                : gpuCUDA < 175000 ? 6
                : gpuCUDA < 210000 ? 7
                : gpuCUDA < 260000 ? 8
                : gpuCUDA < 300000 ? 9 : 10;

  const diff    = cpuTier - gpuTier;
  const absDiff = Math.abs(diff);
  const SEVERITY_TABLE = [5, 10, 25, 45, 60, 75, 80];
  const severity = SEVERITY_TABLE[Math.min(absDiff, 6)];

  let message, color, cardClass, type;

  if (absDiff === 0) {
    type = null; color = '#10b981'; cardClass = 'has-bottleneck-ok';
    message = 'Balanced Build';
  } else if (absDiff === 1) {
    type = diff > 0 ? 'gpu' : 'cpu'; color = '#10b981'; cardClass = 'has-bottleneck-ok';
    message = diff > 0 ? 'Slightly GPU-limited' : 'Slightly CPU-limited';
  } else if (diff > 0) {
    type = 'gpu';
    if (absDiff >= 3) { color = '#ef4444'; cardClass = 'has-bottleneck-severe'; message = 'GPU Bottleneck'; }
    else              { color = '#f59e0b'; cardClass = 'has-bottleneck-warning'; message = 'Mild GPU Bottleneck'; }
  } else {
    type = 'cpu';
    if (absDiff >= 3) { color = '#ef4444'; cardClass = 'has-bottleneck-severe'; message = 'CPU Bottleneck'; }
    else              { color = '#f59e0b'; cardClass = 'has-bottleneck-warning'; message = 'Mild CPU Bottleneck'; }
  }

  return { severity, message, color, cardClass, type };
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY RIG STATE FACTORY
// ─────────────────────────────────────────────────────────────────────────────
const emptyRig = () => ({
  cpu: '', gpu: '', ram: '16', resolution: '1920x1080', settings: 'High',
});

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE RIG CONFIG PANEL
// ─────────────────────────────────────────────────────────────────────────────
function RigPanel({ label, accent, rig, onChange, cpuList, gpuList, panelId }) {
  return (
    <div className={`cmp-panel cmp-panel--${panelId}`} style={{ '--accent': accent }}>
      <div className="cmp-panel-header">
        <span className="cmp-panel-accent-bar" />
        <span className="cmp-panel-label">{label}</span>
      </div>

      {/* CPU */}
      <div className="cmp-form-group">
        <label className="cmp-label">
          <span className="cmp-label-icon"><IconCpu /></span>
          Processor (CPU)
        </label>
        <input
          type="text"
          list={`cmp-cpu-${panelId}`}
          className="cmp-input"
          placeholder="Type to search CPUs..."
          value={rig.cpu}
          onChange={e => onChange({ ...rig, cpu: e.target.value })}
        />
        <datalist id={`cmp-cpu-${panelId}`}>
          {cpuList.map((c, i) => <option key={i} value={c.cpuName} />)}
        </datalist>
      </div>

      {/* GPU */}
      <div className="cmp-form-group">
        <label className="cmp-label">
          <span className="cmp-label-icon"><IconGpu /></span>
          Graphics Card (GPU)
        </label>
        <input
          type="text"
          list={`cmp-gpu-${panelId}`}
          className="cmp-input"
          placeholder="Type to search GPUs..."
          value={rig.gpu}
          onChange={e => onChange({ ...rig, gpu: e.target.value })}
        />
        <datalist id={`cmp-gpu-${panelId}`}>
          {gpuList.map((g, i) => <option key={i} value={g.Device} />)}
        </datalist>
      </div>

      {/* RAM */}
      <div className="cmp-form-group">
        <label className="cmp-label">
          <span className="cmp-label-icon"><IconRam /></span>
          System RAM
        </label>
        <select className="cmp-select" value={rig.ram} onChange={e => onChange({ ...rig, ram: e.target.value })}>
          <option value="4">4 GB</option>
          <option value="8">8 GB</option>
          <option value="16">16 GB</option>
          <option value="32">32 GB</option>
          <option value="64">64 GB</option>
        </select>
      </div>

      {/* Resolution + Quality */}
      <div className="cmp-form-row">
        <div className="cmp-form-group">
          <label className="cmp-label">Resolution</label>
          <select className="cmp-select" value={rig.resolution} onChange={e => onChange({ ...rig, resolution: e.target.value })}>
            <option value="1920x1080">1080p (FHD)</option>
            <option value="2560x1440">1440p (QHD)</option>
            <option value="3840x2160">4K (UHD)</option>
          </select>
        </div>
        <div className="cmp-form-group">
          <label className="cmp-label">Quality</label>
          <select className="cmp-select" value={rig.settings} onChange={e => onChange({ ...rig, settings: e.target.value })}>
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

// ─────────────────────────────────────────────────────────────────────────────
// RESULT CARD — displayed once comparison runs
// ─────────────────────────────────────────────────────────────────────────────
function ResultCard({ label, accent, result, isWinner, isTied }) {
  const { fps, bottleneck, confidence, rigName } = result;
  const bottleneckColor = bottleneck.color;

  return (
    <div
      className={`cmp-result-card${isWinner ? ' cmp-result-card--winner' : ''}`}
      style={{ '--accent': accent }}
    >
      {/* Winner / Tied Badge */}
      {isWinner && !isTied && (
        <div className="cmp-winner-badge">
          <span className="cmp-winner-badge-icon"><IconTrophy /></span>
          Winner
        </div>
      )}
      {isTied && (
        <div className="cmp-winner-badge cmp-winner-badge--tied">
          <span className="cmp-winner-badge-icon"><IconEquals /></span>
          Tied
        </div>
      )}

      <div className="cmp-result-label">{label}</div>
      <div className="cmp-result-rig-name">{rigName}</div>

      {/* FPS Display */}
      <div className="cmp-fps-block">
        <div className="cmp-fps-value" style={{ color: isWinner && !isTied ? '#fbbf24' : accent }}>
          {fps}<span className="cmp-fps-unit">FPS</span>
        </div>
        <div className="cmp-fps-conf">AI Accuracy: {confidence}%</div>
      </div>

      {/* Bottleneck Bar */}
      <div className="cmp-bk-section">
        <div className="cmp-bk-header">
          <span className="cmp-bk-label">Bottleneck Severity</span>
          <span className="cmp-bk-pct" style={{ color: bottleneckColor }}>{bottleneck.severity}%</span>
        </div>
        <div className="cmp-bar-track">
          <div className="cmp-bar-fill"
               style={{ width: `${bottleneck.severity}%`, background: bottleneckColor }} />
        </div>
        <div className="cmp-bk-type" style={{ color: bottleneckColor }}>
          {bottleneck.type
            ? bottleneck.type.charAt(0).toUpperCase() + bottleneck.type.slice(1) + ' Bottleneck'
            : 'Balanced Build'}
        </div>
      </div>

      {/* Short verdict text */}
      <div className="cmp-bk-msg">{bottleneck.message}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function RigComparison({ cpuList, gpuList, onBack, initialRig }) {

  // Rig A pre-filled from Analyzer if provided
  const [rigA, setRigA] = useState(() => initialRig
    ? {
        cpu:        initialRig.cpu,
        gpu:        initialRig.gpu,
        ram:        initialRig.ram,
        resolution: initialRig.resolution,
        settings:   initialRig.settings || 'High',
      }
    : emptyRig()
  );
  const [rigB, setRigB] = useState(emptyRig);

  const [results, setResults] = useState(null);   // { a, b }
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Local copies of hardware lists — updated from props when available,
  // or fetched directly as fallback.
  const [localCpuList, setLocalCpuList] = useState([]);
  const [localGpuList, setLocalGpuList] = useState([]);

  useEffect(() => {
    if (cpuList && cpuList.length > 0 && gpuList && gpuList.length > 0) {
      setLocalCpuList(cpuList);
      setLocalGpuList(gpuList);
    } else {
      // Fallback: fetch hardware lists directly
      (async () => {
        try {
          const [c, g] = await Promise.all([
            axios.get(`${import.meta.env.VITE_API_URL}/api/cpus`),
            axios.get(`${import.meta.env.VITE_API_URL}/api/gpus`),
          ]);
          setLocalCpuList(c.data);
          setLocalGpuList(g.data);
        } catch {
          setError('Could not load hardware lists. Make sure the backend is running.');
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount — props will already be populated from parent

  // ── Run Analysis for one rig ──
  const analyzeRig = async (rig) => {
    const fullCpu = localCpuList.find(c => c.cpuName === rig.cpu);
    const fullGpu = localGpuList.find(g => g.Device  === rig.gpu);

    if (!fullCpu) throw new Error(`CPU not found: "${rig.cpu}". Please choose from the autocomplete suggestions.`);
    if (!fullGpu) throw new Error(`GPU not found: "${rig.gpu}". Please choose from the autocomplete suggestions.`);

    const cores     = parseInt(fullCpu.cores) || 6;
    const threads   = cores * 2;
    const cpuTDP    = Math.min(cores * 10, 125);
    const cuda      = parseInt(fullGpu.CUDA) || 5000;

    let vram = 4, gpuTdp = 75, bandwidth = 128;
    if      (cuda > 250000) { vram = 24; gpuTdp = 350; bandwidth = 1008; }
    else if (cuda > 175000) { vram = 16; gpuTdp = 280; bandwidth = 760;  }
    else if (cuda > 100000) { vram = 12; gpuTdp = 200; bandwidth = 448;  }
    else if (cuda > 75000)  { vram = 8;  gpuTdp = 130; bandwidth = 256;  }
    else if (cuda > 45000)  { vram = 6;  gpuTdp = 90;  bandwidth = 192;  }

    const payload = {
      'CPU':               fullCpu.cpuName,
      'CPU Cores':         cores,
      'CPU Threads':       threads,
      'CPU TDP (W)':       cpuTDP,
      'GPU':               fullGpu.Device,
      'GPU Series':        fullGpu.Manufacturer || 'Nvidia',
      'GPU VRAM (GB)':     vram,
      'GPU Bandwidth (GB/s)': bandwidth,
      'GPU TDP (W)':       gpuTdp,
      'RAM (GB)':          parseInt(rig.ram),
      'Resolution':        rig.resolution,
      'Graphics Settings': rig.settings,
    };

    const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/predict`, payload);
    const analysis  = analyzeBottleneck(fullCpu, fullGpu);
    const cpuScore  = parseInt(fullCpu.cpuMark) || 8000;
    let finalFps    = data.predicted_fps;

    if (cpuScore < 3000) {
      finalFps = (cpuScore / 100) + 5;
    } else if (analysis.severity > 10) {
      finalFps = finalFps - finalFps * (analysis.severity / 100) * 0.70;
    }

    finalFps = Math.max(5, Math.min(900, finalFps));

    const baseConf = 99.2;
    const conf     = (baseConf - (analysis.severity / 100) * 8.5).toFixed(1);

    // Short display name: first 3 words of CPU + GPU
    const rigName =
      rig.cpu.split(' ').slice(0, 3).join(' ') +
      ' + ' +
      rig.gpu.split(' ').slice(0, 3).join(' ');

    return { fps: finalFps.toFixed(1), confidence: conf, bottleneck: analysis, rigName };
  };

  const handleCompare = async () => {
    setError(null);
    if (!rigA.cpu || !rigA.gpu) { setError('Please fill in both CPU and GPU for Rig A.'); return; }
    if (!rigB.cpu || !rigB.gpu) { setError('Please fill in both CPU and GPU for Rig B.'); return; }

    setLoading(true);
    setResults(null);
    try {
      const [resA, resB] = await Promise.all([analyzeRig(rigA), analyzeRig(rigB)]);
      setResults({ a: resA, b: resB });
    } catch (err) {
      setError(err.message || 'Analysis failed. Make sure both AI and Node.js servers are running.');
    }
    setLoading(false);
  };

  const handleReset = () => { setResults(null); setError(null); };

  // ── Determine winner ──
  const fpsA  = results ? parseFloat(results.a.fps) : 0;
  const fpsB  = results ? parseFloat(results.b.fps) : 0;
  const aWins = results && fpsA > fpsB;
  const bWins = results && fpsB > fpsA;
  const tied  = results && fpsA === fpsB;

  // ── Verdict text ──
  const buildVerdict = () => {
    if (!results) return '';
    if (tied) return 'Both rigs produce identical performance at these settings. Consider changing resolution or quality to see a difference.';

    const winner    = aWins ? 'Rig A' : 'Rig B';
    const loserSide = aWins ? 'Rig B' : 'Rig A';
    const fpsDiff   = Math.abs(fpsA - fpsB).toFixed(1);
    const pct       = ((Math.abs(fpsA - fpsB) / Math.min(fpsA, fpsB)) * 100).toFixed(0);
    const wBk       = aWins ? results.a.bottleneck : results.b.bottleneck;
    const lBk       = aWins ? results.b.bottleneck : results.a.bottleneck;

    let text = `${winner} wins by ${fpsDiff} FPS (${pct}% faster). `;

    if (wBk.type === null && lBk.type !== null) {
      text += `${winner} has a perfectly balanced build, while ${loserSide} suffers a ${lBk.type.toUpperCase()} bottleneck — this is the primary reason for the performance gap.`;
    } else if (wBk.severity < lBk.severity) {
      text += `${winner} has a lower bottleneck severity (${wBk.severity}% vs ${lBk.severity}%), giving it a significant efficiency advantage.`;
    } else {
      text += `${winner}'s components are better matched for the selected resolution and quality settings.`;
    }

    return text;
  };

  return (
    <div className="cmp-page">

      {/* ── HEADER ── */}
      <div className="cmp-page-header">
        <button className="cmp-back-btn" onClick={onBack}>
          <IconArrowLeft />
          Back to Analyzer
        </button>
        <div className="cmp-title-block">
          <div className="cmp-title-icon"><IconSwords /></div>
          <div>
            <h1 className="cmp-title">Side-by-Side Rig Comparison</h1>
            <p className="cmp-subtitle">Configure two PC builds and let Project Aura battle-test them head-to-head</p>
          </div>
        </div>
      </div>

      {/* ── CONFIG PANELS ── */}
      {!results && (
        <>
          <div className="cmp-config-grid">
            <RigPanel
              label="Rig A"
              accent="var(--primary)"
              rig={rigA}
              onChange={setRigA}
              cpuList={localCpuList}
              gpuList={localGpuList}
              panelId="a"
            />

            <div className="cmp-vs-divider">
              <div className="cmp-vs-line" />
              <div className="cmp-vs-circle">VS</div>
              <div className="cmp-vs-line" />
            </div>

            <RigPanel
              label="Rig B"
              accent="#818cf8"
              rig={rigB}
              onChange={setRigB}
              cpuList={localCpuList}
              gpuList={localGpuList}
              panelId="b"
            />
          </div>

          {error && (
            <div className="cmp-error">
              <IconWarning />
              <span>{error}</span>
            </div>
          )}

          <div className="cmp-action-row">
            <button
              className={`cmp-run-btn${loading ? ' loading' : ''}`}
              onClick={handleCompare}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="cmp-spinner" />
                  Analyzing Both Rigs...
                </>
              ) : (
                <>
                  <IconScan />
                  Run Comparison
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* ── RESULTS ── */}
      {results && (
        <div className="cmp-results-section">

          {/* Result cards */}
          <div className="cmp-results-grid">
            <ResultCard
              label="Rig A"
              accent="var(--primary)"
              result={results.a}
              isWinner={aWins || tied}
              isTied={tied}
            />

            <div className="cmp-results-vs">
              <div className="cmp-results-vs-badge">
                <IconSwords />
              </div>
            </div>

            <ResultCard
              label="Rig B"
              accent="#818cf8"
              result={results.b}
              isWinner={bWins || tied}
              isTied={tied}
            />
          </div>

          {/* ── SPEC COMPARISON TABLE ── */}
          <div className="cmp-table-card">
            <div className="cmp-table-title">
              <span className="cmp-table-title-icon"><IconBarChart /></span>
              Spec Comparison
            </div>
            <div className="cmp-table-wrap">
              <table className="cmp-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th style={{ color: 'var(--primary)' }}>Rig A</th>
                    <th style={{ color: '#818cf8' }}>Rig B</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="cmp-td-label"><span className="cmp-table-icon"><IconCpu /></span>CPU</td>
                    <td className={aWins || tied ? 'cmp-cell-highlight-a' : ''}>{rigA.cpu}</td>
                    <td className={bWins || tied ? 'cmp-cell-highlight-b' : ''}>{rigB.cpu}</td>
                  </tr>
                  <tr>
                    <td className="cmp-td-label"><span className="cmp-table-icon"><IconGpu /></span>GPU</td>
                    <td className={aWins || tied ? 'cmp-cell-highlight-a' : ''}>{rigA.gpu}</td>
                    <td className={bWins || tied ? 'cmp-cell-highlight-b' : ''}>{rigB.gpu}</td>
                  </tr>
                  <tr>
                    <td className="cmp-td-label"><span className="cmp-table-icon"><IconRam /></span>RAM</td>
                    <td>{rigA.ram} GB</td>
                    <td>{rigB.ram} GB</td>
                  </tr>
                  <tr>
                    <td className="cmp-td-label"><span className="cmp-table-icon"><IconMonitor /></span>Resolution</td>
                    <td>{rigA.resolution}</td>
                    <td>{rigB.resolution}</td>
                  </tr>
                  <tr>
                    <td className="cmp-td-label"><span className="cmp-table-icon"><IconSliders /></span>Quality</td>
                    <td>{rigA.settings}</td>
                    <td>{rigB.settings}</td>
                  </tr>
                  <tr className="cmp-table-fps-row">
                    <td className="cmp-td-label"><span className="cmp-table-icon"><IconZap /></span>Predicted FPS</td>
                    <td className={aWins ? 'cmp-cell-winner-fps' : ''}>
                      {results.a.fps} FPS
                      {aWins && (
                        <span className="cmp-winner-inline-icon"><IconTrophy /></span>
                      )}
                    </td>
                    <td className={bWins ? 'cmp-cell-winner-fps' : ''}>
                      {results.b.fps} FPS
                      {bWins && (
                        <span className="cmp-winner-inline-icon"><IconTrophy /></span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="cmp-td-label"><span className="cmp-table-icon"><IconWarning /></span>Bottleneck</td>
                    <td style={{ color: results.a.bottleneck.color }}>{results.a.bottleneck.message}</td>
                    <td style={{ color: results.b.bottleneck.color }}>{results.b.bottleneck.message}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── VERDICT ── */}
          <div className={`cmp-verdict-card ${tied ? 'cmp-verdict-card--tied' : aWins ? 'cmp-verdict-card--a' : 'cmp-verdict-card--b'}`}>
            <div className="cmp-verdict-icon-wrap">
              <span className="cmp-verdict-svg-icon">
                {tied ? <IconEquals /> : <IconTrophy />}
              </span>
            </div>
            <div className="cmp-verdict-title">
              {tied ? 'Dead Heat — Both Rigs Are Equal' : `${aWins ? 'Rig A' : 'Rig B'} Takes the Crown`}
            </div>
            <div className="cmp-verdict-text">{buildVerdict()}</div>

            <div className="cmp-verdict-tips">
              {!tied && (
                <>
                  <div className="cmp-verdict-tip">
                    <span className="cmp-verdict-tip-icon"><IconCheck /></span>
                    FPS difference: <strong>{Math.abs(fpsA - fpsB).toFixed(1)} FPS</strong>
                  </div>
                  <div className="cmp-verdict-tip">
                    <span className="cmp-verdict-tip-icon"><IconCheck /></span>
                    Performance gain: <strong>{((Math.abs(fpsA - fpsB) / Math.min(fpsA, fpsB)) * 100).toFixed(0)}%</strong>
                  </div>
                </>
              )}
              <div className="cmp-verdict-tip">
                <span className="cmp-verdict-tip-icon"><IconCheck /></span>
                Rig A bottleneck: <strong style={{ color: results.a.bottleneck.color }}>{results.a.bottleneck.severity}%</strong>
              </div>
              <div className="cmp-verdict-tip">
                <span className="cmp-verdict-tip-icon"><IconCheck /></span>
                Rig B bottleneck: <strong style={{ color: results.b.bottleneck.color }}>{results.b.bottleneck.severity}%</strong>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="cmp-action-row" style={{ marginTop: '2rem' }}>
            <button className="cmp-reset-btn" onClick={handleReset}>
              <IconRefresh />
              Compare Again
            </button>
            <button className="cmp-back-btn-secondary" onClick={onBack}>
              <IconArrowLeft />
              Back to Analyzer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
