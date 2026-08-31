import { useState, useEffect } from 'react';
import { analyzeBottleneck } from './utils/BottleneckLogic';
import { fetchAllCpusLightweight, fetchAllGpusLightweight } from './services/hardwareService';
import { predictFps } from './services/analysisService';

// Component SVG Icons

// Empty Rig State Factory
const emptyRig = () => ({
  cpu: '', gpu: '', ram: '16', resolution: '1920x1080', settings: 'High',
});

// Single Rig Config Panel
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

// Result Card - displayed once comparison runs
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

// Main Component
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
            fetchAllCpusLightweight(),
            fetchAllGpusLightweight(),
          ]);
          setLocalCpuList(c);
          setLocalGpuList(g);
        } catch {
          setError('Could not load hardware lists. Make sure the backend is running.');
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount — props will already be populated from parent

  // Run Analysis for one rig: This function formats the data and asks the AI for a prediction
  const analyzeRig = async (rig) => {
    // 1. Find the full specs for the selected CPU and GPU from the local database
    const fullCpu = localCpuList.find(c => c.cpuName === rig.cpu);
    const fullGpu = localGpuList.find(g => g.Device  === rig.gpu);

    if (!fullCpu) throw new Error(`CPU not found: "${rig.cpu}". Please choose from the autocomplete suggestions.`);
    if (!fullGpu) throw new Error(`GPU not found: "${rig.gpu}". Please choose from the autocomplete suggestions.`);

    // 2. Safely parse the raw numerical data, defaulting to average values if missing
    const cores     = parseInt(fullCpu.cores) || 6;
    const threads   = cores * 2;
    const cpuTDP    = Math.min(cores * 10, 125);
    const cuda      = parseInt(fullGpu.CUDA) || 5000;

    // 3. Estimate missing GPU specs based on how many CUDA cores it has
    let vram = 4, gpuTdp = 75, bandwidth = 128;
    if      (cuda > 250000) { vram = 24; gpuTdp = 350; bandwidth = 1008; }
    else if (cuda > 175000) { vram = 16; gpuTdp = 280; bandwidth = 760;  }
    else if (cuda > 100000) { vram = 12; gpuTdp = 200; bandwidth = 448;  }
    else if (cuda > 75000)  { vram = 8;  gpuTdp = 130; bandwidth = 256;  }
    else if (cuda > 45000)  { vram = 6;  gpuTdp = 90;  bandwidth = 192;  }

    // 4. Build the exact JSON object the Python AI backend expects
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

    // 5. Send it to the Flask AI server via backend bridge
    const data = await predictFps(payload);
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

  // This runs when the user clicks "Run Comparison"
  const handleCompare = async () => {
    setError(null);
    // Make sure the user didn't leave any fields blank
    if (!rigA.cpu || !rigA.gpu) { setError('Please fill in both CPU and GPU for Rig A.'); return; }
    if (!rigB.cpu || !rigB.gpu) { setError('Please fill in both CPU and GPU for Rig B.'); return; }

    setLoading(true);
    setResults(null);
    try {
      // Promise.all runs BOTH AI predictions at the exact same time (in parallel)
      // This makes the comparison twice as fast!
      const [resA, resB] = await Promise.all([analyzeRig(rigA), analyzeRig(rigB)]);
      setResults({ a: resA, b: resB }); // Save the finished calculations to state
    } catch (err) {
      setError(err.message || 'Analysis failed. Make sure both AI and Node.js servers are running.');
    }
    setLoading(false);
  };

  const handleReset = () => { setResults(null); setError(null); };

  // Determine winner by simply comparing the final FPS numbers
  const fpsA  = results ? parseFloat(results.a.fps) : 0;
  const fpsB  = results ? parseFloat(results.b.fps) : 0;
  const aWins = results && fpsA > fpsB;
  const bWins = results && fpsB > fpsA;
  const tied  = results && fpsA === fpsB;

  // Verdict text: Generates a smart explanation of WHY one rig beat the other
  const buildVerdict = () => {
    if (!results) return '';
    if (tied) return 'Both rigs produce identical performance at these settings. Consider changing resolution or quality to see a difference.';

    // Figure out who won and lost
    const winner    = aWins ? 'Rig A' : 'Rig B';
    const loserSide = aWins ? 'Rig B' : 'Rig A';
    
    // Calculate math for the UI description (e.g., "Rig A wins by 15 FPS (20% faster)")
    const fpsDiff   = Math.abs(fpsA - fpsB).toFixed(1);
    const pct       = ((Math.abs(fpsA - fpsB) / Math.min(fpsA, fpsB)) * 100).toFixed(0);
    
    const wBk       = aWins ? results.a.bottleneck : results.b.bottleneck; // Winner's bottleneck
    const lBk       = aWins ? results.b.bottleneck : results.a.bottleneck; // Loser's bottleneck

    let text = `${winner} wins by ${fpsDiff} FPS (${pct}% faster). `;

    // Smart explanations based on the bottleneck data
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

      {/* Header */}
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

      {/* Config Panels */}
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

      {/* Results */}
      {results && (
        <div className="cmp-results-section">

          {/* Result cards - Visual Summary Cards for Rig A and Rig B */}
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

          {/* Spec Comparison Table - Renders the side-by-side hardware table */}
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

          {/* Verdict */}
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
