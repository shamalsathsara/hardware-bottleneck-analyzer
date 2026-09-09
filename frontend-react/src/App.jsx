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
import { searchCpus, searchGpus } from './services/hardwareService';
import { predictFps } from './services/analysisService';
import { saveUserRig } from './services/rigService';
import { analyzeBottleneck } from './utils/BottleneckLogic';

function updatePageMetadata(route) {
  document.title = ROUTE_TITLES[route] || 'Project Aura – PC Bottleneck Analyzer';
}

function App() {
  const [currentRoute, setCurrentRoute] = useState(() => getNormalizedRoute(window.location.pathname));

  const navigate = useCallback((route) => {
    window.history.pushState({}, '', route);
    setCurrentRoute(route);
    updatePageMetadata(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Sync route on popstate events
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

  const { currentUser, login, logout } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
    if (currentRoute === ROUTES.MY_RIGS) {
      navigate(ROUTES.BOTTLENECK_CALCULATOR);
    }
  }, [currentRoute, logout, navigate]);

  const { cpuList, gpuList, maxStats, loading: loadingData } = useHardwareData();

  const [selectedCpu, setSelectedCpu] = useState('');
  const [selectedGpu, setSelectedGpu] = useState('');
  const [selectedCpuData, setSelectedCpuData] = useState(null);
  const [selectedGpuData, setSelectedGpuData] = useState(null);
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedGameData, setSelectedGameData] = useState(null);
  const [ram, setRam] = useState('16');
  const [resolution, setResolution] = useState('1920x1080');
  const [settings, setSettings] = useState('High');

  const [isThinking, setIsThinking] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [predictionMetadata, setPredictionMetadata] = useState(null);
  const [bottleneckData, setBottleneckData] = useState(null);
  const [analysisMode, setAnalysisMode] = useState(null); // 'general' | 'game'
  const [incompleteV2Notice, setIncompleteV2Notice] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [smartRec, setSmartRec] = useState(null);
  const [selectedUpgradeComponent, setSelectedUpgradeComponent] = useState('GPU');
  const [explanationType, setExplanationType] = useState(null);
  const [error, setError] = useState(null);

  const [showSaveRigModal, setShowSaveRigModal] = useState(false);

  const handleConsultAura = async () => {
    if (!selectedCpu || !selectedGpu) {
      setError('Please select both a CPU and a GPU to analyze.');
      return;
    }
    setError(null);
    setIncompleteV2Notice(null);
    setIsThinking(true);

    try {
      let fullCpu = selectedCpuData;
      let fullGpu = selectedGpuData;

      if (!fullCpu && selectedCpu) {
        fullCpu = cpuList.find(c => c.cpuName === selectedCpu || c.canonicalName === selectedCpu || c.displayName === selectedCpu);
        if (!fullCpu) {
          try {
            const matches = await searchCpus(selectedCpu);
            if (matches && matches.length > 0) fullCpu = matches[0];
          } catch (err) {
            console.debug('CPU fallback lookup failed', err);
          }
        }
      }
      if (!fullGpu && selectedGpu) {
        fullGpu = gpuList.find(g => g.Device === selectedGpu || g.canonicalName === selectedGpu || g.displayName === selectedGpu);
        if (!fullGpu) {
          try {
            const matches = await searchGpus(selectedGpu);
            if (matches && matches.length > 0) fullGpu = matches[0];
          } catch (err) {
            console.debug('GPU fallback lookup failed', err);
          }
        }
      }

      if (!fullCpu) {
        throw new Error(`CPU not found: "${selectedCpu}". Please choose from the autocomplete list.`);
      }
      if (!fullGpu) {
        throw new Error(`GPU not found: "${selectedGpu}". Please choose from the autocomplete list.`);
      }

      // Calculate standard bottleneck analysis using verified bottleneck engine
      const analysis = analyzeBottleneck(fullCpu, fullGpu, maxStats);
      const cpuScore = parseInt(fullCpu.cpuMark, 10) || 8000;
      const cuda = parseInt(fullGpu.CUDA, 10) || 5000;

      // MODE A: GENERAL PC ANALYSIS (No game selected)
      if (!selectedGame || selectedGame.trim() === '') {
        setAnalysisMode('general');
        setPrediction(null);
        setPredictionMetadata(null);
        setBottleneckData(analysis);

        // Update recommendations based on bottleneck type
        if (analysis.type === 'gpu') {
          const higherGpu = gpuList.find(g => (parseInt(g.CUDA, 10) || 0) > cuda + 20000);
          setRecommendation({
            title: 'Upgrade Recommendation: Graphics Card',
            hardware: higherGpu ? (higherGpu.canonicalName || higherGpu.Device) : 'RTX 4070 / RX 7800 XT',
          });
        } else if (analysis.type === 'cpu') {
          const higherCpu = cpuList.find(c => (parseInt(c.cpuMark, 10) || 0) > cpuScore + 3000);
          setRecommendation({
            title: 'Upgrade Recommendation: Processor',
            hardware: higherCpu ? (higherCpu.canonicalName || higherCpu.cpuName) : 'Ryzen 7 7800X3D / Core i7-14700K',
          });
        } else {
          setRecommendation(null);
        }

        setSmartRec(null);
        setSelectedUpgradeComponent('GPU');
        return;
      }

      // Check if resolution is 1440p or 4K (Game FPS prediction is currently validated for 1080p)
      if (resolution !== '1920x1080') {
        setAnalysisMode('general');
        setPrediction(null);
        setPredictionMetadata(null);
        setIncompleteV2Notice({
          title: 'Resolution Support in Development',
          message: 'Game FPS prediction is currently validated for 1080p. 1440p and 4K prediction support is still being developed.',
        });
        setBottleneckData(analysis);

        if (analysis.type === 'gpu') {
          const higherGpu = gpuList.find(g => (parseInt(g.CUDA, 10) || 0) > cuda + 20000);
          setRecommendation({
            title: 'Upgrade Recommendation: Graphics Card',
            hardware: higherGpu ? (higherGpu.canonicalName || higherGpu.Device) : 'RTX 4070 / RX 7800 XT',
          });
        } else if (analysis.type === 'cpu') {
          const higherCpu = cpuList.find(c => (parseInt(c.cpuMark, 10) || 0) > cpuScore + 3000);
          setRecommendation({
            title: 'Upgrade Recommendation: Processor',
            hardware: higherCpu ? (higherCpu.canonicalName || higherCpu.cpuName) : 'Ryzen 7 7800X3D / Core i7-14700K',
          });
        } else {
          setRecommendation(null);
        }

        setSmartRec(null);
        setSelectedUpgradeComponent('GPU');
        return;
      }

      // MODE B: GAME PERFORMANCE MODE (Game selected + 1080p validated)
      setAnalysisMode('game');

      const payload = {
        cpuHardwareId: fullCpu.hardwareId,
        cpuLegacyId: fullCpu.legacyId || (fullCpu.hardwareSource === 'legacy' ? String(fullCpu._id) : undefined),
        cpuSource: fullCpu.hardwareSource,
        CPU: fullCpu.canonicalName || fullCpu.cpuName || fullCpu.displayName,
        rawCpu: fullCpu.rawRecord || fullCpu,

        gpuHardwareId: fullGpu.hardwareId,
        gpuLegacyId: fullGpu.legacyId || (fullGpu.hardwareSource === 'legacy' ? String(fullGpu._id) : undefined),
        gpuSource: fullGpu.hardwareSource,
        GPU: fullGpu.canonicalName || fullGpu.Device || fullGpu.displayName,
        rawGpu: fullGpu.rawRecord || fullGpu,

        'RAM (GB)': parseInt(ram, 10) || 16,
        Resolution: resolution,
        'Graphics Settings': settings,
        game: selectedGame,
        gameSlug: selectedGameData?.slug || '',
      };

      try {
        const data = await predictFps(payload);

        let finalFps = Number(data.predicted_fps ?? data.predictedFps);
        if (!Number.isFinite(finalFps)) finalFps = 60;
        finalFps = Math.max(5, Math.min(900, finalFps));

        setPrediction(Math.round(finalFps));
        setPredictionMetadata({
          modelVersion: data.modelVersion || 'v2',
          gameCoverage: data.gameCoverage || 'unseen',
          preset: data.preset || settings,
          game: data.game || selectedGame,
        });
      } catch (predictErr) {
        // If Model V2 hardware specs are incomplete for this hardware
        const errData = predictErr.response?.data;
        if (errData?.error === 'MODEL_V2_HARDWARE_DATA_INCOMPLETE' || predictErr.response?.status === 400) {
          setIncompleteV2Notice(
            'Game-specific FPS prediction is not available for this hardware yet, but bottleneck analysis is still available.'
          );
          setAnalysisMode('general');
          setPrediction(null);
          setPredictionMetadata(null);
        } else {
          throw predictErr;
        }
      }

      setBottleneckData(analysis);

      if (analysis.type === 'gpu') {
        const higherGpu = gpuList.find(g => (parseInt(g.CUDA, 10) || 0) > cuda + 20000);
        setRecommendation({
          title: 'Upgrade Recommendation: Graphics Card',
          hardware: higherGpu ? (higherGpu.canonicalName || higherGpu.Device) : 'RTX 4070 / RX 7800 XT',
        });
      } else if (analysis.type === 'cpu') {
        const higherCpu = cpuList.find(c => (parseInt(c.cpuMark, 10) || 0) > cpuScore + 3000);
        setRecommendation({
          title: 'Upgrade Recommendation: Processor',
          hardware: higherCpu ? (higherCpu.canonicalName || higherCpu.cpuName) : 'Ryzen 7 7800X3D / Core i7-14700K',
        });
      } else {
        setRecommendation(null);
      }

      setSmartRec(null);
      setSelectedUpgradeComponent('GPU');
    } catch (err) {
      console.error('Analysis error:', err.message);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to connect to Aura AI.';
      setError(msg);
    } finally {
      setIsThinking(false);
    }
  };

  const handleResetAnalysis = () => {
    setAnalysisMode(null);
    setIncompleteV2Notice(null);
    setPrediction(null);
    setPredictionMetadata(null);
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
        
        <Navbar 
          currentRoute={currentRoute}
          onNavigate={navigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

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
              selectedGame={selectedGame}
              setSelectedGame={setSelectedGame}
              selectedGameData={selectedGameData}
              setSelectedGameData={setSelectedGameData}
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
              predictionMetadata={predictionMetadata}
              bottleneckData={bottleneckData}
              analysisMode={analysisMode}
              incompleteV2Notice={incompleteV2Notice}
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
              onTestGame={(gameObj) => {
                setSelectedGame(gameObj?.name || gameObj?.slug || '');
                setSelectedGameData(gameObj || null);
                handleResetAnalysis();
                navigate(ROUTES.BOTTLENECK_CALCULATOR);
              }}
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

        <Footer onNavigate={navigate} />

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