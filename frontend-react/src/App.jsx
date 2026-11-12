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
import NotFoundPage from './pages/NotFoundPage';
import AuthPage from './AuthPage';
import MyRigs from './MyRigs';
import Quotation from './Quotation';
import RigComparison from './RigComparison';
import ErrorBoundary from './ErrorBoundary';
import SaveRigModal from './components/common/SaveRigModal';

import { ROUTES, getNormalizedRoute, getGameSlug, getRouteTitle } from './constants/routes';
import { PREDICTION_PRESETS, PREDICTION_RESOLUTION } from './constants/hardware';
import { useAuth } from './hooks/useAuth';
import { useHardwareData } from './hooks/useHardwareData';
import { searchCpus, searchGpus } from './services/hardwareService';
import { predictFps } from './services/analysisService';
import { saveUserRig } from './services/rigService';
import { getErrorMessage } from './services/apiClient';
import { analyzeBottleneck } from './utils/BottleneckLogic';

const cpuNameOf = (c) => c?.displayName || c?.canonicalName || c?.cpuName || '';
const gpuNameOf = (g) => g?.displayName || g?.canonicalName || g?.Device || g?.gpuName || '';
const scoreOf = (value) => parseInt(value, 10) || 0;

/**
 * Resolves the full hardware record for a name when only the name is known
 * (e.g. a loaded rig). Only exact name matches are accepted, never a fuzzy guess.
 */
async function resolveHardware(selectedData, name, list, search, nameOf) {
  if (selectedData) return selectedData;
  const target = name.trim().toLowerCase();
  try {
    const matches = await search(name);
    const exact = (Array.isArray(matches) ? matches : []).find((m) => nameOf(m).toLowerCase() === target);
    if (exact) return exact;
  } catch {
    // fall back to the preloaded list below
  }
  return list.find((item) => nameOf(item).toLowerCase() === target) || null;
}

/** Closest part that is meaningfully faster than the current one (not the alphabetically first). */
function pickUpgrade(list, scoreField, current, minGain) {
  return list
    .filter((item) => scoreOf(item[scoreField]) > current + minGain)
    .sort((a, b) => scoreOf(a[scoreField]) - scoreOf(b[scoreField]))[0] || null;
}

function buildRecommendation(analysis, fullCpu, fullGpu, cpuList, gpuList) {
  if (analysis.type === 'gpu') {
    const better = pickUpgrade(gpuList, 'CUDA', scoreOf(fullGpu.CUDA), 20000);
    return { title: 'Upgrade Recommendation: Graphics Card', hardware: better ? gpuNameOf(better) : 'RTX 4070 / RX 7800 XT' };
  }
  if (analysis.type === 'cpu') {
    const better = pickUpgrade(cpuList, 'cpuMark', scoreOf(fullCpu.cpuMark), 3000);
    return { title: 'Upgrade Recommendation: Processor', hardware: better ? cpuNameOf(better) : 'Ryzen 7 7800X3D / Core i7-14700K' };
  }
  return null;
}

