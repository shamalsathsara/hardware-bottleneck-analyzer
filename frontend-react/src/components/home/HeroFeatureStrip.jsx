// Consistent, crisp SVG icons for feature strip
const IconGamepad = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="4" />
    <path d="M6 12h4" />
    <path d="M8 10v4" />
    <circle cx="15" cy="11" r="1" fill="currentColor" />
    <circle cx="18" cy="13" r="1" fill="currentColor" />
  </svg>
);

const IconChip = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="8" y="8" width="8" height="8" />
    <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="15" x2="23" y2="15" />
    <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="15" x2="4" y2="15" />
  </svg>
);

const IconCompareBars = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconMonitorCheck = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <path d="m9 10 2 2 4-4" />
  </svg>
);

const FEATURES = [
  {
    icon: <IconGamepad />,
    title: 'Game-Aware Analysis',
    desc: 'Get game-specific FPS estimates',
  },
  {
    icon: <IconChip />,
    title: 'Bottleneck Detection',
    desc: 'Identify CPU and GPU limitations',
  },
  {
    icon: <IconCompareBars />,
    title: 'Compare Builds',
    desc: 'Compare two PC configurations',
  },
  {
    icon: <IconMonitorCheck />,
    title: 'Smarter Upgrades',
    desc: 'Understand what component may need upgrading',
  },
];

export default function HeroFeatureStrip() {
  return (
    <section className="hero-feature-strip" aria-label="Platform Core Capabilities">
      <div className="hero-feature-container">
        {FEATURES.map((item, idx) => (
          <div key={idx} className="hero-feature-item">
            <div className="hero-feature-icon-box">
              {item.icon}
            </div>
            <div className="hero-feature-text">
              <h3 className="hero-feature-title">{item.title}</h3>
              <p className="hero-feature-desc">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
