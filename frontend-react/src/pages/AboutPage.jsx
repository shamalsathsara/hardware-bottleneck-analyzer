export default function AboutPage({ onNavigate }) {
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
          <span className="section-eyebrow">Platform Overview</span>
          <h1 className="info-headline">About Project Aura</h1>
          <p className="info-lead">
            An ML-powered PC gaming performance and bottleneck analysis platform designed to help gamers make data-driven hardware decisions.
          </p>
        </header>

        {/* Mission Section */}
        <section className="info-card">
          <h2 className="info-section-title">Our Mission</h2>
          <p>
            Upgrading or building a gaming PC can be intimidating and expensive. Gamers frequently purchase high-end graphics cards only to find their existing processor cannot feed frames fast enough, or pair a budget GPU with an overkill CPU.
          </p>
          <p>
            <strong>Project Aura</strong> was created to eliminate guesswork. By training Machine Learning models on hardware specifications and gaming benchmark figures, we provide clear, actionable bottleneck insights and expected framerates across 1080p, 1440p, and 4K resolutions.
          </p>
        </section>

        {/* Technology */}
        <section className="info-card">
          <h2 className="info-section-title">How It Works</h2>
          <p>
            Project Aura is built on a <strong>Random Forest ML regression model</strong> trained on hardware specifications and gaming benchmark data. When you enter your CPU, GPU, RAM, resolution, and quality preset, the model predicts framerate based on learned patterns from real hardware configurations.
          </p>
          <p>
            The platform runs as a full-stack application: a <strong>React frontend</strong> communicates with a <strong>Node.js API</strong> that handles authentication and hardware data, and a <strong>Python inference service</strong> serves the ML model predictions.
          </p>
          <p>
            Our bottleneck calculation is based on comparing normalized CPU and GPU performance tiers derived from benchmark data — not arbitrary percentages.
          </p>
        </section>

        {/* Key Objectives */}
        <section className="info-card">
          <h2 className="info-section-title">What Makes Project Aura Different?</h2>
          <ul className="info-list">
            <li>
              <strong>Data-Driven ML Modeling:</strong> We replace arbitrary mathematical guesswork with a trained Random Forest model that evaluates continuous hardware attributes including cores, threads, memory bandwidth, VRAM, and RAM.
            </li>
            <li>
              <strong>Multi-Resolution Awareness:</strong> CPU bottlenecks dominate at 1080p high-refresh gaming, whereas GPU memory bus saturation dominates at 4K. Our model reflects this behavior.
            </li>
            <li>
              <strong>No Paywalls &amp; No Forced Accounts:</strong> The Bottleneck Calculator and Rig Comparison tools are freely accessible without requiring an account.
            </li>
            <li>
              <strong>Transparent Predictions:</strong> We clearly label all results as ML regression estimates and link to our Methodology page explaining the model in detail.
            </li>
          </ul>
        </section>

        {/* Bottom CTA */}
        <div className="info-cta-bar">
          <div>
            <h3 style={{ margin: '0 0 0.4rem 0', color: 'var(--text-main)' }}>Ready to analyze your hardware?</h3>
            <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.9rem' }}>
              Run the Bottleneck Analyzer in seconds with your current setup.
            </p>
          </div>
          <a 
            href="/bottleneck-calculator" 
            className="btn-primary-glow"
            onClick={(e) => handleNav('/bottleneck-calculator', e)}
          >
            Analyze My PC
          </a>
        </div>

      </div>
    </div>
  );
}
