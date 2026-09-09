import HeroBackgroundSlider from '../components/home/HeroBackgroundSlider';
import HeroFeatureStrip from '../components/home/HeroFeatureStrip';

// Icons for CTA and UI elements
const IconDoubleChevron = () => (
  <svg
    className="hero-eyebrow-chevron"
    viewBox="0 0 16 12"
    width="14"
    height="11"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="2 1.5 6.5 6 2 10.5" />
    <polyline points="7.5 1.5 12 6 7.5 10.5" />
  </svg>
);

const IconBolt = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconCompare = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconMouse = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="7" />
    <line x1="12" y1="6" x2="12" y2="10" />
  </svg>
);

const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function HomePage({ onNavigate }) {
  const handleNav = (route, e) => {
    if (e) e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onNavigate(route);
  };

  const handleScrollDown = () => {
    const nextSection = document.getElementById('how-it-works-section');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="home-page-cinematic">
      
      {/* -------------------------------------------------------------------
          1. CINEMATIC HERO SECTION
      -------------------------------------------------------------------- */}
      <section className="cinematic-hero" aria-labelledby="hero-main-title">
        {/* Cinematic Background Slider */}
        <HeroBackgroundSlider />

        {/* Foreground Content */}
        <div className="hero-content-wrapper">
          <div className="hero-text-block">
            
            {/* Small Eyebrow */}
            <div className="hero-eyebrow-tag">
              <span className="hero-eyebrow-chevron-wrap">
                <IconDoubleChevron />
              </span>
              <span>PC PERFORMANCE. POWERED BY ML.</span>
            </div>

            {/* Main Heading */}
            <h1 id="hero-main-title" className="hero-title-main">
              Know Your PC.<br />
              <span className="hero-title-highlight">Play Smarter.</span>
            </h1>

            {/* Description */}
            <p className="hero-description-lead">
              Analyze your hardware, estimate game FPS, identify bottlenecks, and make better PC upgrade decisions.
            </p>

            {/* CTA Group */}
            <div className="hero-actions-cluster">
              <a
                href="/bottleneck-calculator"
                className="hero-btn-primary"
                onClick={(e) => handleNav('/bottleneck-calculator', e)}
              >
                <IconBolt />
                <span>Analyze My PC</span>
                <IconArrowRight />
              </a>

              <a
                href="/compare"
                className="hero-btn-secondary"
                onClick={(e) => handleNav('/compare', e)}
              >
                <IconCompare />
                <span>Compare Rigs</span>
              </a>
            </div>

          </div>
        </div>

        {/* Scroll To Explore Indicator */}
        <button
          type="button"
          className="hero-scroll-indicator"
          onClick={handleScrollDown}
          aria-label="Scroll down to explore features"
        >
          <div className="scroll-mouse-icon">
            <IconMouse />
          </div>
          <span className="scroll-text">SCROLL TO EXPLORE</span>
          <div className="scroll-arrow-icon">
            <IconChevronDown />
          </div>
        </button>
      </section>

      {/* -------------------------------------------------------------------
          2. HERO FEATURE STRIP
      -------------------------------------------------------------------- */}
      <HeroFeatureStrip />

      {/* -------------------------------------------------------------------
          3. HOW PROJECT AURA WORKS (3 STEPS)
      -------------------------------------------------------------------- */}
      <section id="how-it-works-section" className="steps-section" aria-labelledby="steps-title">
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
                Choose your exact CPU, GPU, system RAM capacity, target resolution, and graphics preset from our hardware database or search autocomplete.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <h3 className="step-title">Run the ML Analysis</h3>
              <p className="step-desc">
                Our machine learning regression model processes your continuous hardware specifications to compute framerate estimates and component headroom.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <h3 className="step-title">Understand Your Performance</h3>
              <p className="step-desc">
                Review your predicted framerate, bottleneck severity percentage, upgrade recommendations, and clear technical explanations.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* -------------------------------------------------------------------
          4. CORE PLATFORM ADVANTAGES
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
              <h3 className="why-card-title">Game-Aware Modeling</h3>
              <p className="why-card-desc">
                Calibrated on real-world gaming performance data rather than purely synthetic mathematical formulas.
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
          5. HOW RESULTS SHOULD BE INTERPRETED (TRANSPARENCY)
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
              <span>Want to learn more about our ML modeling and data normalization?</span>
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
          6. FINAL CALL TO ACTION
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
