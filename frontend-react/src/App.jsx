import { useState, useEffect, useCallback } from 'react';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import BottleneckCalculatorPage from './pages/BottleneckCalculatorPage';
import AboutPage from './pages/AboutPage';
import MethodologyPage from './pages/MethodologyPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ContactPage from './pages/ContactPage';
import GamesPage from './pages/GamesPage';
import GameDetailPage from './pages/GameDetailPage';
import AuthPage from './AuthPage';
import MyRigs from './MyRigs';
import Quotation from './Quotation';
import RigComparison from './RigComparison';
import ErrorBoundary from './ErrorBoundary';
import SaveRigModal from './components/common/SaveRigModal';

import { ROUTES, ROUTE_TITLES, getNormalizedRoute } from './constants/routes';
import { SRI_LK_STORES } from './constants/stores';
import { useAuth } from './hooks/useAuth';
import { useHardwareData } from './hooks/useHardwareData';
import { predictFps } from './services/analysisService';
import { saveUserRig } from './services/rigService';
import { analyzeBottleneck } from './utils/BottleneckLogic';

function updatePageMetadata(route) {
  document.title = ROUTE_TITLES[route] || 'Project Aura – PC Bottleneck Analyzer';
}

function App() {
  // ── ROUTING STATE ──
  const [currentRoute, setCurrentRoute] = useState(() => getNormalizedRoute(window.location.pathname));

  const navigate = useCallback((route) => {
    window.history.pushState({}, '', route);
    setCurrentRoute(route);
    updatePageMetadata(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const onPopState = () => {
      const route = getNormalizedRoute(window.location.pathname);
      setCurrentRoute(route);
      updatePageMetadata(route);
    };
    window.addEventListener('popstate', onPopState);
    updatePageMetadata(currentRoute);
    return () => window.removeEventListener('popstate', onPopState);
  }, [currentRoute]);

  // ── USER AUTHENTICATION HOOK ──
  const { currentUser, login, logout } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
    if (currentRoute === ROUTES.MY_RIGS) {
      navigate(ROUTES.BOTTLENECK_CALCULATOR);
    }
  }, [currentRoute, logout, navigate]);

  // ── HARDWARE DATA HOOK ──
  const { cpuList, gpuList, maxStats, loading: loadingData } = useHardwareData();

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

      const data = await predictFps(payload);

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
  const handleSaveRigSubmit = async (rigName) => {
    try {
      await saveUserRig({ 
        name: rigName, 
        cpu: selectedCpu, 
        gpu: selectedGpu, 
        ram, 
        resolution,
        settings,
      });
      setShowSaveRigModal(false);
      alert('PC Build saved successfully! You can view it in your "My Rigs" profile.');
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        setShowSaveRigModal(false);
        if (window.confirm('Your login session has expired. Would you like to sign in again to save this PC build?')) {
          navigate(ROUTES.AUTH);
        }
        return;
      }
      const msg = err.response?.data?.error || err.message || 'Failed to save PC.';
      setError(msg);
      setShowSaveRigModal(false);
    }
  };

  // ── LOAD RIG FROM PROFILE ──
  const handleLoadRig = (rig) => {
    setSelectedCpu(rig.cpu);
    setSelectedGpu(rig.gpu);
    setRam(String(rig.ram || '16'));
    setResolution(rig.resolution || '1920x1080');
    setSettings(rig.settings || 'High');
    setSelectedCpuData(null);
    setSelectedGpuData(null);
    navigate(ROUTES.BOTTLENECK_CALCULATOR);
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
        <main className="site-main-content">
          
          {currentRoute === ROUTES.HOME && (
            <HomePage onNavigate={navigate} />
          )}

          {currentRoute === ROUTES.BOTTLENECK_CALCULATOR && (
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
              onOpenSaveModal={() => setShowSaveRigModal(true)}
              SRI_LK_STORES={SRI_LK_STORES}
            />
          )}

          {currentRoute === ROUTES.COMPARE && (
            <RigComparison
              cpuList={cpuList}
              gpuList={gpuList}
              onBack={() => navigate(ROUTES.BOTTLENECK_CALCULATOR)}
              initialRig={selectedCpu && selectedGpu ? { cpu: selectedCpu, gpu: selectedGpu, ram, resolution, settings } : null}
              currentUser={currentUser}
            />
          )}

          {currentRoute === ROUTES.GAMES && (
            <GamesPage onNavigate={navigate} />
          )}

          {currentRoute.startsWith('/games/') && (
            <GameDetailPage 
              slug={currentRoute.replace('/games/', '')}
              onNavigate={navigate}
            />
          )}

          {currentRoute === ROUTES.MY_RIGS && (
            currentUser ? (
              <MyRigs 
                currentUser={currentUser}
                onBack={() => navigate(ROUTES.BOTTLENECK_CALCULATOR)}
                onLoadRig={handleLoadRig}
              />
            ) : (
              <AuthPage onLogin={(u) => { login(localStorage.getItem('aura_token'), u); navigate(ROUTES.MY_RIGS); }} />
            )
          )}

          {currentRoute === ROUTES.ABOUT && (
            <AboutPage onNavigate={navigate} />
          )}

          {currentRoute === ROUTES.METHODOLOGY && (
            <MethodologyPage onNavigate={navigate} />
          )}

          {currentRoute === ROUTES.PRIVACY && (
            <PrivacyPage />
          )}

          {currentRoute === ROUTES.TERMS && (
            <TermsPage />
          )}

          {currentRoute === ROUTES.CONTACT && (
            <ContactPage />
          )}

          {currentRoute === ROUTES.AUTH && (
            <AuthPage onLogin={(u) => { login(localStorage.getItem('aura_token'), u); navigate(ROUTES.BOTTLENECK_CALCULATOR); }} />
          )}

          {currentRoute === ROUTES.QUOTATION && (
            <Quotation 
              cpu={selectedCpu}
              gpu={selectedGpu}
              ram={ram}
              onBack={() => navigate(ROUTES.BOTTLENECK_CALCULATOR)}
            />
          )}

        </main>

        {/* Global Footer */}
        <Footer onNavigate={navigate} />

        {/* Save Rig Modal */}
        <SaveRigModal 
          isOpen={showSaveRigModal}
          onClose={() => setShowSaveRigModal(false)}
          onSave={handleSaveRigSubmit}
        />

      </div>
    </ErrorBoundary>
  );
}

export default App;