import { useState, useEffect } from 'react';
import axios from 'axios';

/* ── Contact Info ─────────────────────────────── */
const CONTACT = {
  name:     'Shamal Sathsara',
  role:     'Full-Stack Developer & AI Enthusiast',
  email:    'shamalsathsara4@gmail.com',
  mobile:   '072 357 7218',
  whatsapp: '0771581916',
  location: '349/07/A Palanwaththa, Pannipitiya',
  github:   'https://github.com/shamalsathsara',
  facebook: 'https://facebook.com/shamalsathsara',
  linkedin: 'https://linkedin.com/in/shamalsathsara',
};

/* ── SVG Icon Library ─────────────────────────── */
const IconCpu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8"/>
    <path d="M8 2v2M12 2v2M16 2v2M8 20v2M12 20v2M16 20v2M2 8h2M2 12h2M2 16h2M20 8h2M20 12h2M20 16h2"/>
  </svg>
);

const IconBolt = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);

const IconScan = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
    <rect x="7" y="7" width="10" height="10" rx="1"/>
  </svg>
);

const IconWarning = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const IconMessage = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconGithub = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

const IconFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073C24 5.446 18.627 0 12 0S0 5.446 0 12.073c0 6.03 4.388 11.024 10.125 11.927v-8.43H7.078v-3.497h3.047V9.43c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.931-1.956 1.886v2.248h3.328l-.532 3.497h-2.796v8.43C19.612 23.097 24 18.103 24 12.073z"/>
  </svg>
);

const IconLinkedin = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const IconWhatsapp = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

