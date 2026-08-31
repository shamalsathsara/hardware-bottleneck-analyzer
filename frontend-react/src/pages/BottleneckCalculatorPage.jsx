import { useState } from 'react';
import HardwareSearch from '../HardwareSearch';
import { getExplanation, generateQA } from '../utils/BottleneckLogic';

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
  confidence,
  bottleneckData,
  recommendation,
  smartRec,
  selectedUpgradeComponent,
  generateSmartRecommendation,
  explanationType,
  setExplanationType,
  error,
  currentUser,
  onNavigate,
  onOpenSaveModal,
  SRI_LK_STORES,
}) {
  const [showHelp, setShowHelp] = useState(false);
  const [openQA, setOpenQA] = useState(null);

  const qaItems = generateQA(bottleneckData);

  return (
    <div className="calculator-page-wrap">
      <div className="dashboard-shell">

        {/* ── LEFT SIDEBAR (Quick Actions / Stores / Q&A) ── */}
        <aside className="left-sidebar" aria-label="Support and Knowledge Base">
          <div className="sidebar-section-title">Quick Support</div>

          <button
            id="sidebar-need-help"
            className={`sidebar-action-btn need-help-btn ${showHelp ? 'active' : ''}`}
            onClick={() => setShowHelp(prev => !prev)}
            title="Show Sri Lankan PC stores and helpful Q&A"
          >
            <span className="sidebar-btn-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </span>
            Need Hardware Help?
          </button>

          {showHelp && (
            <div className="left-sidebar-help-content" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="right-panel-card">
                <div className="right-panel-heading">
                  <span className="right-panel-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  </span>
                  Sri Lankan PC Stores
                </div>
                <div className="store-cards-list">
                  {SRI_LK_STORES.map((store, index) => (
                    <div key={index} className="store-card">
                      <div className="store-card-name">{store.name}</div>
                      <p className="store-card-desc" style={{ fontSize: '0.8rem' }}>{store.description}</p>
                      <a
                        href={store.url}
                        target="_blank"
                        rel="noreferrer"
                        className="store-card-link"
                      >
                        Visit Store
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '4px' }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <div className="right-panel-card">
                <div className="right-panel-heading">
                  <span className="right-panel-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </span>
                  Helpful Q&amp;A
                </div>
                <div className="qa-list">
                  {qaItems.map((item, index) => (
                    <div key={index} className="qa-item">
                      <button
                        className={`qa-question ${openQA === index ? 'open' : ''}`}
                        onClick={() => setOpenQA(openQA === index ? null : index)}
                        style={{ fontSize: '0.85rem' }}
                      >
                        <span>{item.q}</span>
                        <span className={`qa-chevron ${openQA === index ? 'rotated' : ''}`}>
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </span>
                      </button>
                      {openQA === index && (
                        <div className="qa-answer" style={{ fontSize: '0.8rem' }}>
                          <p>{item.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ── MAIN CONTENT AREA ── */}
        <main className="analyzer-main">

          {/* Header */}
          <section className="hero">
            <div className="hero-tag">
              <span className="hero-tag-icon">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8"/></svg>
              </span>
              Powered by Random Forest ML
            </div>
            <h1>PC Bottleneck Calculator</h1>
            <p>
              Select your processor, graphics card, and target resolution to predict gaming FPS and determine whether your CPU or GPU limits peak performance.
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-value">3.64</div>
                <div className="stat-label">FPS Error Margin</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">100</div>
                <div className="stat-label">Ensemble Trees</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">4K</div>
                <div className="stat-label">Max Resolution</div>
              </div>
            </div>
          </section>

          {/* Hardware Configuration Tool Card */}
          <section className="analyzer-card" id="analyzer">
            <div className="card-title">
              <span className="card-title-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </span>
              Hardware Configuration
            </div>

            {loadingData && (
              <div style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
                <span style={{ display: 'inline-block', marginRight: '5px' }}>⏳</span>
                Loading hardware database (CPUs &amp; GPUs)...
              </div>
            )}

            <div className="section-label">Your Components</div>

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

            <div className="section-label">Target Workload Settings</div>

            <div className="form-row">
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

            <div className="action-buttons-row" style={{ display: 'flex', gap: '1rem', marginTop: '1.2rem', flexWrap: 'wrap' }}>
              <button
                className={`action-btn${isThinking ? ' loading' : ''}`}
                onClick={handleConsultAura}
                disabled={isThinking}
                style={{ flex: '1', minWidth: '200px' }}
              >
                <span className="btn-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
                </span>
                {isThinking ? 'Aura is Analyzing…' : 'Run Analysis'}
              </button>

              <button
                id="compare-rigs-btn"
                className="compare-action-btn"
                onClick={() => onNavigate('/compare')}
                title="Compare two PC builds side by side"
              >
                Compare Rigs
              </button>
              
              <button
                className="save-pc-btn"
                onClick={() => {
                  if (!selectedCpu || !selectedGpu) {
                    alert('Please select a CPU and GPU before saving.');
                    return;
                  }
                  if (!currentUser) {
                    if (window.confirm('You need an account to save PC builds to your profile. Would you like to sign in?')) {
                      onNavigate('/auth');
                    }
                    return;
                  }
                  onOpenSaveModal();
                }}
              >
                Save this PC
              </button>
            </div>

            {error && (
              <div className="error-banner" style={{ marginTop: '1rem' }}>
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Results Display */}
            {prediction && bottleneckData && (
              <div className="results-wrapper">

                <button
                  onClick={handleResetAnalysis}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-sub)',
                    padding: '0.6rem 1.2rem',
                    borderRadius: 'var(--radius)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sub)'; }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  Back to Selection
                </button>

                {/* Main Results Card */}
                <div className={`results-card ${bottleneckData.cardClass}`}>
                  <div className="fps-display">
                    <div className="fps-label">Predicted Performance</div>
                    <div className="fps-value" style={{ color: bottleneckData.color }}>
                      {prediction}<span className="fps-unit" style={{ color: bottleneckData.color }}>FPS</span>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      AI Accuracy: {confidence}%
                    </div>
                  </div>

                  <div className="bottleneck-header">
                    <span className="bottleneck-label">Bottleneck Severity</span>
                    <span className="bottleneck-pct" style={{ color: bottleneckData.color }}>{bottleneckData.severity}%</span>
                  </div>

                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${bottleneckData.severity}%`, background: bottleneckData.color }} />
                  </div>

                  <div className="bottleneck-msg-wrap">
                    <p className="bottleneck-message">{bottleneckData.message}</p>
                  </div>

                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => onNavigate('/quotation')}
                      className="save-pc-btn"
                      style={{ background: 'rgba(56,189,248,0.1)' }}
                    >
                      View Live Pricing Quotation (LKR)
                    </button>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem', lineHeight: '1.4' }}>
                    * Performance and FPS values are AI-generated regression estimates. Real-world framerates may vary based on GPU drivers, background apps, cooling/thermal throttling, and game updates.
                  </p>
                </div>

                {/* Recommendation Card */}
                {recommendation && (
                  <div className="recommendation-card">
                    <div className="rec-header">
                      {recommendation.title}
                    </div>
                    <div className="rec-hardware">
                      {recommendation.hardware}
                    </div>
                    <p className="rec-desc">
                      Upgrading to this component will significantly reduce your system bottleneck and increase overall gaming performance.
                    </p>
                  </div>
                )}

                {/* Smart Component Recommendation Panel */}
                {bottleneckData.severity >= 30 && (
                  <div className="smart-rec-panel">
                    <div className="smart-rec-title">
                      Upgrade Recommendation
                    </div>

                    <p className="smart-rec-question">Which component would you like to upgrade?</p>

                    <div className="smart-rec-choices">
                      <button
                        id="smart-rec-cpu-btn"
                        className={`smart-rec-choice-btn ${selectedUpgradeComponent === 'CPU' ? 'selected' : ''}`}
                        onClick={() => generateSmartRecommendation('CPU')}
                      >
                        CPU
                      </button>
                      <button
                        id="smart-rec-gpu-btn"
                        className={`smart-rec-choice-btn ${selectedUpgradeComponent === 'GPU' ? 'selected' : ''}`}
                        onClick={() => generateSmartRecommendation('GPU')}
                      >
                        GPU
                      </button>
                      <button
                        id="smart-rec-ram-btn"
                        className={`smart-rec-choice-btn ${selectedUpgradeComponent === 'RAM' ? 'selected' : ''}`}
                        onClick={() => generateSmartRecommendation('RAM')}
                      >
                        RAM
                      </button>
                    </div>

                    {smartRec && (
                      <div className="smart-rec-result">
                        <div className="smart-rec-row">
                          <span className="smart-rec-label">Recommended</span>
                          <span className="smart-rec-value highlight">{smartRec.recommended}</span>
                        </div>
                        <div className="smart-rec-row">
                          <span className="smart-rec-label">Est. Improvement</span>
                          <span className="smart-rec-value green">{smartRec.improvement}</span>
                        </div>
                        <div className="smart-rec-row">
                          <span className="smart-rec-label">Compatibility</span>
                          <span className="smart-rec-value">{smartRec.compatibility}</span>
                        </div>
                        <div className="smart-rec-row">
                          <span className="smart-rec-label">Priority</span>
                          <span className="smart-rec-value">{smartRec.priority}</span>
                        </div>
                        <div className="smart-rec-tip">
                          <p>{smartRec.tip}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation Panel */}
                <div className="explanation-panel">
                  <div className="explanation-title">
                    Performance Explanation
                  </div>

                  <div className="explanation-toggle">
                    <button
                      id="explanation-technical-btn"
                      className={`exp-toggle-btn ${explanationType === 'technical' ? 'active' : ''}`}
                      onClick={() => setExplanationType('technical')}
                    >
                      Technical Reason
                    </button>
                    <button
                      id="explanation-nontechnical-btn"
                      className={`exp-toggle-btn ${explanationType === 'nontechnical' ? 'active' : ''}`}
                      onClick={() => setExplanationType('nontechnical')}
                    >
                      Non-Technical Reason
                    </button>
                  </div>

                  {explanationType && (
                    <div className="explanation-text">
                      <p>{getExplanation(bottleneckData, explanationType)}</p>
                    </div>
                  )}

                  {!explanationType && (
                    <p className="explanation-prompt">
                      Select an explanation style above to understand why this bottleneck is happening.
                    </p>
                  )}
                </div>

              </div>
            )}
          </section>

          {/* ── EDUCATIONAL GUIDE ACCORDION / EXPLAINER ── */}
          <section className="calculator-guide-section" aria-labelledby="guide-title">
            <h2 id="guide-title" className="section-headline" style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>
              Understanding Your Results
            </h2>

            <div className="guide-cards-grid">
              <div className="guide-card">
                <h3>What is a PC Bottleneck?</h3>
                <p>
                  A bottleneck occurs when one component in your PC reaches 100% capacity and prevents the remaining hardware from operating at peak throughput. For example, if your CPU cannot prepare render frames quickly enough, your GPU will sit idle waiting for draw calls.
                </p>
              </div>

              <div className="guide-card">
                <h3>How to Interpret Severity</h3>
                <p>
                  <strong>0% – 10% (Balanced):</strong> Your CPU and GPU are well-matched. No upgrades needed.<br />
                  <strong>15% – 30% (Mild Bottleneck):</strong> Minor performance limitation at specific resolutions.<br />
                  <strong>50%+ (Severe Bottleneck):</strong> Major mismatch causing frame stutters and low utilization.
                </p>
              </div>

              <div className="guide-card">
                <h3>Why Real-World FPS Can Differ</h3>
                <p>
                  FPS predictions represent average gameplay across modern gaming workloads. Individual game optimizations, ray tracing settings, background applications, and cooling thermals will cause natural framerate variance.
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <a 
                href="/methodology" 
                className="interpret-link"
                onClick={(e) => { e.preventDefault(); onNavigate('/methodology'); }}
              >
                Learn more about our Random Forest ML methodology &rarr;
              </a>
            </div>
          </section>

        </main>

      </div>
    </div>
  );
}