function App() {
  const [currentRoute, setCurrentRoute] = useState(() => getNormalizedRoute(window.location.pathname));

  useEffect(() => {
    document.title = getRouteTitle(currentRoute);
  }, [currentRoute]);

  const navigate = useCallback((route) => {
    window.history.pushState({}, '', route);
    setCurrentRoute(getNormalizedRoute(route));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onPopState = () => setCurrentRoute(getNormalizedRoute(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const { currentUser, login, logout } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
    if (currentRoute === ROUTES.MY_RIGS) navigate(ROUTES.BOTTLENECK_CALCULATOR);
  }, [currentRoute, logout, navigate]);

  const { cpuList, gpuList, maxStats, loading: loadingData, error: hardwareError } = useHardwareData();

  const [selectedCpu, setSelectedCpu] = useState('');
  const [selectedGpu, setSelectedGpu] = useState('');
  const [selectedCpuData, setSelectedCpuData] = useState(null);
  const [selectedGpuData, setSelectedGpuData] = useState(null);
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedGameData, setSelectedGameData] = useState(null);
  const [ram, setRam] = useState('16');
  const [resolution, setResolution] = useState(PREDICTION_RESOLUTION);
  const [settings, setSettings] = useState('Medium');

  const [isThinking, setIsThinking] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [predictionMetadata, setPredictionMetadata] = useState(null);
  const [bottleneckData, setBottleneckData] = useState(null);
  const [analysisCpu, setAnalysisCpu] = useState(null);
  const [analysisGpu, setAnalysisGpu] = useState(null);
  const [analysisMode, setAnalysisMode] = useState(null); // 'general' | 'game'
  const [incompleteV2Notice, setIncompleteV2Notice] = useState(null); // { title, message } | null
  const [recommendation, setRecommendation] = useState(null);
  const [smartRec, setSmartRec] = useState(null);
  const [selectedUpgradeComponent, setSelectedUpgradeComponent] = useState('GPU');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const [showSaveRigModal, setShowSaveRigModal] = useState(false);

  const handleResetAnalysis = useCallback(() => {
    setAnalysisMode(null);
    setIncompleteV2Notice(null);
    setPrediction(null);
    setPredictionMetadata(null);
    setBottleneckData(null);
    setAnalysisCpu(null);
    setAnalysisGpu(null);
    setRecommendation(null);
    setSmartRec(null);
    setError(null);
  }, []);

  const handleConsultAura = async () => {
    if (!selectedCpu || !selectedGpu) {
      setError('Please select both a CPU and a GPU from the search suggestions.');
      return;
    }
    handleResetAnalysis();
    setIsThinking(true);

    try {
      const fullCpu = await resolveHardware(selectedCpuData, selectedCpu, cpuList, searchCpus, cpuNameOf);
      const fullGpu = await resolveHardware(selectedGpuData, selectedGpu, gpuList, searchGpus, gpuNameOf);
      if (!fullCpu) throw new Error(`CPU "${selectedCpu}" was not found. Please choose it from the suggestions.`);
      if (!fullGpu) throw new Error(`GPU "${selectedGpu}" was not found. Please choose it from the suggestions.`);

      const analysis = analyzeBottleneck(fullCpu, fullGpu, maxStats);
      setAnalysisCpu(fullCpu);
      setAnalysisGpu(fullGpu);
      setBottleneckData(analysis);
      setRecommendation(buildRecommendation(analysis, fullCpu, fullGpu, cpuList, gpuList));
      setSelectedUpgradeComponent('GPU');
      setAnalysisMode('general');

      if (!selectedGame.trim()) return;

      if (resolution !== PREDICTION_RESOLUTION) {
        setIncompleteV2Notice({
          title: 'Resolution Support in Development',
          message: 'Game FPS prediction is currently validated for 1080p only. 1440p and 4K prediction support is still being developed.',
        });
        return;
      }
      if (!PREDICTION_PRESETS.includes(settings)) {
        setIncompleteV2Notice({
          title: 'Preset Not Supported',
          message: `Game FPS prediction is available for the ${PREDICTION_PRESETS.join(' and ')} presets.`,
        });
        return;
      }

      try {
        const data = await predictFps({
          cpuHardwareId: fullCpu.hardwareId || undefined,
          cpuLegacyId: fullCpu.legacyId || undefined,
          CPU: cpuNameOf(fullCpu),
          rawCpu: fullCpu,
          gpuHardwareId: fullGpu.hardwareId || undefined,
          gpuLegacyId: fullGpu.legacyId || undefined,
          GPU: gpuNameOf(fullGpu),
          rawGpu: fullGpu,
          'RAM (GB)': parseInt(ram, 10) || 16,
          Resolution: resolution,
          'Graphics Settings': settings,
          game: selectedGame,
          gameSlug: selectedGameData?.slug || '',
        });

        const fps = Number(data?.predictedFps);
        if (!Number.isFinite(fps) || fps <= 0) {
          throw new Error('The prediction service returned an invalid result.');
        }

        setAnalysisMode('game');
        setPrediction(Math.round(fps));
        setPredictionMetadata({
          modelVersion: data.modelVersion || null,
          gameCoverage: data.gameCoverage || 'unseen',
          preset: data.preset || settings,
          game: data.game || selectedGame,
        });
      } catch (predictErr) {
        const code = predictErr.response?.data?.error;
        setIncompleteV2Notice(code === 'MODEL_V2_HARDWARE_DATA_INCOMPLETE'
          ? {
            title: 'Game FPS Not Available for This Hardware',
            message: 'We don\'t have the full physical specifications for this CPU/GPU yet. The bottleneck analysis below is still valid.',
          }
          : {
            title: 'Game FPS Prediction Unavailable',
            message: `${getErrorMessage(predictErr, predictErr.message)} The bottleneck analysis below is still valid.`,
          });
      }
    } catch (err) {
      handleResetAnalysis();
      setError(getErrorMessage(err, err.message || 'Analysis failed. Please try again.'));
    } finally {
      setIsThinking(false);
    }
  };

  const generateSmartRecommendation = (componentType) => {
    setSelectedUpgradeComponent(componentType);
    const cpuScore = scoreOf(analysisCpu?.cpuMark) || 8000;
    const gpuScore = scoreOf(analysisGpu?.CUDA) || 5000;
    const currentRamGB = parseInt(ram, 10) || 16;
    const type = bottleneckData?.type;

    if (componentType === 'CPU') {
      const upgrade = pickUpgrade(cpuList, 'cpuMark', cpuScore, cpuScore * 0.4);
      setSmartRec({
        component: 'CPU',
        recommended: upgrade ? cpuNameOf(upgrade) : 'AMD Ryzen 7 7800X3D / Intel Core i7-14700K',
        improvement: type === 'cpu' ? 'Large gains in CPU-bound titles' : 'Small gains (the GPU is the main limiter)',
        compatibility: 'Verify motherboard socket and cooler capacity',
        priority: type === 'cpu' ? '🔴 High Priority — Primary Bottleneck' : '🟢 Low Priority — CPU is not the limiter',
        tip: type === 'cpu'
          ? 'Your CPU is restricting your graphics card. A faster modern CPU will reduce frame drops.'
          : 'Your CPU is already well-matched. Upgrading it will yield minimal gains without a GPU upgrade.',
      });
    } else if (componentType === 'GPU') {
      const upgrade = pickUpgrade(gpuList, 'CUDA', gpuScore, gpuScore * 0.5);
      setSmartRec({
        component: 'GPU',
        recommended: upgrade ? gpuNameOf(upgrade) : 'NVIDIA RTX 4070 Ti Super / AMD RX 7900 GRE',
        improvement: type === 'gpu' ? 'Large gains, especially at higher resolutions' : 'Moderate gains (the CPU may become the limiter)',
        compatibility: 'Check PSU wattage and case clearance',
        priority: type === 'gpu' ? '🔴 High Priority — Primary Bottleneck' : '🟡 Medium Priority',
        tip: type === 'gpu'
          ? 'Your GPU is operating at maximum capacity. A graphics upgrade will unlock higher resolutions and frame rates.'
          : 'Upgrading the GPU will improve visual settings, but make sure your CPU can keep up.',
      });
    } else {
      setSmartRec({
        component: 'RAM',
        recommended: currentRamGB < 16 ? '16 GB DDR4/DDR5 (2x8GB Dual-Channel)' : '32 GB DDR5',
        improvement: currentRamGB < 16 ? 'Better 1% low FPS and fewer stutters' : 'Extra headroom for multitasking',
        compatibility: 'Install a matched dual-channel kit in the recommended slots',
        priority: currentRamGB < 16 ? '🟠 Recommended — Low RAM causes frame stutters' : '🟢 Optional — Current RAM is adequate',
        tip: currentRamGB < 16
          ? '8GB of RAM causes paging and micro-stutters. 16GB dual-channel is the best value upgrade.'
          : 'Your system memory is sufficient for modern gaming titles.',
      });
    }
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
        cpuHardwareId: selectedCpuData?.hardwareId || undefined,
        gpuHardwareId: selectedGpuData?.hardwareId || undefined,
        cpuDisplayName: selectedCpu,
        gpuDisplayName: selectedGpu,
      });
      setShowSaveRigModal(false);
      setNotice('PC build saved! You can find it under "My Rigs".');
    } catch (err) {
      setShowSaveRigModal(false);
      if (err.response?.status === 401) {
        navigate(ROUTES.AUTH); // session expired; useAuth already logged out
        return;
      }
      setError(getErrorMessage(err, 'Failed to save PC.'));
    }
  };

  const handleLoadRig = (rig) => {
    handleResetAnalysis();
    setSelectedCpu(rig.cpuDisplayName || rig.cpu);
    setSelectedGpu(rig.gpuDisplayName || rig.gpu);
    setSelectedCpuData(null); // resolved by exact name on the next analysis
    setSelectedGpuData(null);
    setSelectedGame('');
    setSelectedGameData(null);
    setRam(String(rig.ram || '16'));
    setResolution(rig.resolution || PREDICTION_RESOLUTION);
    setSettings(PREDICTION_PRESETS.includes(rig.settings) ? rig.settings : 'Medium');
    navigate(ROUTES.BOTTLENECK_CALCULATOR);
  };

  const handleLogin = (destination) => (token, user) => {
    login(token, user);
    navigate(destination);
  };

  const gameSlug = getGameSlug(currentRoute);

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
          {currentRoute === ROUTES.HOME && <HomePage onNavigate={navigate} />}

          {currentRoute === ROUTES.BOTTLENECK_CALCULATOR && (
            <BottleneckCalculatorPage
              loadingData={loadingData}
              hardwareError={hardwareError}
              selectedCpu={selectedCpu}
              setSelectedCpu={setSelectedCpu}
              setSelectedCpuData={setSelectedCpuData}
              selectedGpu={selectedGpu}
              setSelectedGpu={setSelectedGpu}
              setSelectedGpuData={setSelectedGpuData}
              selectedGame={selectedGame}
              setSelectedGame={setSelectedGame}
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
              error={error}
              notice={notice}
              onDismissNotice={() => setNotice(null)}
              currentUser={currentUser}
              onNavigate={navigate}
              onOpenSaveModal={() => setShowSaveRigModal(true)}
            />
          )}

          {currentRoute === ROUTES.COMPARE && (
            <RigComparison
              cpuList={cpuList}
              gpuList={gpuList}
              maxStats={maxStats}
              onBack={() => navigate(ROUTES.BOTTLENECK_CALCULATOR)}
              initialRig={selectedCpu && selectedGpu ? { cpu: selectedCpu, gpu: selectedGpu, ram, resolution, settings } : null}
              currentUser={currentUser}
            />
          )}

          {currentRoute === ROUTES.GAMES && <GamesPage onNavigate={navigate} />}

          {gameSlug && (
            <GameDetailPage
              slug={gameSlug}
              onNavigate={navigate}
              onTestGame={(gameObj) => {
                handleResetAnalysis();
                setSelectedGame(gameObj?.name || gameObj?.slug || '');
                setSelectedGameData(gameObj || null);
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
              <AuthPage onLogin={handleLogin(ROUTES.MY_RIGS)} />
            )
          )}

          {currentRoute === ROUTES.ABOUT && <AboutPage onNavigate={navigate} />}
          {currentRoute === ROUTES.METHODOLOGY && <MethodologyPage onNavigate={navigate} />}
          {currentRoute === ROUTES.PRIVACY && <PrivacyPage onNavigate={navigate} />}
          {currentRoute === ROUTES.TERMS && <TermsPage />}
          {currentRoute === ROUTES.CONTACT && <ContactPage />}
          {currentRoute === ROUTES.AUTH && <AuthPage onLogin={handleLogin(ROUTES.BOTTLENECK_CALCULATOR)} />}

          {currentRoute === ROUTES.QUOTATION && (
            <Quotation
              cpu={selectedCpu}
              gpu={selectedGpu}
              ram={ram}
              onBack={() => navigate(ROUTES.BOTTLENECK_CALCULATOR)}
            />
          )}

          {currentRoute === ROUTES.NOT_FOUND && <NotFoundPage onNavigate={navigate} />}
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