/* ── Main App ─────────────────────────────────── */
function App() {
  const [cpuList, setCpuList]           = useState([]);
  const [gpuList, setGpuList]           = useState([]);
  const [selectedCpu, setSelectedCpu]   = useState('');
  const [selectedGpu, setSelectedGpu]   = useState('');
  const [resolution, setResolution]     = useState('1080p');
  const [settings, setSettings]         = useState('High');
  const [ram, setRam]                   = useState('16');
  const [prediction, setPrediction]     = useState(null);
  const [bottleneckData, setBottleneck] = useState(null);
  const [isThinking, setIsThinking]     = useState(false);
  const [error, setError]               = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [c, g] = await Promise.all([
          axios.get('http://localhost:4000/api/cpus'),
          axios.get('http://localhost:4000/api/gpus'),
        ]);
        setCpuList(c.data);
        setGpuList(g.data);
      } catch {
        setError('Could not connect to the backend. Make sure the Node.js server is running on port 4000.');
      }
    })();
  }, []);

  const analyzeBottleneck = (cpu, gpu) => {
    const cores    = parseInt(cpu.cores) || 6;
    const gpuPower = parseInt(gpu.CUDA)  || 50000;
    let severity = 10, message = '', color = '#10b981', cardClass = 'has-bottleneck-ok';

    if (cores <= 4 && gpuPower > 80000) {
      severity  = 85;
      message   = 'CPU Bottleneck: Your processor is way too weak for this graphics card. It is severely holding your FPS back. Upgrade to a modern 6- or 8-core CPU.';
      color     = '#ef4444';
      cardClass = 'has-bottleneck-severe';
    } else if (cores >= 8 && gpuPower < 30000) {
      severity  = 70;
      message   = 'GPU Bottleneck: Your graphics card is holding back your high-end processor. Consider upgrading to a GPU with a higher compute score.';
      color     = '#f59e0b';
      cardClass = 'has-bottleneck-warning';
    } else {
      severity = Math.floor(Math.random() * 15) + 5;
      message  = 'Balanced Build: Your CPU and GPU work perfectly together — solid gaming setup.';
    }
    return { severity, message, color, cardClass };
  };

  const handleConsultAura = async () => {
    setError(null);
    if (!selectedCpu || !selectedGpu) {
      setError('Please select both a CPU and a GPU before analyzing.');
      return;
    }
    const fullCpu = cpuList.find(c => c.cpuName === selectedCpu);
    const fullGpu = gpuList.find(g => g.Device  === selectedGpu);
    if (!fullCpu || !fullGpu) {
      setError('Could not find matching specs. Please choose from the autocomplete suggestions.');
      return;
    }

    setIsThinking(true); setPrediction(null); setBottleneck(null);

    const cores = parseInt(fullCpu.cores) || 6;
    const threads = cores * 2, cpuTDP = cores * 15;
    const cuda = parseInt(fullGpu.CUDA) || 5000;
    let vram = 8, gpuTdp = 150, bandwidth = 256;
    if      (cuda > 20000) { vram = 24; gpuTdp = 350; bandwidth = 1008; }
    else if (cuda > 10000) { vram = 16; gpuTdp = 250; bandwidth = 608;  }
    else if (cuda > 5000)  { vram = 12; gpuTdp = 200; bandwidth = 448;  }

    const payload = {
      'CPU': fullCpu.cpuName, 'CPU Cores': cores, 'CPU Threads': threads, 'CPU TDP (W)': cpuTDP,
      'GPU': fullGpu.Device, 'GPU Series': fullGpu.Manufacturer || 'Nvidia',
      'GPU VRAM (GB)': vram, 'GPU Bandwidth (GB/s)': bandwidth, 'GPU TDP (W)': gpuTdp,
      'Total System TDP (W)': cpuTDP + gpuTdp + 100, 'Bottleneck Score': 0,
      'RAM (GB)': parseInt(ram), 'Resolution': resolution, 'Graphics Settings': settings,
    };

    try {
      const { data } = await axios.post('http://localhost:4000/api/predict', payload);
      const analysis = analyzeBottleneck(fullCpu, fullGpu);
      const cpuScore = parseInt(fullCpu.cpuMark) || 8000;
      let finalFps = data.predicted_fps;

      if (cpuScore < 3000) {
        finalFps = (cpuScore / 100) + (Math.random() * 10);
      } else {
        finalFps = finalFps - finalFps * (analysis.severity / 100) * 0.70;
      }
      if (finalFps < 5)   finalFps = 5.2;
      if (finalFps > 900) finalFps = 899.9;

      setPrediction(finalFps.toFixed(1));
      setBottleneck(analysis);
    } catch {
      setError('Could not reach Project Aura. Make sure the Python AI server is running on port 5000.');
    }
    setIsThinking(false);
  };

  return (
    <>
      {/* Navigation */}
      <nav className="site-nav">
        <div className="nav-logo">
          <div className="nav-logo-dot" />
          Project Aura
        </div>
        <div className="nav-links">
          <a href="#analyzer">Analyzer</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <span className="nav-badge">AI Powered</span>
        </div>
      </nav>

      <main>

        {/* Hero */}
        <section className="hero">
          <div className="hero-tag">
            <span className="hero-tag-icon"><IconCpu /></span>
            Powered by Random Forest AI
          </div>
          <h1>Smart Hardware<br />Bottleneck Analyzer</h1>
          <p>
            Select your CPU, GPU, resolution and settings — and let Project Aura's
            trained AI instantly predict your gaming FPS and identify performance bottlenecks.
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-value">3.64</div>
              <div className="stat-label">FPS Error Margin</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">100</div>
              <div className="stat-label">Forest Trees</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">4K</div>
              <div className="stat-label">Max Resolution</div>
            </div>
          </div>
        </section>

        {/* Analyzer */}
        <section className="analyzer-card" id="analyzer">
          <div className="card-title">
            <span className="card-title-icon"><IconBolt /></span>
            Hardware Configuration
          </div>

          <div className="section-label">Your Components</div>

          <div className="form-group">
            <label>Processor (CPU)</label>
            <input
              type="text" list="cpu-options"
              placeholder="Type to search CPUs…"
              value={selectedCpu} onChange={e => setSelectedCpu(e.target.value)}
            />
            <datalist id="cpu-options">
              {cpuList.map((c, i) => <option key={i} value={c.cpuName} />)}
            </datalist>
          </div>

          <div className="form-group">
            <label>Graphics Card (GPU)</label>
            <input
              type="text" list="gpu-options"
              placeholder="Type to search GPUs…"
              value={selectedGpu} onChange={e => setSelectedGpu(e.target.value)}
            />
            <datalist id="gpu-options">
              {gpuList.map((g, i) => <option key={i} value={g.Device} />)}
            </datalist>
          </div>

          <div className="section-label">Game Settings</div>

          <div className="form-row">
            <div className="form-group">
              <label>Resolution</label>
              <select value={resolution} onChange={e => setResolution(e.target.value)}>
                <option value="1080p">1080p (FHD)</option>
                <option value="1440p">1440p (QHD)</option>
                <option value="4K">4K (UHD)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Graphics Quality</label>
              <select value={settings} onChange={e => setSettings(e.target.value)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Ultra">Ultra</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>System RAM</label>
            <select value={ram} onChange={e => setRam(e.target.value)}>
              <option value="4">4 GB</option>
              <option value="8">8 GB</option>
              <option value="16">16 GB</option>
              <option value="32">32 GB</option>
              <option value="64">64 GB</option>
            </select>
          </div>

          <button
            className={`action-btn${isThinking ? ' loading' : ''}`}
            onClick={handleConsultAura}
            disabled={isThinking}
          >
            <span className="btn-icon"><IconScan /></span>
            {isThinking ? 'Aura is Analyzing…' : 'Run Analysis'}
          </button>

          {error && (
            <div className="error-banner">
              <span className="error-icon"><IconWarning /></span>
              <span>{error}</span>
            </div>
          )}

          {prediction && bottleneckData && (
            <div className={`results-card ${bottleneckData.cardClass}`}>
              <div className="fps-display">
                <div className="fps-label">Predicted Performance</div>
                <div className="fps-value">
                  {prediction}<span className="fps-unit">FPS</span>
                </div>
              </div>
              <div className="bottleneck-header">
                <span className="bottleneck-label">Bottleneck Severity</span>
                <span className="bottleneck-pct">{bottleneckData.severity}%</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${bottleneckData.severity}%`, background: bottleneckData.color }} />
              </div>
              <div className="bottleneck-msg-wrap">
                {bottleneckData.cardClass === 'has-bottleneck-ok' && (
                  <span className="msg-icon msg-ok"><IconCheck /></span>
                )}
                {bottleneckData.cardClass === 'has-bottleneck-warning' && (
                  <span className="msg-icon msg-warn"><IconWarning /></span>
                )}
                {bottleneckData.cardClass === 'has-bottleneck-severe' && (
                  <span className="msg-icon msg-err"><IconWarning /></span>
                )}
                <p className="bottleneck-message">{bottleneckData.message}</p>
              </div>
            </div>
          )}
        </section>

        {/* About */}
        <section className="about-section" id="about">
          <div className="about-header">
            <div className="about-avatar">SS</div>
            <div>
              <div className="about-name">{CONTACT.name}</div>
              <div className="about-role">{CONTACT.role}</div>
            </div>
          </div>
          <div className="about-bio">
            <p>
              I'm Shamal — a passionate full-stack developer with a focus on building AI-powered tools
              that solve real-world problems. I enjoy turning raw data into intelligent applications.
            </p>
            <p>
              Project Aura is one of my flagship projects — combining machine learning, a Node.js backend,
              MongoDB Atlas, and React to deliver smart PC hardware insights in seconds.
            </p>
          </div>
          <div className="about-skills">
            {['React', 'Node.js', 'Python', 'Flask', 'MongoDB', 'scikit-learn', 'Machine Learning', 'REST APIs'].map(s => (
              <span key={s} className="skill-tag">{s}</span>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="site-footer" id="contact">
        <div className="footer-top">

          {/* Brand */}
          <div className="footer-brand">
            <h3>Project Aura</h3>
            <p>
              An AI-powered PC hardware bottleneck analyzer built with a
              Random Forest model, React, Node.js, Flask &amp; MongoDB Atlas.
            </p>
            <div className="footer-socials">
              <a href={CONTACT.github}   target="_blank" rel="noreferrer" className="social-btn" title="GitHub"><IconGithub /></a>
              <a href={CONTACT.facebook} target="_blank" rel="noreferrer" className="social-btn" title="Facebook"><IconFacebook /></a>
              <a href={CONTACT.linkedin} target="_blank" rel="noreferrer" className="social-btn" title="LinkedIn"><IconLinkedin /></a>
              <a href={`https://wa.me/94${CONTACT.whatsapp.replace(/^0/, '')}`} target="_blank" rel="noreferrer" className="social-btn" title="WhatsApp"><IconWhatsapp /></a>
            </div>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4>Contact</h4>
            <ul className="contact-list">
              <li className="contact-item">
                <span className="contact-icon"><IconMail /></span>
                <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
              </li>
              <li className="contact-item">
                <span className="contact-icon"><IconPhone /></span>
                <span>{CONTACT.mobile}</span>
              </li>
              <li className="contact-item">
                <span className="contact-icon"><IconMessage /></span>
                <span>WhatsApp: {CONTACT.whatsapp}</span>
              </li>
              <li className="contact-item">
                <span className="contact-icon"><IconPin /></span>
                <span>{CONTACT.location}</span>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="footer-col">
            <h4>Connect</h4>
            <ul className="contact-list">
              <li className="contact-item">
                <span className="contact-icon"><IconGithub /></span>
                <a href={CONTACT.github} target="_blank" rel="noreferrer">GitHub</a>
              </li>
              <li className="contact-item">
                <span className="contact-icon"><IconFacebook /></span>
                <a href={CONTACT.facebook} target="_blank" rel="noreferrer">Facebook</a>
              </li>
              <li className="contact-item">
                <span className="contact-icon"><IconLinkedin /></span>
                <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
              </li>
              <li className="contact-item">
                <span className="contact-icon"><IconWhatsapp /></span>
                <a href={`https://wa.me/94${CONTACT.whatsapp.replace(/^0/, '')}`} target="_blank" rel="noreferrer">WhatsApp</a>
              </li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} <span>{CONTACT.name}</span>. All rights reserved.</p>
          <p>Built with React · Node.js · Python · MongoDB</p>
        </div>
      </footer>
    </>
  );
}

export default App;