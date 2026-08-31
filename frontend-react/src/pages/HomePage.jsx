export default function HomePage({ onNavigate }) {
  const handleNav = (route, e) => {
    if (e) e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onNavigate(route);
  };

  return (
    <div className="home-page">
      
      {/* -------------------------------------------------------------------
          1. HERO SECTION
      -------------------------------------------------------------------- */}
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-glow-blob-1" />
        <div className="hero-glow-blob-2" />
        <div className="hero-container">
          
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            <span>ML-Powered Gaming Performance Engine</span>
          </div>

          <h1 id="hero-title" className="hero-headline">
            Know Your PC <span className="text-gradient">Before You Upgrade.</span>
          </h1>

          <p className="hero-subheadline">
            AI-powered PC bottleneck analysis and gaming performance estimates based on your hardware configuration. Identify component bottlenecks and unlock peak framerates.
          </p>

          <div className="hero-cta-group">
            <a 
              href="/bottleneck-calculator" 
              className="btn-primary-glow"
              onClick={(e) => handleNav('/bottleneck-calculator', e)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Analyze My PC
            </a>

            <a 
              href="/compare" 
              className="btn-secondary-glass"
              onClick={(e) => handleNav('/compare', e)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              Compare Rigs
            </a>
          </div>

          {/* Mini Interactive Preview Card */}
          <div className="hero-preview-card">
            <div className="preview-header">
              <span className="preview-indicator" />
              <span className="preview-title">Live Hardware Balance Simulation</span>
              <span className="preview-tag">Random Forest Model</span>
            </div>
            <div className="preview-grid">
              <div className="preview-stat">
                <span className="stat-label">Target Resolution</span>
                <span className="stat-value text-cyan">2560 &times; 1440 (1440p)</span>
              </div>
              <div className="preview-stat">
                <span className="stat-label">Estimated FPS</span>
                <span className="stat-value text-emerald">144+ FPS</span>
              </div>
              <div className="preview-stat">
                <span className="stat-label">Bottleneck Status</span>
                <span className="stat-value text-cyan">Balanced Build (99.2% match)</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* -------------------------------------------------------------------
          2. TRUST & FEATURE STRIP
      -------------------------------------------------------------------- */}
      <section className="feature-strip-section" aria-label="Key Platform Capabilities">
        <div className="feature-strip-container">
          
          <div className="strip-item">
            <div className="strip-icon-box">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div>
              <h3 className="strip-title">ML-Powered Analysis</h3>
              <p className="strip-desc">Trained Random Forest regression architecture</p>
            </div>
          </div>

          <div className="strip-item">
            <div className="strip-icon-box">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8"/></svg>
            </div>
            <div>
              <h3 className="strip-title">CPU &amp; GPU Detection</h3>
              <p className="strip-desc">Calculates compute headroom &amp; component balance</p>
            </div>
          </div>

          <div className="strip-item">
            <div className="strip-icon-box">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <div>
              <h3 className="strip-title">FPS Estimation</h3>
              <p className="strip-desc">Infers expected gaming frame delivery</p>
            </div>
          </div>

          <div className="strip-item">
            <div className="strip-icon-box">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <div>
              <h3 className="strip-title">Resolution-Aware</h3>
              <p className="strip-desc">Differentiates 1080p, 1440p &amp; 4K workloads</p>
            </div>
          </div>

        </div>
      </section>

      {/* -------------------------------------------------------------------
          3. HOW PROJECT AURA WORKS (3 STEPS)
      -------------------------------------------------------------------- */}
      <section className="steps-section" aria-labelledby="steps-title">
        <div className="section-container">
          
          <div className="section-header-center">
            <span className="section-eyebrow">Simplified Workflow</span>
            <h2 id="steps-title" className="section-headline">How Project Aura Works</h2>
            <p className="section-subheadline">
              Three clear steps to discover if your processor or graphics card is limiting your gaming experience.
            </p>
          </div>

          <div className="steps-grid">
            
            <div className="step-card">
              <div className="step-number">01</div>
              <h3 className="step-title">Select Your Hardware</h3>
              <p className="step-desc">
                Search and select your exact CPU, GPU, system RAM capacity, target resolution, and graphics preset from our comprehensive hardware database.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <h3 className="step-title">Run the ML Analysis</h3>
              <p className="step-desc">
                Our scikit-learn regression model processes your continuous specs (cores, threads, TDP, VRAM, bandwidth) to calculate performance headroom.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <h3 className="step-title">Understand Your Performance</h3>
              <p className="step-desc">
                Review your predicted framerate, bottleneck severity percentage, upgrade recommendations, and plain-language technical explanations.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* -------------------------------------------------------------------
          4. CORE TOOL FEATURE SPOTLIGHT
      -------------------------------------------------------------------- */}
      <section className="spotlight-section" aria-labelledby="spotlight-title">
        <div className="section-container">
          <div className="spotlight-card">
            
            <div className="spotlight-content">
              <span className="section-eyebrow">Core Performance Tool</span>
              <h2 id="spotlight-title" className="spotlight-headline">
                PC Bottleneck Calculator
              </h2>
              <p className="spotlight-desc">
                Discover the exact relationship between your processor and graphics card. Project Aura evaluates whether your CPU can generate draw calls fast enough to keep your GPU fully utilized.
              </p>
              
              <ul className="spotlight-features">
                <li>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Evaluates CPU cores, threads, and clock architectural limits</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Analyzes GPU VRAM, memory bus bandwidth, and compute units</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Simulates 1080p, 1440p, and 4K Ultra gaming presets</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Provides tailored smart component upgrade recommendations</span>
                </li>
              </ul>

              <div style={{ marginTop: '2rem' }}>
                <a 
                  href="/bottleneck-calculator" 
                  className="btn-primary-glow"
                  onClick={(e) => handleNav('/bottleneck-calculator', e)}
                >
                  Run Bottleneck Analysis
                </a>
              </div>
            </div>

            <div className="spotlight-visual">
              <div className="visual-box">
                <div className="visual-badge">Sample Output</div>
                <div className="visual-stat-row">
                  <span>Predicted Frame Rate</span>
                  <strong className="text-emerald">162 FPS</strong>
                </div>
                <div className="visual-bar-wrap">
                  <div className="visual-bar-label">
                    <span>Severity</span>
                    <span className="text-emerald">5% (Balanced)</span>
                  </div>
                  <div className="visual-bar-track">
                    <div className="visual-bar-fill" style={{ width: '5%', background: '#10b981' }} />
                  </div>
                </div>
                <p className="visual-quote">
                  "Balanced Build: Your CPU and GPU work together efficiently with balanced compute utilization."
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------
          5. WHY USE PROJECT AURA?
      -------------------------------------------------------------------- */}
      <section className="why-section" aria-labelledby="why-title">
        <div className="section-container">
          
          <div className="section-header-center">
            <span className="section-eyebrow">Key Advantages</span>
            <h2 id="why-title" className="section-headline">Why Use Project Aura?</h2>
            <p className="section-subheadline">
              Engineered to provide transparent, data-driven hardware insights before you spend money on upgrades.
            </p>
          </div>

          <div className="why-grid">
            
            <div className="why-card">
              <div className="why-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              </div>
              <h3 className="why-card-title">Smarter Upgrade Decisions</h3>
              <p className="why-card-desc">
                Stop guessing which part is holding back your framerates. Find out whether you need a new GPU, CPU, or additional memory before purchasing.
              </p>
            </div>

            <div className="why-card">
              <div className="why-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <h3 className="why-card-title">Gaming-Focused Modeling</h3>
              <p className="why-card-desc">
                Trained specifically on real-world gaming performance data rather than purely synthetic mathematical formulas.
              </p>
            </div>

            <div className="why-card">
              <div className="why-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/></svg>
              </div>
              <h3 className="why-card-title">Resolution-Aware Predictions</h3>
              <p className="why-card-desc">
                High-refresh 1080p gaming taxes your CPU, while 4K shifts the load to your graphics card. Our model adjusts across all resolutions.
              </p>
            </div>

            <div className="why-card">
              <div className="why-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <h3 className="why-card-title">Side-by-Side Rig Comparison</h3>
              <p className="why-card-desc">
                Compare your current gaming PC against a prospective new build to see exact projected framerate gains before upgrading.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* -------------------------------------------------------------------
          6. HOW RESULTS SHOULD BE INTERPRETED (TRANSPARENCY)
      -------------------------------------------------------------------- */}
      <section className="interpret-section" aria-labelledby="interpret-title">
        <div className="section-container">
          <div className="interpret-card">
            
            <div className="interpret-header">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary)' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <h2 id="interpret-title" className="interpret-headline">
                How Should Results Be Interpreted?
              </h2>
            </div>

            <p className="interpret-desc">
              Project Aura provides <strong>Machine Learning regression estimates</strong>. While our models are calibrated against realistic hardware benchmarks, real-world gaming performance is influenced by multiple external factors:
            </p>

            <div className="interpret-points-grid">
              <div className="interpret-point">
                <strong>Game-Specific Optimization:</strong> Different game engines scale differently across CPU threads and GPU architectures.
              </div>
              <div className="interpret-point">
                <strong>Thermal Throttling &amp; Cooling:</strong> High ambient temperatures or thermal paste degradation can reduce sustained boost clocks.
              </div>
              <div className="interpret-point">
                <strong>Background Applications:</strong> Streaming software, anti-virus, and active browser tabs consume CPU cores and memory bandwidth.
              </div>
              <div className="interpret-point">
                <strong>GPU Drivers &amp; OS Updates:</strong> Graphics drivers and Windows scheduler updates frequently optimize hardware utilization.
              </div>
            </div>

            <div className="interpret-footer">
              <span>Want to learn more about our Random Forest architecture and data normalization?</span>
              <a 
                href="/methodology" 
                className="interpret-link"
                onClick={(e) => handleNav('/methodology', e)}
              >
                Read our ML Methodology &rarr;
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------
          7. FINAL CALL TO ACTION
      -------------------------------------------------------------------- */}
      <section className="final-cta-section">
        <div className="section-container">
          <div className="final-cta-box">
            <h2 className="final-cta-title">Ready to Analyze Your PC?</h2>
            <p className="final-cta-desc">
              Select your processor, graphics card, and memory in seconds. Get instant bottleneck calculations and FPS predictions.
            </p>
            <div className="final-cta-buttons">
              <a 
                href="/bottleneck-calculator" 
                className="btn-primary-glow"
                onClick={(e) => handleNav('/bottleneck-calculator', e)}
              >
                Analyze My PC Now
              </a>
              <a 
                href="/compare" 
                className="btn-secondary-glass"
                onClick={(e) => handleNav('/compare', e)}
              >
                Compare Two Builds
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
