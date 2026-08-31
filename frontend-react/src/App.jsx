import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import BottleneckCalculatorPage from './pages/BottleneckCalculatorPage';
import AboutPage from './pages/AboutPage';
import MethodologyPage from './pages/MethodologyPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ContactPage from './pages/ContactPage';
import AuthPage from './AuthPage';
import MyRigs from './MyRigs';
import Quotation from './Quotation';
import RigComparison from './RigComparison';
import ErrorBoundary from './ErrorBoundary';
import { analyzeBottleneck } from './utils/BottleneckLogic';

/* Static data for local PC stores used in the Need Help section */
const SRI_LK_STORES = [
  {
    name: 'Nanotek',
    url: 'https://www.nanotek.lk',
    description: 'One of Sri Lanka\'s leading computer hardware retailers with a wide range of CPUs, GPUs, and accessories.',
  },
  {
    name: 'Redline Technologies',
    url: 'https://www.redline.lk',
    description: 'A premium tech store offering high-performance gaming components and custom PC builds.',
  },
  {
    name: 'Barclays Computer',
    url: 'https://www.barclayscomputer.lk',
    description: 'A well-established store known for competitive prices on computer parts and peripherals.',
  },
  {
    name: 'Gamestreet',
    url: 'https://www.gamestreet.lk',
    description: 'Sri Lanka\'s go-to destination for gaming gear, from graphics cards to gaming monitors.',
  },
  {
    name: 'Tecroot',
    url: 'https://www.tecroot.lk',
    description: 'A modern tech retailer specializing in the latest PC hardware with fast island-wide delivery.',
  },
];

// Helper to normalize pathnames
function getNormalizedPath() {
  const path = window.location.pathname.toLowerCase();
  if (path === '' || path === '/') return '/';
  if (path.startsWith('/bottleneck')) return '/bottleneck-calculator';
  if (path.startsWith('/compare')) return '/compare';
  if (path.startsWith('/my-rigs') || path.startsWith('/rigs')) return '/my-rigs';
  if (path.startsWith('/about')) return '/about';
  if (path.startsWith('/method')) return '/methodology';
  if (path.startsWith('/privacy')) return '/privacy';
  if (path.startsWith('/terms')) return '/terms';
  if (path.startsWith('/contact')) return '/contact';
  if (path.startsWith('/auth') || path.startsWith('/login') || path.startsWith('/register')) return '/auth';
  if (path.startsWith('/quotation') || path.startsWith('/quote')) return '/quotation';
  return '/';
}

function updatePageMetadata(route) {
  const titles = {
    '/': 'Project Aura – PC Bottleneck & Gaming Performance Analyzer',
    '/bottleneck-calculator': 'PC Bottleneck Calculator – Project Aura',
    '/compare': 'Compare Gaming PC Builds – Project Aura',
    '/my-rigs': 'My Saved Rigs – Project Aura',
    '/about': 'About Platform – Project Aura',
    '/methodology': 'ML Methodology & Limitations – Project Aura',
    '/privacy': 'Privacy Policy – Project Aura',
    '/terms': 'Terms of Use – Project Aura',
    '/contact': 'Contact & Support – Project Aura',
    '/auth': 'Sign In / Register – Project Aura',
    '/quotation': 'Hardware Pricing Quotation – Project Aura',
  };
  document.title = titles[route] || 'Project Aura – PC Bottleneck Analyzer';
}

