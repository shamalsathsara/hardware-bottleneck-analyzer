export default function MethodologyPage({ onNavigate }) {
  const handleNav = (route, e) => {
    if (e) e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onNavigate(route);
  };

  return (
    <div className="info-page">
      <div className="info-container">
        
        {/* Header */}
        <header className="info-header">
          <span className="section-eyebrow">Technical Whitepaper</span>
          <h1 className="info-headline">Machine Learning &amp; Methodology</h1>
          <p className="info-lead">
            A comprehensive, transparent explanation of how Project Aura predicts gaming framerates and evaluates hardware bottlenecks.
          </p>
        </header>

        {/* 1. Core Model Architecture */}
        <section className="info-card">
          <h2 className="info-section-title">1. The ML Regression Architecture</h2>
          <p>
            Project Aura uses a trained <strong>Random Forest Regressor</strong> (consisting of an ensemble of 100 decision trees) to map multi-dimensional PC hardware configurations into estimated gaming frame rates (FPS).
          </p>
          <p>
            Unlike simple synthetic linear calculators that apply rigid multipliers, a Random Forest ensemble captures non-linear interactions between CPU thread limits, memory bandwidth saturation, and graphical resolution scaling.
          </p>

          <div className="info-subcard" style={{ marginTop: '1.2rem' }}>
            <h3 className="subcard-title text-cyan">Input Feature Schema (71 Dimensions)</h3>
            <p>
              When a user submits a configuration, the backend constructs a structured feature vector combining continuous physical attributes and one-hot categorical flags:
            </p>
            <ul className="info-list" style={{ marginTop: '0.8rem' }}>
              <li><strong>Continuous CPU Metrics:</strong> Physical Core Count, Thread Count, Thermal Design Power (TDP in Watts), and CPU PassMark scores.</li>
              <li><strong>Continuous GPU Metrics:</strong> Video RAM capacity (VRAM in GB), Memory Bus Bandwidth (GB/s), CUDA/Compute units, and GPU TDP.</li>
              <li><strong>System Memory:</strong> Total installed RAM capacity (GB).</li>
              <li><strong>Workload Target:</strong> Target display resolution (1920&times;1080, 2560&times;1440, 3840&times;2160) and graphics fidelity presets (Low, Medium, High, Ultra).</li>
            </ul>
          </div>
        </section>

        {/* 2. Bottleneck Calculation & Performance Index */}
        <section className="info-card">
          <h2 className="info-section-title">2. Bottleneck Severity &amp; Tier Analysis</h2>
          <p>
            In addition to raw FPS regression, Project Aura assesses the <em>proportional balance</em> between processor and graphics compute potential:
          </p>
          
          <div className="math-explainer-box">
            <code>
              CPU Performance Index = min(sqrt(CPU_Mark / 60,000) &times; 100, 100)<br />
              GPU Performance Index = min(sqrt(GPU_CUDA / 400,000) &times; 100, 100)
            </code>
          </div>

          <p style={{ marginTop: '1rem' }}>
            The square root curve models the real-world principle of diminishing returns in PC hardware: doubling compute scores at the high end provides a smaller perceived uplift than upgrading an entry-level tier.
          </p>
          <p>
            The difference between the resulting 1–10 hardware tiers determines the <strong>Bottleneck Severity Percentage</strong>:
          </p>
          
          <div className="severity-table-wrap">
            <table className="method-table">
              <thead>
                <tr>
                  <th>Tier Difference</th>
                  <th>Severity</th>
                  <th>Classification</th>
                  <th>Real-World Effect</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>0 Tiers</td>
                  <td className="text-emerald">0%</td>
                  <td>Balanced Build</td>
                  <td>Optimal CPU/GPU utilization ratio</td>
                </tr>
                <tr>
                  <td>1 Tier</td>
                  <td className="text-emerald">5%</td>
                  <td>Slightly Limited</td>
                  <td>Negligible impact on real gameplay</td>
                </tr>
                <tr>
                  <td>2 Tiers</td>
                  <td className="text-amber">15%</td>
                  <td>Mild Bottleneck</td>
                  <td>Minor frame delivery headroom untapped</td>
                </tr>
                <tr>
                  <td>3 Tiers</td>
                  <td className="text-amber">30%</td>
                  <td>Noticeable Bottleneck</td>
                  <td>Component visibly constrains peak FPS</td>
                </tr>
                <tr>
                  <td>4+ Tiers</td>
                  <td className="text-rose">50% – 85%</td>
                  <td>Severe Bottleneck</td>
                  <td>Heavy stuttering or GPU underutilization</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Real-World Limitations & Variables */}
        <section className="info-card">
          <h2 className="info-section-title">3. Real-World Factors &amp; Model Limitations</h2>
          <p>
            Machine learning models provide an informed mathematical prediction, but actual in-game framerates can vary due to environmental and software factors:
          </p>

          <div className="info-grid-2">
            <div className="info-subcard">
              <h3 className="subcard-title">Game Engine Architecture</h3>
              <p>
                Esports titles (e.g., CS2, Valorant) are heavily single-threaded and CPU-bound, whereas modern AAA titles (e.g., Cyberpunk 2077) heavily saturate GPU ray-tracing pipelines.
              </p>
            </div>

            <div className="info-subcard">
              <h3 className="subcard-title">Thermal Throttling</h3>
              <p>
                Poor cooling or high ambient temperatures cause modern CPUs and GPUs to automatically drop boost clock frequencies to prevent overheating.
              </p>
            </div>

            <div className="info-subcard">
              <h3 className="subcard-title">Background System Load</h3>
              <p>
                Discord streams, background browser tabs, OBS encoding, and anti-virus software consume CPU cycles and RAM bandwidth simultaneously with the game.
              </p>
            </div>

            <div className="info-subcard">
              <h3 className="subcard-title">Drivers &amp; OS Updates</h3>
              <p>
                GPU manufacturers frequently release Game Ready driver updates providing 10–25% day-one performance gains on optimized titles.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="info-cta-bar">
          <div>
            <h3 style={{ margin: '0 0 0.4rem 0', color: 'var(--text-main)' }}>Test the model with your hardware</h3>
            <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.9rem' }}>
              Run our AI Bottleneck Calculator and see your estimated framerate.
            </p>
          </div>
          <a 
            href="/bottleneck-calculator" 
            className="btn-primary-glow"
            onClick={(e) => handleNav('/bottleneck-calculator', e)}
          >
            Run Bottleneck Analysis
          </a>
        </div>

      </div>
    </div>
  );
}
