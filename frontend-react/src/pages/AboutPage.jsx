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

        {/* Technical Architecture */}
        <section className="info-card">
          <h2 className="info-section-title">Technology &amp; Architecture</h2>
          <p>
            Project Aura is engineered with a modern, high-performance microservices architecture:
          </p>
          <div className="info-grid-2">
            <div className="info-subcard">
              <h3 className="subcard-title text-cyan">Frontend Interface</h3>
              <p>
                Built with <strong>React 19</strong> and <strong>Vite</strong>. Features a responsive, glassmorphic dark-theme UI with client-side routing, accessible touch targets, and dynamic SVG data visualizations.
              </p>
            </div>

            <div className="info-subcard">
              <h3 className="subcard-title text-cyan">API Gateway &amp; Auth</h3>
              <p>
                Powered by <strong>Node.js</strong> and <strong>Express 5</strong>. Manages rate limiting, JWT authentication, user profiles, hardware database indexing, and MongoDB Atlas data synchronization.
              </p>
            </div>

            <div className="info-subcard">
              <h3 className="subcard-title text-cyan">AI Inference Engine</h3>
              <p>
                Built in <strong>Python</strong> with <strong>Flask</strong> and <strong>scikit-learn</strong>. Houses our in-memory Random Forest regressor with continuous feature type safety and safe outlier bounding.
              </p>
            </div>

            <div className="info-subcard">
              <h3 className="subcard-title text-cyan">Database &amp; Hardware Index</h3>
              <p>
                Hosted on <strong>MongoDB Atlas</strong> with indexed CPU and GPU hardware metrics including PassMark scores, CUDA cores, TDP ratings, and memory bandwidth.
              </p>
            </div>
          </div>
        </section>

        {/* Key Objectives */}
        <section className="info-card">
          <h2 className="info-section-title">What Makes Project Aura Different?</h2>
          <ul className="info-list">
            <li>
              <strong>Data-Driven ML Modeling:</strong> We replace arbitrary mathematical guesswork with a trained Random Forest model that evaluates continuous hardware attributes (cores, threads, clock headroom, memory bandwidth, VRAM, and RAM).
            </li>
            <li>
              <strong>Multi-Resolution Awareness:</strong> CPU bottlenecks dominate at 1080p high-refresh gaming, whereas GPU memory bus saturation dominates at 4K. Our models reflect this dynamic behavior.
            </li>
            <li>
              <strong>No Paywalls &amp; No Forced Accounts:</strong> The core Bottleneck Calculator and Rig Comparison tools are freely accessible to anyone on the web without requiring an account.
            </li>
            <li>
              <strong>Zero Biased Recommendations:</strong> We do not skew recommendations towards specific hardware vendors. Our balance calculations are mathematically derived from benchmark databases.
            </li>
          </ul>
        </section>

        {/* Bottom CTA */}
        <div className="info-cta-bar">
          <div>
            <h3 style={{ margin: '0 0 0.4rem 0', color: 'var(--text-main)' }}>Ready to test your hardware?</h3>
            <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.9rem' }}>
              Run our Bottleneck Analyzer in seconds with your current setup.
            </p>
          </div>
          <a 
            href="/bottleneck-calculator" 
            className="btn-primary-glow"
            onClick={(e) => handleNav('/bottleneck-calculator', e)}
          >
            Launch Calculator
          </a>
        </div>

      </div>
    </div>
  );
}
