import HardwareSearch from '../HardwareSearch';

// SVG Icons
const IconCpu = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);

const IconGpu = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="8" cy="12" r="2.5" />
    <circle cx="16" cy="12" r="2.5" />
    <line x1="6" y1="18" x2="6" y2="21" />
    <line x1="10" y1="18" x2="10" y2="21" />
    <line x1="14" y1="18" x2="14" y2="21" />
  </svg>
);

const IconRam = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

const IconDisplay = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const IconBolt = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconGauge = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v2" />
    <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
    <path d="M12 14l3-3" />
  </svg>
);

const IconShield = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconTarget = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const IconChart = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconGamepad = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="12" x2="10" y2="12" />
    <line x1="8" y1="10" x2="8" y2="14" />
    <line x1="15" y1="13" x2="15.01" y2="13" />
    <line x1="18" y1="11" x2="18.01" y2="11" />
    <rect x="2" y="6" width="20" height="12" rx="6" />
  </svg>
);

export default function BottleneckCalculatorPage({
  loadingData,
  selectedCpu,
  setSelectedCpu,
  setSelectedCpuData,
  selectedGpu,
  setSelectedGpu,
  setSelectedGpuData,
  ram,
  setRam,
  resolution,
  setResolution,
  settings,
  setSettings,
  isThinking,
  handleConsultAura,
  handleResetAnalysis,
  prediction,
  bottleneckData,
  recommendation,
  smartRec,
  selectedUpgradeComponent,
  generateSmartRecommendation,
  error,
  currentUser,
  onNavigate,
  onOpenSaveModal,
}) {
  // Semicircle gauge calculation
  const maxScaleFps = 165;
  const fpsNumber = prediction ? Number(prediction) : 0;
  const clampedFpsRatio = Math.min(Math.max(fpsNumber / maxScaleFps, 0.05), 1);
  const arcLength = 172.78; // PI * 55
  const strokeDashoffset = arcLength * (1 - clampedFpsRatio);

  // Derived metric cards data
  const isCpuBottleneck = bottleneckData?.type === 'cpu';
  const isGpuBottleneck = bottleneckData?.type === 'gpu';
  const severity = bottleneckData?.severity || 0;

  let cpuStatus = 'Good';
  let cpuSubtext = 'No significant bottleneck';
  let cpuColor = 'var(--green)';
  if (isCpuBottleneck) {
    if (severity >= 30) {
      cpuStatus = 'Bottleneck';
      cpuSubtext = 'Restricting graphics throughput';
      cpuColor = 'var(--red)';
    } else {
      cpuStatus = 'Mild Limit';
      cpuSubtext = 'Minor headroom constraint';
      cpuColor = 'var(--amber)';
    }
  } else if (severity <= 10) {
    cpuStatus = 'Good';
    cpuSubtext = 'Optimal CPU throughput';
    cpuColor = 'var(--green)';
  }

  let gpuStatus = 'Good';
  let gpuSubtext = 'Well utilizing the graphics card';
  let gpuColor = 'var(--green)';
  if (isGpuBottleneck) {
    if (severity >= 30) {
      gpuStatus = 'Bottleneck';
      gpuSubtext = 'Operating at maximum capacity';
      gpuColor = 'var(--red)';
    } else {
      gpuStatus = 'Mild Limit';
      gpuSubtext = 'Marginally limiting at high res';
      gpuColor = 'var(--amber)';
    }
  } else if (severity <= 10) {
    gpuStatus = 'Good';
    gpuSubtext = 'Well utilizing the graphics card';
    gpuColor = 'var(--green)';
  }

  const ramGB = parseInt(ram, 10) || 16;
  const ramStatus = ramGB >= 16 ? 'Sufficient' : 'Upgrade Suggested';
  const ramSubtext = ramGB >= 16 ? 'Meets recommended requirements' : '8GB may cause frame stutters';
  const ramColor = ramGB >= 16 ? 'var(--green)' : 'var(--amber)';

  let overallRating = 'Great';
  let overallSubtext = 'This setup should deliver smooth gameplay';
  let overallColor = 'var(--green)';
  if (severity > 40) {
    overallRating = 'Imbalanced';
    overallSubtext = 'Significant component mismatch present';
    overallColor = 'var(--red)';
  } else if (severity > 20) {
    overallRating = 'Fair';
    overallSubtext = 'Moderate component headroom difference';
    overallColor = 'var(--amber)';
  } else if (severity > 10) {
    overallRating = 'Good';
    overallSubtext = 'Solid setup with minor limits';
    overallColor = 'var(--green)';
  }

  // Dynamic explanation text
  const resLabel = resolution === '3840x2160' ? '4K' : resolution === '2560x1440' ? '1440p' : '1080p';
  let meaningText = `You can expect smooth gaming performance at ${resLabel} ${settings} settings in most modern titles.`;
  if (severity <= 10) {
    meaningText += ` Your CPU and GPU are well balanced with no significant bottleneck restrictions.`;
  } else if (isCpuBottleneck) {
    meaningText += ` In CPU-intensive titles, your processor may restrict peak framerates before your graphics card is fully saturated.`;
  } else if (isGpuBottleneck) {
    meaningText += ` At higher graphics fidelity, your graphics card is the primary hardware limiter.`;
  }

  // Bottleneck status banner text
  let bottleneckTitle = 'Well Balanced';
  let bottleneckIcon = '✓';
  let bottleneckDesc = 'Your system components are well matched for this workload.';
  let bottleneckBadgeColor = 'var(--green)';

  if (isCpuBottleneck) {
    bottleneckTitle = severity >= 30 ? 'CPU Bottleneck' : 'Mild CPU Limit';
    bottleneckIcon = '⚠️';
    bottleneckBadgeColor = severity >= 30 ? 'var(--red)' : 'var(--amber)';
    bottleneckDesc = bottleneckData?.message || 'Your processor is holding back graphics card output.';
  } else if (isGpuBottleneck) {
    bottleneckTitle = severity >= 30 ? 'GPU Bottleneck' : 'Mild GPU Limit';
    bottleneckIcon = '⚠️';
    bottleneckBadgeColor = severity >= 30 ? 'var(--red)' : 'var(--amber)';
    bottleneckDesc = bottleneckData?.message || 'Your graphics card is running near 100% capacity.';
  }

  return (
    <div className="analyzer-page-wrapper">
      
      {/* ── 1. PAGE HEADER ── */}
      <header className="analyzer-page-header">
        <h1 className="analyzer-headline">
          PC Bottleneck &amp; Performance Analyzer
        </h1>
        <p className="analyzer-subheadline">
          Select your CPU, GPU, and target resolution to estimate gaming FPS and determine if your processor or graphics card is the bottleneck.
        </p>
      </header>

      {/* ── 2. TWO-COLUMN MAIN GRID ── */}
      <main className="analyzer-main-grid">
        
        {/* LEFT COLUMN: YOUR PC COMPONENTS CARD */}
        <section className="analyzer-card configuration-card" aria-labelledby="config-card-title">
          <div className="card-header-bar">
            <span className="card-icon-wrap text-cyan">
              <IconBolt />
            </span>
            <h2 id="config-card-title" className="card-title-text">Your PC Components</h2>
          </div>

          {loadingData && (
            <div className="loading-data-pill">
              <span>⏳ Loading hardware database (CPUs &amp; GPUs)...</span>
            </div>
          )}

          <div className="form-subheading">Your Components</div>

          <div className="form-group">
            <label htmlFor="cpu-search-input">Processor (CPU)</label>
            <HardwareSearch 
              type="cpu" 
              placeholder="Type to search CPUs (e.g. Ryzen 7 7800X3D, Core i7-14700K)..." 
              value={selectedCpu}
              onSelect={(item) => {
                setSelectedCpu(item.cpuName);
                setSelectedCpuData(item);
              }} 
            />
          </div>

          <div className="form-group">
            <label htmlFor="gpu-search-input">Graphics Card (GPU)</label>
            <HardwareSearch 
              type="gpu" 
              placeholder="Type to search GPUs (e.g. RTX 4070 Ti, RX 7800 XT)..." 
              value={selectedGpu}
              onSelect={(item) => {
                setSelectedGpu(item.Device);
                setSelectedGpuData(item);
              }} 
            />
          </div>

          <div className="form-subheading">Target Workload Settings</div>

          <div className="form-row-2col">
            <div className="form-group">
              <label htmlFor="resolution-select">Target Resolution</label>
              <select id="resolution-select" value={resolution} onChange={e => setResolution(e.target.value)}>
                <option value="1920x1080">1080p (FHD - 1920 &times; 1080)</option>
                <option value="2560x1440">1440p (QHD - 2560 &times; 1440)</option>
                <option value="3840x2160">4K (UHD - 3840 &times; 2160)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="settings-select">Graphics Quality Preset</label>
              <select id="settings-select" value={settings} onChange={e => setSettings(e.target.value)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Ultra">Ultra</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ram-select">System RAM Capacity</label>
            <select id="ram-select" value={ram} onChange={e => setRam(e.target.value)}>
              <option value="4">4 GB</option>
              <option value="8">8 GB</option>
              <option value="16">16 GB (Recommended)</option>
              <option value="32">32 GB</option>
              <option value="64">64 GB</option>
            </select>
          </div>

          <div className="config-actions-stack">
            <button
              id="run-analysis-btn"
              className={`btn-primary-action${isThinking ? ' loading' : ''}`}
              onClick={handleConsultAura}
              disabled={isThinking}
            >
              <span className="btn-icon">
                <IconBolt />
              </span>
              {isThinking ? 'Analyzing…' : 'Run Analysis'}
            </button>

            <button
              id="compare-rigs-btn"
              className="btn-secondary-action"
              onClick={() => onNavigate('/compare')}
            >
              Compare Rigs
            </button>

            {prediction && (
              <button
                className="btn-ghost-action"
                onClick={handleResetAnalysis}
              >
                &larr; Back to Selection
              </button>
            )}
          </div>

          {error && (
            <div className="error-banner">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </section>


        {/* RIGHT COLUMN: PERFORMANCE RESULT CARD */}
        <section className="analyzer-card result-panel-card" aria-labelledby="result-card-title">
          <div className="card-header-bar">
            <span className="card-icon-wrap text-cyan">
              <IconGauge />
            </span>
            <h2 id="result-card-title" className="card-title-text">Performance Result</h2>
          </div>

          {/* STATE A: THINKING / LOADING */}
          {isThinking && (
            <div className="result-loading-state">
              <div className="loading-spinner" />
              <h3 className="loading-title">Analyzing your configuration…</h3>
              <p className="loading-subtext">Evaluating hardware compute tiers and calculating frame delivery estimates.</p>
            </div>
          )}

          {/* STATE B: EMPTY STATE (Before running analysis) */}
          {!isThinking && !prediction && (
            <div className="result-empty-state">
              <div className="empty-state-icon-box">
                <IconChart />
              </div>
              <h3 className="empty-state-title">Ready to analyze</h3>
              <p className="empty-state-desc">
                Select your PC components on the left and click <strong>&quot;Run Analysis&quot;</strong> to see your estimated gaming performance and hardware bottleneck evaluation.
              </p>
            </div>
          )}

          {/* STATE C: ACTIVE RESULT STATE */}
          {!isThinking && prediction && bottleneckData && (
            <div className="result-active-content">
              
              {/* Top Hero Section: Semicircle Gauge + Bottleneck Summary */}
              <div className="result-hero-row">
                
                {/* Gauge Area */}
                <div className="fps-gauge-container">
                  <div className="gauge-svg-wrap">
                    <svg viewBox="0 0 160 90" className="gauge-svg">
                      {/* Background track */}
                      <path
                        d="M 25 75 A 55 55 0 0 1 135 75"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeWidth="11"
                        strokeLinecap="round"
                      />
                      {/* Active colored arc */}
                      <path
                        d="M 25 75 A 55 55 0 0 1 135 75"
                        fill="none"
                        stroke={bottleneckBadgeColor}
                        strokeWidth="11"
                        strokeDasharray={arcLength}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="gauge-arc-active"
                      />
                    </svg>

                    <div className="gauge-center-text">
                      <div className="gauge-fps-value">{prediction}</div>
                      <div className="gauge-fps-unit">FPS</div>
                    </div>
                  </div>
                  <div className="gauge-fps-label">Estimated Average FPS</div>
                </div>

                {/* Bottleneck Status Details */}
                <div className="bottleneck-status-block">
                  <span className="section-micro-label">Bottleneck</span>
                  
                  <div className="bottleneck-status-badge" style={{ color: bottleneckBadgeColor }}>
                    <span className="badge-icon-bullet">{bottleneckIcon}</span>
                    <span className="badge-title-text">{bottleneckTitle}</span>
                  </div>

                  <p className="bottleneck-summary-desc">
                    {bottleneckDesc}
                  </p>
                </div>

              </div>

              {/* 4 Performance Metric Cards */}
              <div className="metrics-quad-grid">
                
                <div className="metric-box">
                  <div className="metric-box-header">
                    <span className="metric-box-icon text-cyan"><IconCpu /></span>
                    <span className="metric-box-title">CPU Performance</span>
                  </div>
                  <div className="metric-box-value" style={{ color: cpuColor }}>{cpuStatus}</div>
                  <div className="metric-box-sub">{cpuSubtext}</div>
                </div>

                <div className="metric-box">
                  <div className="metric-box-header">
                    <span className="metric-box-icon text-indigo"><IconGpu /></span>
                    <span className="metric-box-title">GPU Performance</span>
                  </div>
                  <div className="metric-box-value" style={{ color: gpuColor }}>{gpuStatus}</div>
                  <div className="metric-box-sub">{gpuSubtext}</div>
                </div>

                <div className="metric-box">
                  <div className="metric-box-header">
                    <span className="metric-box-icon text-amber"><IconRam /></span>
                    <span className="metric-box-title">RAM Capacity</span>
                  </div>
                  <div className="metric-box-value" style={{ color: ramColor }}>{ramStatus}</div>
                  <div className="metric-box-sub">{ramSubtext}</div>
                </div>

                <div className="metric-box">
                  <div className="metric-box-header">
                    <span className="metric-box-icon text-cyan"><IconDisplay /></span>
                    <span className="metric-box-title">Overall Rating</span>
                  </div>
                  <div className="metric-box-value" style={{ color: overallColor }}>{overallRating}</div>
                  <div className="metric-box-sub">{overallSubtext}</div>
                </div>

              </div>

              {/* "What this means" Panel */}
              <div className="what-this-means-panel">
                <div className="means-header">
                  <span className="means-icon-box">💡</span>
                  <span className="means-title">What this means</span>
                </div>
                <p className="means-body-text">
                  {meaningText}
                </p>
              </div>

              {/* Smart Upgrade Recommendation (if severity >= 30) */}
              {bottleneckData.severity >= 30 && (
                <div className="smart-rec-container">
                  <div className="smart-rec-header-row">
                    <span className="smart-rec-heading">Component Upgrade Advisor</span>
                    <div className="smart-rec-picker">
                      {['GPU', 'CPU', 'RAM'].map((comp) => (
                        <button
                          key={comp}
                          className={`smart-tab-btn ${selectedUpgradeComponent === comp ? 'active' : ''}`}
                          onClick={() => generateSmartRecommendation(comp)}
                        >
                          {comp}
                        </button>
                      ))}
                    </div>
                  </div>

                  {smartRec ? (
                    <div className="smart-rec-details-grid">
                      <div className="smart-rec-field">
                        <span className="smart-field-lbl">Recommended:</span>
                        <span className="smart-field-val text-cyan">{smartRec.recommended}</span>
                      </div>
                      <div className="smart-rec-field">
                        <span className="smart-field-lbl">Expected Uplift:</span>
                        <span className="smart-field-val text-emerald">{smartRec.improvement}</span>
                      </div>
                      <div className="smart-rec-field full-row">
                        <span className="smart-field-lbl">Compatibility Note:</span>
                        <span className="smart-field-val">{smartRec.compatibility}</span>
                      </div>
                      <p className="smart-field-tip">{smartRec.tip}</p>
                    </div>
                  ) : (
                    <div className="smart-rec-field" style={{ padding: '0.5rem 0' }}>
                      <span className="smart-field-val">
                        {recommendation?.title}: <strong className="text-cyan">{recommendation?.hardware}</strong>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Disclaimer + Actions Bar */}
              <div className="result-disclaimer-bar">
                <div className="disclaimer-info-text">
                  <span className="info-icon-badge">ℹ️</span>
                  <span>Predictions are estimates and may vary based on game, driver version, background apps, and system conditions.</span>
                </div>
                <button
                  className="btn-methodology-link"
                  onClick={() => onNavigate('/methodology')}
                >
                  How it works?
                </button>
              </div>

              {/* Secondary Result Actions */}
              <div className="result-actions-footer">
                <button
                  className="btn-save-rig-pill"
                  onClick={() => {
                    if (!currentUser) {
                      if (window.confirm('You need an account to save PC builds to your profile. Would you like to sign in?')) {
                        onNavigate('/auth');
                      }
                      return;
                    }
                    onOpenSaveModal();
                  }}
                >
                  💾 Save Rig
                </button>
                <button
                  className="btn-quotation-link"
                  onClick={() => onNavigate('/quotation')}
                >
                  View Pricing (LKR)
                </button>
              </div>

            </div>
          )}
        </section>

      </main>

      {/* ── 3. BOTTOM FEATURE STRIP ── */}
      <footer className="analyzer-feature-strip" aria-label="Project Aura Platform Capabilities">
        
        <div className="feature-strip-cell">
          <div className="feature-cell-icon text-cyan">
            <IconShield />
          </div>
          <div className="feature-cell-content">
            <h3 className="feature-cell-title">Data-Driven Predictions</h3>
            <p className="feature-cell-desc">Trained on real hardware benchmarks and gaming data</p>
          </div>
        </div>

        <div className="feature-strip-cell">
          <div className="feature-cell-icon text-cyan">
            <IconTarget />
          </div>
          <div className="feature-cell-content">
            <h3 className="feature-cell-title">Bottleneck Detection</h3>
            <p className="feature-cell-desc">Identify CPU or GPU limitations in your system</p>
          </div>
        </div>

        <div className="feature-strip-cell">
          <div className="feature-cell-icon text-indigo">
            <IconChart />
          </div>
          <div className="feature-cell-content">
            <h3 className="feature-cell-title">Resolution &amp; Quality Aware</h3>
            <p className="feature-cell-desc">Get accurate FPS estimates for your target settings</p>
          </div>
        </div>

        <div className="feature-strip-cell">
          <div className="feature-cell-icon text-purple">
            <IconGamepad />
          </div>
          <div className="feature-cell-content">
            <h3 className="feature-cell-title">Game Ready</h3>
            <p className="feature-cell-desc">Make informed decisions and enjoy better gaming experiences</p>
          </div>
        </div>

      </footer>

    </div>
  );
}