function App() {
  // ── ROUTING STATE ──
  const [currentRoute, setCurrentRoute] = useState(getNormalizedPath);

  const navigate = useCallback((route) => {
    window.history.pushState({}, '', route);
    setCurrentRoute(route);
    updatePageMetadata(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const onPopState = () => {
      const route = getNormalizedPath();
      setCurrentRoute(route);
      updatePageMetadata(route);
    };
    window.addEventListener('popstate', onPopState);
    updatePageMetadata(currentRoute);
    return () => window.removeEventListener('popstate', onPopState);
  }, [currentRoute]);

  // ── USER AUTHENTICATION STATE ──
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aura_user')) || null; }
    catch { return null; }
  });

  const handleLogin = useCallback((user) => {
    setCurrentUser(user);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('aura_token');
    localStorage.removeItem('aura_user');
    setCurrentUser(null);
    if (currentRoute === '/my-rigs') {
      navigate('/bottleneck-calculator');
    }
  }, [currentRoute, navigate]);

  // ── HARDWARE DATA COLLECTIONS ──
  const [cpuList, setCpuList] = useState([]);
  const [gpuList, setGpuList] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [maxStats, setMaxStats] = useState({ maxCpuMark: 100000, maxGpuCuda: 500000 });

  // ── ANALYZER CONFIGURATION STATE ──
  const [selectedCpu, setSelectedCpu] = useState('');
  const [selectedGpu, setSelectedGpu] = useState('');
  const [selectedCpuData, setSelectedCpuData] = useState(null);
  const [selectedGpuData, setSelectedGpuData] = useState(null);
  const [ram, setRam] = useState('16');
  const [resolution, setResolution] = useState('1920x1080');
  const [settings, setSettings] = useState('High');

  // ── PREDICTION & ANALYSIS RESULTS ──
  const [isThinking, setIsThinking] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [bottleneckData, setBottleneckData] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [smartRec, setSmartRec] = useState(null);
  const [selectedUpgradeComponent, setSelectedUpgradeComponent] = useState('GPU');
  const [explanationType, setExplanationType] = useState(null);
  const [error, setError] = useState(null);

  // ── SAVE RIG MODAL STATE ──
  const [showSaveRigModal, setShowSaveRigModal] = useState(false);
  const [rigNameInput, setRigNameInput] = useState('');

  // Fetch initial lightweight hardware lists for autocomplete and stats
  useEffect(() => {
    const fetchHardware = async () => {
      setLoadingData(true);
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const [cpusRes, gpusRes, statsRes] = await Promise.all([
          axios.get(`${baseUrl}/api/cpus/all-lightweight`),
          axios.get(`${baseUrl}/api/gpus/all-lightweight`),
          axios.get(`${baseUrl}/api/hardware/stats`).catch(() => ({ data: { maxCpuMark: 100000, maxGpuCuda: 500000 } })),
        ]);
        setCpuList(cpusRes.data);
        setGpuList(gpusRes.data);
        if (statsRes.data) setMaxStats(statsRes.data);
      } catch (err) {
        console.error('Hardware fetch error:', err.message);
      } finally {
        setLoadingData(false);
      }
    };
    fetchHardware();
  }, []);

  // ── RUN ANALYSIS HANDLER ──
  const handleConsultAura = async () => {
    if (!selectedCpu || !selectedGpu) {
      setError('Please select both a CPU and a GPU to analyze.');
      return;
    }
    setError(null);
    setIsThinking(true);

    try {
      let fullCpu = selectedCpuData;
      let fullGpu = selectedGpuData;

      if (!fullCpu) fullCpu = cpuList.find(c => c.cpuName === selectedCpu);
      if (!fullGpu) fullGpu = gpuList.find(g => g.Device === selectedGpu);

      if (!fullCpu) {
        throw new Error(`CPU not found: "${selectedCpu}". Please choose from the autocomplete list.`);
      }
      if (!fullGpu) {
        throw new Error(`GPU not found: "${selectedGpu}". Please choose from the autocomplete list.`);
      }

      const cores = parseInt(fullCpu.cores) || 6;
      const threads = cores * 2;
      const cpuTDP = Math.min(cores * 10, 125);
      const cuda = parseInt(fullGpu.CUDA) || 5000;

      let vram = 4, gpuTdp = 75, bandwidth = 128;
      if (cuda > 250000) { vram = 24; gpuTdp = 350; bandwidth = 1008; }
      else if (cuda > 175000) { vram = 16; gpuTdp = 280; bandwidth = 760; }
      else if (cuda > 100000) { vram = 12; gpuTdp = 200; bandwidth = 448; }
      else if (cuda > 75000) { vram = 8; gpuTdp = 130; bandwidth = 256; }
      else if (cuda > 45000) { vram = 6; gpuTdp = 90; bandwidth = 192; }

      const payload = {
        'CPU': fullCpu.cpuName,
        'CPU Cores': cores,
        'CPU Threads': threads,
        'CPU TDP (W)': cpuTDP,
        'GPU': fullGpu.Device,
        'GPU Series': fullGpu.Manufacturer || 'Nvidia',
        'GPU VRAM (GB)': vram,
        'GPU Bandwidth (GB/s)': bandwidth,
        'GPU TDP (W)': gpuTdp,
        'RAM (GB)': parseInt(ram),
        'Resolution': resolution,
        'Graphics Settings': settings,
      };

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const { data } = await axios.post(`${baseUrl}/api/predict`, payload);

      const analysis = analyzeBottleneck(fullCpu, fullGpu, maxStats);
      const cpuScore = parseInt(fullCpu.cpuMark) || 8000;
      let finalFps = data.predicted_fps;

      if (cpuScore < 3000) {
        finalFps = (cpuScore / 100) + 5;
      } else if (analysis.severity > 10) {
        finalFps = finalFps - finalFps * (analysis.severity / 100) * 0.70;
      }
      finalFps = Math.max(5, Math.min(900, finalFps));

      setPrediction(Math.round(finalFps));
      setBottleneckData(analysis);

      const baseConf = 99.2;
      const conf = (baseConf - (analysis.severity / 100) * 8.5).toFixed(1);
      setConfidence(conf);

      // Upgrade Recommendation
      if (analysis.type === 'gpu') {
        const higherGpu = gpuList.find(g => (parseInt(g.CUDA) || 0) > cuda + 20000);
        setRecommendation({
          title: 'Upgrade Recommendation: Graphics Card',
          hardware: higherGpu ? higherGpu.Device : 'RTX 4070 / RX 7800 XT',
        });
      } else if (analysis.type === 'cpu') {
        const higherCpu = cpuList.find(c => (parseInt(c.cpuMark) || 0) > cpuScore + 3000);
        setRecommendation({
          title: 'Upgrade Recommendation: Processor',
          hardware: higherCpu ? higherCpu.cpuName : 'Ryzen 7 7800X3D / Core i7-14700K',
        });
      } else {
        setRecommendation(null);
      }

      setSmartRec(null);
      setSelectedUpgradeComponent('GPU');
    } catch (err) {
      console.error('Analysis error:', err.message);
      const msg = err.response?.data?.error || err.message || 'Failed to connect to Aura AI.';
      setError(msg);
    } finally {
      setIsThinking(false);
    }
  };

  const handleResetAnalysis = () => {
    setPrediction(null);
    setConfidence(null);
    setBottleneckData(null);
    setRecommendation(null);
    setSmartRec(null);
    setError(null);
  };

  const generateSmartRecommendation = (componentType) => {
    setSelectedUpgradeComponent(componentType);
    const cpuScore = parseInt(selectedCpuData?.cpuMark) || 8000;
    const cuda = parseInt(selectedGpuData?.CUDA) || 5000;
    const currentRamGB = parseInt(ram);

    let result = {};

    if (componentType === 'CPU') {
      const upgradeCpu = cpuList.find(c => (parseInt(c.cpuMark) || 0) > cpuScore * 1.4);
      result = {
        component: 'CPU',
        recommended: upgradeCpu ? upgradeCpu.cpuName : 'AMD Ryzen 7 7800X3D / Intel Core i7-14700K',
        improvement: bottleneckData?.type === 'cpu' ? '+35-50% FPS in CPU-bound titles' : '+5-10% (GPU is the main limiter)',
        compatibility: 'Verify motherboard socket (AM5 / LGA1700) and cooler capacity',
        priority: bottleneckData?.type === 'cpu' ? '🔴 High Priority — Primary Bottleneck' : '🟢 Low Priority — System is balanced',
        tip: bottleneckData?.type === 'cpu'
          ? 'Your CPU is restricting your graphics card. A modern 8-core CPU will eliminate frame drops.'
          : 'Your CPU is already well-matched. Upgrading your CPU will yield minimal gains without a GPU upgrade.',
      };
    } else if (componentType === 'GPU') {
      const upgradeGpu = gpuList.find(g => (parseInt(g.CUDA) || 0) > cuda * 1.5);
      result = {
        component: 'GPU',
        recommended: upgradeGpu ? upgradeGpu.Device : 'NVIDIA RTX 4070 Ti Super / AMD RX 7900 GRE',
        improvement: bottleneckData?.type === 'gpu' ? '+40-70% FPS at 1440p / 4K' : '+10-20% (CPU will become bottleneck)',
        compatibility: 'Ensure PSU wattage >= 750W and case has sufficient clearance',
        priority: bottleneckData?.type === 'gpu' ? '🔴 High Priority — Primary Bottleneck' : '🟡 Medium Priority',
        tip: bottleneckData?.type === 'gpu'
          ? 'Your GPU is operating at maximum capacity. A graphics upgrade will immediately unlock higher resolutions and framerates.'
          : 'Upgrading the GPU will improve visual settings, but ensure your CPU can keep up with the extra draw calls.',
      };
    } else {
      result = {
        component: 'RAM',
        recommended: currentRamGB < 16 ? '16 GB DDR4/DDR5 (2x8GB Dual-Channel)' : '32 GB DDR5 6000MHz CL30',
        improvement: currentRamGB < 16 ? '+15-25% 1% Low FPS stability' : '+3-5% (Capacity headroom)',
        compatibility: 'Ensure dual-channel kit installed in optimal slots (DIMMA2/B2)',
        priority: currentRamGB < 16 ? '🟠 Recommended — Low RAM causes frame stutters' : '🟢 Optional — Current RAM is adequate',
        tip: currentRamGB < 16
          ? '8GB of RAM causes paging and micro-stutters. Upgrading to 16GB dual-channel provides the best cost-to-performance uplift.'
          : 'Your system memory is sufficient for modern gaming titles.',
      };
    }
    setSmartRec(result);
  };

  // ── SAVE RIG HANDLER ──
  const handleSaveRigSubmit = async () => {
    if (!rigNameInput.trim()) return;
    try {
      const token = localStorage.getItem('aura_token');
      if (!token || token === 'null' || token === 'undefined') {
        setError('You are not logged in. Please sign in to save PC builds.');
        setShowSaveRigModal(false);
        return;
      }
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      await axios.post(`${baseUrl}/api/user/rigs`, 
        { name: rigNameInput.trim(), cpu: selectedCpu, gpu: selectedGpu, ram, resolution },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowSaveRigModal(false);
      alert('PC Build saved successfully! You can view it in your "My Rigs" profile.');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to save PC.';
      setError(msg);
      setShowSaveRigModal(false);
    }
  };

  // ── LOAD RIG FROM PROFILE ──
  const handleLoadRig = (rig) => {
    setSelectedCpu(rig.cpu);
    setSelectedGpu(rig.gpu);
    setRam(rig.ram || '16');
    setResolution(rig.resolution || '1920x1080');
    setSelectedCpuData(null);
    setSelectedGpuData(null);
    navigate('/bottleneck-calculator');
  };

  return (
    <ErrorBoundary>
      <div className="site-root-layout">
        
        {/* Global Responsive Public Navbar */}
        <Navbar 
          currentRoute={currentRoute}
          onNavigate={navigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Dynamic Route Content */}
        <div className="site-main-content">
          
          {currentRoute === '/' && (
            <HomePage onNavigate={navigate} />
          )}

          {currentRoute === '/bottleneck-calculator' && (
            <BottleneckCalculatorPage 
              loadingData={loadingData}
              selectedCpu={selectedCpu}
              setSelectedCpu={setSelectedCpu}
              setSelectedCpuData={setSelectedCpuData}
              selectedGpu={selectedGpu}
              setSelectedGpu={setSelectedGpu}
              setSelectedGpuData={setSelectedGpuData}
              ram={ram}
              setRam={setRam}
              resolution={resolution}
              setResolution={setResolution}
              settings={settings}
              setSettings={setSettings}
              isThinking={isThinking}
              handleConsultAura={handleConsultAura}
              handleResetAnalysis={handleResetAnalysis}
              prediction={prediction}
              confidence={confidence}
              bottleneckData={bottleneckData}
              recommendation={recommendation}
              smartRec={smartRec}
              selectedUpgradeComponent={selectedUpgradeComponent}
              generateSmartRecommendation={generateSmartRecommendation}
              explanationType={explanationType}
              setExplanationType={setExplanationType}
              error={error}
              currentUser={currentUser}
              onNavigate={navigate}
              onOpenSaveModal={() => { setRigNameInput(''); setShowSaveRigModal(true); }}
              SRI_LK_STORES={SRI_LK_STORES}
            />
          )}

          {currentRoute === '/compare' && (
            <RigComparison
              cpuList={cpuList}
              gpuList={gpuList}
              onBack={() => navigate('/bottleneck-calculator')}
              initialRig={selectedCpu && selectedGpu ? { cpu: selectedCpu, gpu: selectedGpu, ram, resolution, settings } : null}
            />
          )}

          {currentRoute === '/my-rigs' && (
            currentUser ? (
              <MyRigs 
                currentUser={currentUser}
                onBack={() => navigate('/bottleneck-calculator')}
                onLoadRig={handleLoadRig}
              />
            ) : (
              <AuthPage onLogin={(u) => { handleLogin(u); navigate('/my-rigs'); }} />
            )
          )}

          {currentRoute === '/about' && (
            <AboutPage onNavigate={navigate} />
          )}

          {currentRoute === '/methodology' && (
            <MethodologyPage onNavigate={navigate} />
          )}

          {currentRoute === '/privacy' && (
            <PrivacyPage />
          )}

          {currentRoute === '/terms' && (
            <TermsPage />
          )}

          {currentRoute === '/contact' && (
            <ContactPage />
          )}

          {currentRoute === '/auth' && (
            <AuthPage onLogin={(u) => { handleLogin(u); navigate('/bottleneck-calculator'); }} />
          )}

          {currentRoute === '/quotation' && (
            <Quotation 
              cpu={selectedCpu}
              gpu={selectedGpu}
              ram={ram}
              onBack={() => navigate('/bottleneck-calculator')}
            />
          )}

        </div>

        {/* Global Footer */}
        <Footer onNavigate={navigate} />

        {/* Save Rig Modal */}
        {showSaveRigModal && (
          <div className="save-modal-backdrop">
            <div className="save-modal-card">
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>Save This PC Build</h3>
              <p style={{ margin: '0 0 1.2rem 0', color: 'var(--text-sub)', fontSize: '0.9rem' }}>
                Give your setup a memorable name to view and compare it anytime in "My Rigs".
              </p>
              <input 
                type="text"
                placeholder="e.g. My 1440p Gaming Rig"
                value={rigNameInput}
                onChange={(e) => setRigNameInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  borderRadius: 'var(--radius)',
                  marginBottom: '1.5rem',
                  outline: 'none',
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRigSubmit(); }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  onClick={() => setShowSaveRigModal(false)}
                  style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveRigSubmit}
                  disabled={!rigNameInput.trim()}
                  style={{ background: 'var(--primary)', color: 'black', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius)', cursor: rigNameInput.trim() ? 'pointer' : 'not-allowed', fontWeight: 'bold', opacity: rigNameInput.trim() ? 1 : 0.5 }}
                >
                  Save PC
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ErrorBoundary>
  );
}

export default App;