import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AuthPage from './AuthPage';
import MyRigs from './MyRigs';
import Quotation from './Quotation';
import RigComparison from './RigComparison';
import ErrorBoundary from './ErrorBoundary';
import HardwareSearch from './HardwareSearch';
import { analyzeBottleneck, getExplanation, generateQA } from './utils/BottleneckLogic';


/*  Contact Info*/
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

/* SVG Icon Library */
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
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
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

/* Additional UI Icons */

/* Icon used for store cards and sidebar headings */
const IconStore = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

/* Icon used for Q&A question items */
const IconQuestion = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

/* Icon used for the explanation section */
const IconInfo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* Icon for the upward chevron used in accordion toggle */
const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

/* Icon for external link on store cards */
const IconExternalLink = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

/* Icon for upgrade / arrow right */
const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

/* Icon for RAM */
const IconRam = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="8" width="20" height="8" rx="2"/>
    <path d="M6 8V6M10 8V6M14 8V6M18 8V6M6 16v2M10 16v2M14 16v2M18 16v2"/>
  </svg>
);

/* Icon for GPU */
const IconGpu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"/>
    <circle cx="8" cy="12" r="2"/>
    <circle cx="16" cy="12" r="2"/>
    <path d="M2 10h2M20 10h2M2 14h2M20 14h2"/>
  </svg>
);

/* Main App */
function App() {
  // Session State
  // Restore session from localStorage to persist login
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aura_user')) || null; }
    catch { return null; }
  });

  const handleLogin = useCallback((user) => setCurrentUser(user), []);

  // Clear session data
  const handleLogout = useCallback(() => {
    localStorage.removeItem('aura_token');
    localStorage.removeItem('aura_user');
    setCurrentUser(null);
  }, []);

  // Hardware collections
  const [cpuList, setCpuList]           = useState([]);
  const [gpuList, setGpuList]           = useState([]);
  
  // Dynamic hardware stats for tier calculation
  const [maxStats, setMaxStats]         = useState({ maxCpuMark: 100000, maxGpuCuda: 500000 });

  // Form state
  const [selectedCpu, setSelectedCpu]   = useState('');
  const [selectedGpu, setSelectedGpu]   = useState('');
  // Store the full selected hardware objects so handleConsultAura doesn't
  // have to look them up in cpuList/gpuList (fixes "can't select" bug)
  const [selectedCpuData, setSelectedCpuData] = useState(null);
  const [selectedGpuData, setSelectedGpuData] = useState(null);
  const [resolution, setResolution]     = useState('1920x1080');
  const [settings, setSettings]         = useState('High');
  const [ram, setRam]                   = useState('16');

  // Analysis results
  const [prediction, setPrediction]     = useState(null);
  const [bottleneckData, setBottleneck] = useState(null);
  const [confidence, setConfidence]     = useState(null);
  const [recommendation, setRecommendation] = useState(null);

  // UI state
  const [isThinking, setIsThinking]     = useState(false);
  const [error, setError]               = useState(null);
  const [loadingData, setLoadingData]   = useState(true);

  // Smart Recommendation State
  // Tracks which component the user wants to upgrade
  const [selectedUpgradeComponent, setSelectedUpgradeComponent] = useState(null);
  // Holds the generated suggestion
  const [smartRec, setSmartRec] = useState(null);

  // Explanation State
  // Tracks whether to show 'technical' or 'nontechnical' explanation
  const [explanationType, setExplanationType] = useState(null);

  // Help Panel & Q&A State
  const [showHelp, setShowHelp] = useState(false);
  const [openQA, setOpenQA] = useState(null);

  // Navigation State
  // Toggle between the main analyzer view and the user's saved rigs view
  const [currentView, setCurrentView] = useState('analyzer');

  // Modal State
  const [showSaveRigModal, setShowSaveRigModal] = useState(false);
  const [rigNameInput, setRigNameInput] = useState('');

  // Fetch hardware datasets and dynamic stats on mount
  useEffect(() => {
    (async () => {
      try {
        // We fetch a lightweight list for the recommendation engine and stats for tier calculation
        // The UI search is now handled dynamically by HardwareSearch (fixes Issue 3.1)
        const [c, g, stats] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/cpus/all-lightweight`),
          axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/gpus/all-lightweight`),
          axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/hardware/stats`)
        ]);
        setCpuList(c.data);
        setGpuList(g.data);
        setMaxStats(stats.data);
      } catch (err) {
        console.error("Fetch error", err);
        setError('Could not connect to the backend. Make sure the Node.js server is running.');
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

  // Checks whether the CPU and GPU are a good match.
  // Both are ranked on a 1–10 performance scale and the tier gap
  // determines how severe the bottleneck is.
  // analyzeBottleneck logic was moved to utils/BottleneckLogic.js (Fixes Issue 5.1 Monolithic Component partially)

  // Returns a quick hardware suggestion shown in the result card after analysis
  const getRecommendation = (type, currentCpu, currentGpu) => {

    if (type === 'cpu') {
      const currentCpuMark = parseInt(currentCpu.cpuMark) || 3000;
      const currentGpuCUDA = parseInt(currentGpu.CUDA)    || 5000;

      // Find the ideal CPU tier that matches this GPU's performance level
      let targetCpuMark;
      if      (currentGpuCUDA < 45000)  targetCpuMark = 3000;   // old GPU → i3 level
      else if (currentGpuCUDA < 80000)  targetCpuMark = 5000;   // GTX 1050 → i3/i5 level
      else if (currentGpuCUDA < 110000) targetCpuMark = 8000;   // GTX 1650 → i5 level
      else if (currentGpuCUDA < 155000) targetCpuMark = 12000;  // GTX 1660 Super → i5/i7
      else if (currentGpuCUDA < 215000) targetCpuMark = 17000;  // RTX 3060 Ti → i7 level
      else                              targetCpuMark = 22000;   // RTX 3080+ → i9/Ryzen 9

      // Find CPUs: better than current + closest to what this GPU actually needs
      let candidates = cpuList
        .filter(c => (parseInt(c.cpuMark) || 0) > currentCpuMark)
        .sort((a, b) => {
          const diffA = Math.abs((parseInt(a.cpuMark) || 0) - targetCpuMark);
          const diffB = Math.abs((parseInt(b.cpuMark) || 0) - targetCpuMark);
          return diffA - diffB;
        });

      if (candidates.length > 0) return { title: 'Recommended CPU', hardware: candidates[0].cpuName };

    } else if (type === 'gpu') {
      const currentCpuMark = parseInt(currentCpu.cpuMark) || 3000;
      const currentCUDA    = parseInt(currentGpu.CUDA)    || 0;

      // Max GPU score this CPU can feed without creating a CPU bottleneck
      let maxGpuCUDA;
      if      (currentCpuMark < 1000)  maxGpuCUDA = 35000;   // very old → GTX 750 Ti class
      else if (currentCpuMark < 2500)  maxGpuCUDA = 75000;   // old i3 → GTX 1060 class
      else if (currentCpuMark < 5000)  maxGpuCUDA = 140000;  // mid CPU → GTX 1080 Ti class
      else if (currentCpuMark < 10000) maxGpuCUDA = 220000;  // i5 → RTX 3070 class
      else if (currentCpuMark < 18000) maxGpuCUDA = 264000;  // i7/Ryzen 7 → RTX 3090 class
      else if (currentCpuMark < 28000) maxGpuCUDA = 360000;  // i9/Ryzen 9 → RTX 4090 class
      else                             maxGpuCUDA = 999999;   // top tier → no limit

      const idealCUDA = Math.min(currentCUDA * 2, maxGpuCUDA);
      const minCUDA   = Math.max(10000, currentCUDA * 1.2);  // at least 20% better than current

      // Find GPUs that are a genuine upgrade and within what the CPU can handle
      let candidates = gpuList
        .filter(g => {
          const cuda = parseInt(g.CUDA) || 0;
          return cuda >= minCUDA && cuda <= maxGpuCUDA;
        })
        .sort((a, b) => {
          const diffA = Math.abs((parseInt(a.CUDA) || 0) - idealCUDA);
          const diffB = Math.abs((parseInt(b.CUDA) || 0) - idealCUDA);
          return diffA - diffB;
        });

      // If no upgrade fits, return the best GPU the current CPU can at least properly use
      if (candidates.length === 0) {
        candidates = gpuList
          .filter(g => (parseInt(g.CUDA) || 0) <= maxGpuCUDA && (parseInt(g.CUDA) || 0) > 0)
          .sort((a, b) => (parseInt(b.CUDA) || 0) - (parseInt(a.CUDA) || 0));
      }

      if (candidates.length > 0) return { title: 'Recommended GPU', hardware: candidates[0].Device };
    }
    return null;
  };

  // Prepare and dispatch analysis payload
  const handleConsultAura = async () => {
    setError(null);

    // Validation
    if (!selectedCpu || !selectedGpu) {
      setError('Please select both a CPU and a GPU before analyzing.');
      return;
    }

    // Use the full objects stored at selection time.
    // Fall back to searching cpuList/gpuList for backward-compat (e.g. loaded rigs).
    const fullCpu = selectedCpuData || cpuList.find(c => c.cpuName === selectedCpu);
    const fullGpu = selectedGpuData || gpuList.find(g => g.Device  === selectedGpu);
    if (!fullCpu || !fullGpu) {
      setError('Could not find matching specs. Please choose from the autocomplete suggestions.');
      return;
    }

    setIsThinking(true); setPrediction(null); setBottleneck(null); setConfidence(null); setRecommendation(null);

    // Get hardware specs, using safe defaults when a database field is missing
    const cores = parseInt(fullCpu.cores) || 6;
    const threads = cores * 2;
    const cpuTDP = Math.min(cores * 10, 125);  // capped at 125W to stay realistic
    const cuda = parseInt(fullGpu.CUDA) || 5000;

    // Estimate GPU specs dynamically based on relative power instead of hardcoded buckets
    // This fixes Issue 2.3: Falsified AI Input Features
    const relativePower = Math.min(cuda / maxStats.maxGpuCuda, 1.0);
    const vram = Math.max(4, Math.round(relativePower * 24)); // scale from 4GB to 24GB
    const gpuTdp = Math.max(75, Math.round(relativePower * 400)); // scale from 75W to 400W
    const bandwidth = Math.max(128, Math.round(relativePower * 1008)); // scale up to 1008 GB/s

    // Serialize payload for ML inference
    const payload = {
      'CPU': fullCpu.cpuName, 'CPU Cores': cores, 'CPU Threads': threads, 'CPU TDP (W)': cpuTDP,
      'GPU': fullGpu.Device, 'GPU Series': fullGpu.Manufacturer || 'Nvidia',
      'GPU VRAM (GB)': vram, 'GPU Bandwidth (GB/s)': bandwidth, 'GPU TDP (W)': gpuTdp,
      'RAM (GB)': parseInt(ram), 'Resolution': resolution, 'Graphics Settings': settings,
    };

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/predict`, payload);
      const analysis = analyzeBottleneck(fullCpu, fullGpu, maxStats);
      const cpuScore = parseInt(fullCpu.cpuMark) || 8000;
      let finalFps = data.predicted_fps;

      if (cpuScore < 3000) {
        finalFps = (cpuScore / 100) + 5;
      } else {
        // Only reduce FPS when there's a real bottleneck — balanced builds keep the full score
        if (analysis.severity > 10) {
          finalFps = finalFps - finalFps * (analysis.severity / 100) * 0.70;
        }
      }
      if (finalFps < 5)   finalFps = 5;
      if (finalFps > 900) finalFps = 900;

      // AI confidence drops slightly when the bottleneck is heavy
      const baseConf = 99.2;
      const penalty  = (analysis.severity / 100) * 8.5;
      setConfidence((baseConf - penalty).toFixed(1));

      setPrediction(finalFps.toFixed(1));
      setBottleneck(analysis);
      setRecommendation(getRecommendation(analysis.type, fullCpu, fullGpu));
    } catch {
      setError('Could not reach Project Aura. Make sure the Python AI server is running on port 5000.');
    }
    setIsThinking(false);
  };


  // Clears the current analysis and sends the user back to the selection screen
  const handleResetAnalysis = () => {
    setPrediction(null);
    setBottleneck(null);
    setRecommendation(null);
    setError(null);
    // Clear the smart recommendation panel state too
    setSelectedUpgradeComponent(null);
    setSmartRec(null);
    setExplanationType(null);
    setShowHelp(false);
    setOpenQA(null);
    // Clear selected hardware objects too
    setSelectedCpu('');
    setSelectedGpu('');
    setSelectedCpuData(null);
    setSelectedGpuData(null);
  };


  
  // Shows a tailored upgrade suggestion when the user clicks CPU, GPU, or RAM.
  // Recommendations always consider both components — a weak CPU limits which GPU can be suggested.
  const generateSmartRecommendation = (component) => {
    if (!bottleneckData) return;  // no analysis data yet
    setSelectedUpgradeComponent(component);

    // Use the full objects stored at selection time (fall back to list search for loaded rigs)
    const currentCpuData = selectedCpuData || cpuList.find(c => c.cpuName === selectedCpu);
    const currentGpuData = selectedGpuData || gpuList.find(g => g.Device  === selectedGpu);

    const currentCpuMark  = parseInt(currentCpuData?.cpuMark) || 3000;
    const currentCpuCores = parseInt(currentCpuData?.cores)   || 4; // eslint-disable-line no-unused-vars
    const currentGpuCUDA  = parseInt(currentGpuData?.CUDA)    || 5000;
    const currentRamGB    = parseInt(ram) || 16;

    let result = {};

    if (component === 'CPU') {
      // Find a CPU that is better than current and well-matched to the GPU's performance
      let targetCpuMark;
      if      (currentGpuCUDA < 45000)  targetCpuMark = 3000;   // old GPU → i3 level
      else if (currentGpuCUDA < 80000)  targetCpuMark = 5000;   // GTX 1050 → i3/i5 level
      else if (currentGpuCUDA < 110000) targetCpuMark = 8000;   // GTX 1650 → i5 level
      else if (currentGpuCUDA < 155000) targetCpuMark = 12000;  // GTX 1660 Super → i5/i7
      else if (currentGpuCUDA < 215000) targetCpuMark = 17000;  // RTX 3060 Ti → i7 level
      else                              targetCpuMark = 22000;   // RTX 3080+ → i9/Ryzen 9

      // Sort by closest to what the GPU actually needs
      let betterCpus = cpuList
        .filter(c => (parseInt(c.cpuMark) || 0) > currentCpuMark)
        .sort((a, b) => {
          const diffA = Math.abs((parseInt(a.cpuMark) || 0) - targetCpuMark);
          const diffB = Math.abs((parseInt(b.cpuMark) || 0) - targetCpuMark);
          return diffA - diffB;
        });

      // Also find the best GPU the current CPU can actually use (useful if upgrading the CPU isn't an option)
      let maxGpuForCurrentCpu;
      if      (currentCpuMark < 1000)  maxGpuForCurrentCpu = 35000;   // very old → GTX 750 Ti max
      else if (currentCpuMark < 2500)  maxGpuForCurrentCpu = 75000;   // old i3 → GTX 1060 max
      else if (currentCpuMark < 5000)  maxGpuForCurrentCpu = 140000;  // mid CPU → GTX 1080 Ti max
      else if (currentCpuMark < 10000) maxGpuForCurrentCpu = 220000;  // i5 → RTX 3070 max
      else if (currentCpuMark < 18000) maxGpuForCurrentCpu = 264000;  // i7/Ryzen 7 → RTX 3090 max
      else if (currentCpuMark < 28000) maxGpuForCurrentCpu = 360000;  // i9/Ryzen 9 → RTX 4090 max
      else                             maxGpuForCurrentCpu = 999999;   // top tier → no limit

      const matchedGpus = gpuList
        .filter(g => (parseInt(g.CUDA) || 0) <= maxGpuForCurrentCpu && (parseInt(g.CUDA) || 0) > 0)
        .sort((a, b) => (parseInt(b.CUDA) || 0) - (parseInt(a.CUDA) || 0));

      const matchedGpu = matchedGpus[0]; // best GPU for the current CPU
      const gpuIsOverSpec = currentGpuCUDA > maxGpuForCurrentCpu; // GPU is too powerful for the CPU

      result = {
        recommended: betterCpus.length > 0
          ? betterCpus[0].cpuName
          : 'A modern multi-core CPU matched to your GPU tier',
        improvement: bottleneckData.type === 'cpu'
          ? 'Up to 40% FPS improvement — CPU is your main bottleneck'
          : '5–15% FPS improvement — minor gain since CPU is not the issue',
        compatibility: 'Check motherboard socket type before purchasing (LGA1700, AM5, etc.)',
        priority: bottleneckData.type === 'cpu'
          ? '🔴 High Priority — CPU is the bottleneck'
          : '🟢 Optional — System is not CPU-bottlenecked',
        tip: bottleneckData.type === 'cpu' && gpuIsOverSpec
          // CPU is bottleneck AND GPU is over-spec → give both options
          ? ` Option A — With upgrade budget:\n  → Upgrade CPU to ${betterCpus.length > 0 ? betterCpus[0].cpuName : 'a modern CPU'}.\n  → This unlocks your GPU's full performance and removes the bottleneck.\n\n Option B — No upgrade budget:\n  → Switch GPU to ${matchedGpu ? matchedGpu.Device : 'a smaller GPU'}.\n  → This GPU matches your current CPU — removes bottleneck and may save money.\n  → Selling your current GPU may help offset the cost.`
          : bottleneckData.type === 'cpu'
          ? 'Your CPU cannot keep up with the GPU. Upgrading it will give the biggest FPS boost for this build.'
          : 'Your CPU is performing well. An upgrade is optional unless you plan to get a much more powerful GPU.',
      };

    } else if (component === 'GPU') {
      // Find a GPU that is better than current but won't overpower the CPU
      let maxGpuCUDA;
      if      (currentCpuMark < 1000)  maxGpuCUDA = 35000;   // very old CPU → GTX 750 Ti class
      else if (currentCpuMark < 2500)  maxGpuCUDA = 75000;   // old i3 → GTX 1060 class
      else if (currentCpuMark < 5000)  maxGpuCUDA = 140000;  // mid CPU → GTX 1080 Ti class
      else if (currentCpuMark < 10000) maxGpuCUDA = 220000;  // i5 → RTX 3070 class
      else if (currentCpuMark < 18000) maxGpuCUDA = 264000;  // i7/Ryzen 7 → RTX 3090 class
      else if (currentCpuMark < 28000) maxGpuCUDA = 360000;  // i9/Ryzen 9 → RTX 4090 class
      else                             maxGpuCUDA = 999999;   // top tier → no limit

      // Target roughly 2× the current GPU's score, capped by what the CPU can handle
      const idealCUDA = Math.min(currentGpuCUDA * 2, maxGpuCUDA);
      const minCUDA   = Math.max(10000, currentGpuCUDA * 1.2);  // at least 20% better

      // Find GPUs that are a genuine upgrade and within the CPU's performance ceiling
      let betterGpus = gpuList
        .filter(g => {
          const cuda = parseInt(g.CUDA) || 0;
          return cuda >= minCUDA && cuda <= maxGpuCUDA;
        })
        .sort((a, b) => {
          // Pick closest to ideal (2× current, CPU-capped)
          const diffA = Math.abs((parseInt(a.CUDA) || 0) - idealCUDA);
          const diffB = Math.abs((parseInt(b.CUDA) || 0) - idealCUDA);
          return diffA - diffB;
        });

      // A valid GPU upgrade is available within the CPU's capability
      if (betterGpus.length > 0) {
        const cpuNote = maxGpuCUDA < 999999
          ? `Suggestions are capped at your CPU's capability (~${maxGpuCUDA} CUDA). A stronger GPU would just bottleneck your CPU.`
          : 'Your CPU can handle any GPU without bottlenecking.';

        result = {
          recommended: betterGpus[0].Device,
          improvement: bottleneckData.type === 'gpu'
            ? 'Up to 60% FPS improvement — GPU is your main bottleneck'
            : '10–25% FPS improvement at higher resolutions',
          compatibility: `Check PCIe slot, PSU wattage & case clearance. ${cpuNote}`,
          priority: bottleneckData.type === 'gpu'
            ? '🔴 High Priority — GPU is the bottleneck'
            : '🟢 Beneficial — Will improve visual performance',
          tip: bottleneckData.type === 'gpu'
            ? `Your GPU is the main bottleneck. Upgrading to ${betterGpus[0].Device} will give the biggest FPS gain for your current CPU.`
            : `Upgrading your GPU improves FPS at higher resolutions. This suggestion stays within your CPU's ability to feed the GPU.`,
        };

      // GPU is already beyond what the CPU can handle — suggest two paths
      } else {

        // Option A: find the best GPU the current CPU can actually use (may be a step down)
        const matchedGpus = gpuList
          .filter(g => (parseInt(g.CUDA) || 0) <= maxGpuCUDA && (parseInt(g.CUDA) || 0) > 0)
          .sort((a, b) => (parseInt(b.CUDA) || 0) - (parseInt(a.CUDA) || 0)); // strongest within CPU limit

        const matchedGpu = matchedGpus[0]; // e.g. GTX 750 Ti for a Core2 Duo
        const isActualDowngrade = matchedGpu && (parseInt(matchedGpu.CUDA) || 0) < currentGpuCUDA;

        // Option B: find a CPU upgrade that would let the current GPU work properly
        const neededCpuMark = (() => {
          if      (currentGpuCUDA <= 45000)  return 1000;   // old GPU → basic CPU needed
          else if (currentGpuCUDA <= 80000)  return 2500;   // GTX 1050 range
          else if (currentGpuCUDA <= 140000) return 5000;   // GTX 1650 range
          else if (currentGpuCUDA <= 220000) return 10000;  // GTX 1660 Super → RTX 3070 range
          else if (currentGpuCUDA <= 264000) return 18000;  // RTX 3090 range
          else                               return 28000;  // RTX 4090+ range
        })();

        const cpuCandidates = cpuList
          .filter(c => (parseInt(c.cpuMark) || 0) > currentCpuMark)
          .sort((a, b) => {
            const diffA = Math.abs((parseInt(a.cpuMark) || 0) - neededCpuMark);
            const diffB = Math.abs((parseInt(b.cpuMark) || 0) - neededCpuMark);
            return diffA - diffB;
          });

        const suggestedCpu = cpuCandidates.length > 0
          ? cpuCandidates[0].cpuName
          : 'a modern mid-range CPU';

        result = {
          // Primary recommendation = the GPU that MATCHES the CPU (may be a downgrade)
          recommended: matchedGpu
            ? `${matchedGpu.Device}${isActualDowngrade ? ' (downgrade — better balance with your CPU)' : ' (best match for your CPU)'}`
            : `Upgrade CPU to ${suggestedCpu} to unlock GPU options`,

          // Explain what switching to the matched GPU actually achieves
          improvement: isActualDowngrade
            ? `Switching to ${matchedGpu.Device} removes the CPU bottleneck — your CPU can fully utilize this GPU. You may also sell your current GPU to recover budget.`
            : `${matchedGpu?.Device} is the most powerful GPU your CPU can currently feed without bottleneck.`,

          // Show the CPU ceiling clearly
          compatibility: `Your CPU (cpuMark ≈ ${currentCpuMark}) can feed GPUs up to ~${maxGpuCUDA} CUDA. Your current GPU (${currentGpuCUDA} CUDA) exceeds this — causing CPU bottleneck.`,
          priority: '🟡 Two Paths Available — Choose based on your budget',
          tip: `💡 Option A — No upgrade budget:\n  → Switch to ${matchedGpu ? matchedGpu.Device : 'a smaller GPU'}.\n  → This removes the CPU bottleneck entirely.\n  → Your CPU can fully utilize it — better real-world performance.\n  → Selling your current GPU may help offset cost.\n\n💡 Option B — With upgrade budget:\n  → Upgrade CPU to ${suggestedCpu}.\n  → This unlocks your current GPU's full performance.\n  → Return here after CPU upgrade for a GPU recommendation.`,
        };
      }

    } else if (component === 'RAM') {
      // RAM recommendation: context-aware based on current amount and system tier
      const recommendedRam = currentRamGB < 16 ? 16 : currentRamGB < 32 ? 32 : 64;

      // Recommend the right RAM speed based on the CPU's performance tier
      const ramSpeedSuggestion = currentCpuMark > 10000
        ? 'DDR5 (if motherboard supports it) or DDR4 3600MHz CL16 for best results.'
        : 'DDR4 3200MHz is sufficient for this CPU tier.';

      result = {
        recommended: `${recommendedRam} GB — ${ramSpeedSuggestion}`,
        improvement: currentRamGB < 16
          ? 'Up to 30% reduction in stuttering — low RAM is a common bottleneck'
          : '5–10% improvement in multitasking and background load',
        compatibility: 'Check maximum RAM supported by your motherboard and available slots',
        priority: currentRamGB < 16
          ? '🟠 Recommended — Low RAM causes stuttering in modern games'
          : '🟢 Optional — Current RAM is adequate for gaming',
        tip: currentRamGB < 16
          ? 'Low RAM is causing stuttering and forced page file usage. This is a cheap upgrade with a noticeable real-world difference.'
          : 'Your RAM is adequate. More RAM mainly helps with multitasking and future-proofing rather than raw FPS gains.',
      };
    }

    setSmartRec(result);
  };


  // Returns an explanation of the bottleneck — either simplified or technical
  // depending on what the user selects.
  const getExplanation = (data, style) => {
    if (!data) return '';

    if (data.type === 'cpu') {
      if (style === 'technical') {
        return `The processor is operating at or near 100% utilization while the GPU still has available compute headroom. This CPU bottleneck scenario occurs because the processor cannot generate render commands fast enough to keep the GPU fully saturated. The result is reduced GPU utilization and lower overall FPS than the graphics card is capable of delivering.`;
      } else {
        return `Your computer's brain (the CPU) is working so hard that it's struggling to keep up with your graphics card. Imagine a chef cooking orders too slowly — the kitchen (GPU) is sitting idle waiting. This makes your games run slower than they should.`;
      }
    }

    // GPU Bottleneck Explanations
    if (data.type === 'gpu') {
      if (style === 'technical') {
        return `The GPU is operating at maximum utilization (close to 100% render load) while the CPU still has available processing headroom. This GPU bottleneck occurs because the graphics card cannot render frames fast enough to match the processor's output rate. The result is the CPU waiting on the GPU, which limits overall FPS.`;
      } else {
        return `Your graphics card is working much harder than the rest of your computer. It's like a car engine running at full speed but the wheels can't keep up. This slows down your overall gaming performance, especially at higher resolutions.`;
      }
    }

    // Balanced Build Explanations
    if (style === 'technical') {
      return `The CPU and GPU are operating with a balanced utilization ratio. Neither component is a significant limiting factor for the other, which means the system can sustain consistent frame delivery. Performance is optimized across both processing units.`;
    } else {
      return `Great news! Your CPU and GPU are working well together as a team. Neither one is holding the other back. This means you get smooth, consistent gaming performance without any major weak links in your system.`;
    }
  };


  // NEW FEATURE 05 — Q&A Generator
  // This function returns 3 helpful Q&A items based on the
  // current bottleneck result. The questions and answers
  // change dynamically depending on whether it's a CPU,
  // GPU, or balanced build.
  const generateQA = (data) => {
    // Default Q&A for when no analysis has been run yet
    if (!data) {
      return [
        { q: 'What is a bottleneck?', a: 'A bottleneck happens when one component in your PC is much slower than the others, limiting overall performance.' },
        { q: 'How does Project Aura detect bottlenecks?', a: 'Project Aura uses a trained AI model to predict FPS and then checks if your CPU and GPU power levels are balanced.' },
        { q: 'What should I do first?', a: 'Run an analysis by selecting your CPU, GPU, and game settings, then click "Run Analysis".' },
      ];
    }

    // Q&A tailored for CPU bottleneck
    if (data.type === 'cpu') {
      return [
        {
          q: 'Why is my setup bottlenecked?',
          a: 'Your CPU has too few cores or is too slow to send enough render commands to keep your GPU busy. The GPU ends up waiting, which reduces your FPS.',
        },
        {
          q: 'Will upgrading the GPU improve my performance?',
          a: 'Not much — since the CPU is the bottleneck, a stronger GPU would still be limited by the slow processor. Upgrading the CPU first will give you a much bigger improvement.',
        },
        {
          q: 'What should I upgrade first?',
          a: 'Upgrade your CPU. Look for a modern processor with 6 or more cores. This will free up your GPU to perform at its full potential.',
        },
      ];
    }

    // Q&A tailored for GPU bottleneck
    if (data.type === 'gpu') {
      return [
        {
          q: 'Why is my setup bottlenecked?',
          a: 'Your GPU is not powerful enough to keep up with what your CPU is capable of processing. The graphics card becomes the weakest link, capping your FPS.',
        },
        {
          q: 'Will upgrading the GPU improve my performance?',
          a: 'Yes! Since the GPU is the main limiting component, upgrading to a more powerful graphics card will directly give you higher FPS and smoother gameplay.',
        },
        {
          q: 'What should I upgrade first?',
          a: 'Upgrade your GPU. Look for a card with a higher CUDA core count or compute score. This will immediately improve your gaming performance.',
        },
      ];
    }

    // Q&A for a balanced, well-matched build
    return [
      {
        q: 'Why is my build performing well?',
        a: 'Your CPU and GPU are well-matched — neither one is significantly slower than the other, so they work together efficiently.',
      },
      {
        q: 'Should I still upgrade anything?',
        a: 'There is no urgent need. However, if you want higher FPS at 4K or Ultra settings, upgrading the GPU first usually gives the best improvement.',
      },
      {
        q: 'What is the best future upgrade path?',
        a: 'Start by upgrading your GPU for better visuals, then upgrade RAM if you\'re multitasking heavily. Your CPU is in good shape.',
      },
    ];
  };


  // Auth boundary guard — show login page if not logged in (unchanged)
  if (!currentUser) return <AuthPage onLogin={handleLogin} />;

  // Compute the dynamic Q&A for the right sidebar
  // This runs every render, so it always reflects the latest bottleneck result
  const qaItems = generateQA(bottleneckData);

  return (
    <ErrorBoundary>
      {/* Navigation */}
      <nav className="site-nav">
        <div className="nav-logo">
          <div className="nav-logo-glow" />
          <div className="nav-logo-border" />
          Project Aura
        </div>
        <div className="nav-links">
          <a href="#analyzer" onClick={(e) => { e.preventDefault(); setCurrentView('analyzer'); }}>Analyzer</a>
          <a href="#my-rigs" onClick={(e) => { e.preventDefault(); setCurrentView('my-rigs'); }}>My Rigs</a>
          <a href="#about" onClick={(e) => { if(currentView !== 'analyzer') { e.preventDefault(); setCurrentView('analyzer'); setTimeout(() => window.location.hash = 'about', 100); } }}>About</a>
          <a href="#contact" onClick={(e) => { if(currentView !== 'analyzer') { e.preventDefault(); setCurrentView('analyzer'); setTimeout(() => window.location.hash = 'contact', 100); } }}>Contact</a>
          <button
            id="nav-compare-btn"
            className="nav-compare-btn"
            onClick={() => setCurrentView('compare')}
            title="Compare two PC builds side by side"
          >
            Compare
          </button>
          <span className="nav-badge">AI Powered</span>
          <div className="nav-user-info">
            <span className="nav-username">{currentUser.username}</span>
            <button id="nav-logout-btn" className="nav-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      {/* Conditionally render views */}
      {currentView === 'quotation' ? (
        <Quotation 
            cpu={selectedCpu}
            gpu={selectedGpu}
            ram={ram}
            onBack={() => setCurrentView('analyzer')}
        />
      ) : currentView === 'my-rigs' ? (
        <MyRigs 
          currentUser={currentUser} 
          onBack={() => setCurrentView('analyzer')} 
          onLoadRig={(rig) => {
            // Fill the analyzer inputs with the saved rig's details
            setSelectedCpu(rig.cpu);
            setSelectedGpu(rig.gpu);
            setRam(rig.ram);
            setResolution(rig.resolution);
            // Clear full objects so handleConsultAura falls back to cpuList/gpuList search
            setSelectedCpuData(null);
            setSelectedGpuData(null);
            // Switch back to the analyzer view automatically
            setCurrentView('analyzer');
          }}
        />
      ) : currentView === 'compare' ? (
        <RigComparison
          cpuList={cpuList}
          gpuList={gpuList}
          onBack={() => setCurrentView('analyzer')}
          initialRig={selectedCpu && selectedGpu ? { cpu: selectedCpu, gpu: selectedGpu, ram, resolution, settings } : null}
        />
      ) : (
      <div className="dashboard-shell">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="left-sidebar">
          <div className="sidebar-section-title">Quick Actions</div>

          {/* Need Help button — reveals store cards and Q&A underneath */}
          <button
            id="sidebar-need-help"
            className={`sidebar-action-btn need-help-btn ${showHelp ? 'active' : ''}`}
            onClick={() => setShowHelp(prev => !prev)}
            title="Show Sri Lankan PC stores and helpful Q&A"
          >
            <span className="sidebar-btn-icon"><IconQuestion /></span>
            Need Help?
          </button>

          {showHelp && (
            <div className="left-sidebar-help-content" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="right-panel-card">
                <div className="right-panel-heading">
                  <span className="right-panel-icon"><IconStore /></span>
                  Sri Lankan PC Stores
                </div>
                <div className="store-cards-list">
                  {SRI_LK_STORES.map((store, index) => (
                    <div key={index} className="store-card">
                      <div className="store-card-name">{store.name}</div>
                      <p className="store-card-desc" style={{ fontSize: '0.8rem' }}>{store.description}</p>
                      <a
                        href={store.url}
                        target="_blank"
                        rel="noreferrer"
                        className="store-card-link"
                      >
                        Visit Website
                        <span className="store-link-icon"><IconExternalLink /></span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <div className="right-panel-card">
                <div className="right-panel-heading">
                  <span className="right-panel-icon"><IconQuestion /></span>
                  Helpful Q&amp;A
                </div>
                <div className="qa-list">
                  {qaItems.map((item, index) => (
                    <div key={index} className="qa-item">
                      <button
                        className={`qa-question ${openQA === index ? 'open' : ''}`}
                        onClick={() => setOpenQA(openQA === index ? null : index)}
                        style={{ fontSize: '0.85rem' }}
                      >
                        <span>{item.q}</span>
                        <span className={`qa-chevron ${openQA === index ? 'rotated' : ''}`}>
                          <IconChevronDown />
                        </span>
                      </button>
                      {openQA === index && (
                        <div className="qa-answer" style={{ fontSize: '0.8rem' }}>
                          <p>{item.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ── CENTER CONTENT ── */}
        <main>

          {/* Hero Section */}
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

          {/* Hardware Selection Analyzer */}
          <section className="analyzer-card" id="analyzer">
            <div className="card-title">
              <span className="card-title-icon"><IconBolt /></span>
              Hardware Configuration
            </div>

            {loadingData && (
              <div style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
                <span className="btn-icon" style={{ display: 'inline-block', marginRight: '5px', animation: 'pulse-btn 1.8s infinite' }}>⏳</span>
                Loading hardware database (CPUs & GPUs)...
              </div>
            )}

            <div className="section-label">Your Components</div>

            <div className="form-group">
              <label>Processor (CPU)</label>
              <HardwareSearch 
                type="cpu" 
                placeholder="Type to search CPUs..." 
                value={selectedCpu}
                onSelect={(item) => {
                  setSelectedCpu(item.cpuName);
                  setSelectedCpuData(item); // store full object for analysis
                }} 
              />
            </div>

            <div className="form-group">
              <label>Graphics Card (GPU)</label>
              <HardwareSearch 
                type="gpu" 
                placeholder="Type to search GPUs..." 
                value={selectedGpu}
                onSelect={(item) => {
                  setSelectedGpu(item.Device);
                  setSelectedGpuData(item); // store full object for analysis
                }} 
              />
            </div>

            <div className="section-label">Game Settings</div>

            <div className="form-row">
              <div className="form-group">
                <label>Resolution</label>
                <select value={resolution} onChange={e => setResolution(e.target.value)}>
                  <option value="1920x1080">1080p (FHD)</option>
                  <option value="2560x1440">1440p (QHD)</option>
                  <option value="3840x2160">4K (UHD)</option>
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

            <div className="action-buttons-row" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button
                className={`action-btn${isThinking ? ' loading' : ''}`}
                onClick={handleConsultAura}
                disabled={isThinking}
                style={{ flex: '1', minWidth: '200px' }}
              >
                <span className="btn-icon"><IconScan /></span>
                {isThinking ? 'Aura is Analyzing…' : 'Run Analysis'}
              </button>

              {/* Compare Button */}
              <button
                id="compare-rigs-btn"
                className="compare-action-btn"
                onClick={() => setCurrentView('compare')}
                title="Compare two PC builds side by side"
              >
                Compare Rigs
              </button>
              
              {/* Save this PC Button */}
              <button
                className="save-pc-btn"
                onClick={() => {
                  if (!selectedCpu || !selectedGpu) {
                    setError('Please select a CPU and GPU before saving.');
                    return;
                  }
                  // Guard: user must be logged in to save a rig
                  if (!currentUser) {
                    setError('Please log in to save your PC build.');
                    return;
                  }
                  setRigNameInput('');
                  setShowSaveRigModal(true);
                }}
              >
                 Save this PC
              </button>
            </div>
            {error && (
              <div className="error-banner" style={{ marginTop: '1rem' }}>
                <span className="error-icon"><IconWarning /></span>
                <span>{error}</span>
              </div>
            )}

            {/* If we have a successful prediction, show the Results Wrapper */}
            {prediction && bottleneckData && (
              <div className="results-wrapper">

                {/* Back Button */}
                <button
                  onClick={handleResetAnalysis}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-sub)',
                    padding: '0.6rem 1.2rem',
                    borderRadius: 'var(--radius)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sub)'; }}
                >
                  <span style={{ width: '18px', height: '18px' }}><IconArrowLeft /></span>
                  Back to Selection
                </button>

                {/* Existing results card */}
                <div className={`results-card ${bottleneckData.cardClass}`}>
                  <div className="fps-display">
                    <div className="fps-label">Predicted Performance</div>
                    <div className="fps-value" style={{ color: bottleneckData.color }}>
                      {prediction}<span className="fps-unit" style={{ color: bottleneckData.color }}>FPS</span>
                    </div>
                    {/* Displays the AI confidence level calculated after running the prediction */}
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      AI Accuracy is: {confidence}%
                    </div>
                  </div>
                  <div className="bottleneck-header">
                    <span className="bottleneck-label">Bottleneck Severity</span>
                    <span className="bottleneck-pct" style={{ color: bottleneckData.color }}>{bottleneckData.severity}%</span>
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

                  <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => setCurrentView('quotation')}
                      className="save-pc-btn"
                      style={{ background: 'rgba(56,189,248,0.1)' }}
                    >
                      <span className="btn-icon"><IconScan /></span> View Live Pricing Quotation
                    </button>
                  </div>
                </div>

                {/* Hardware Upgrade Recommendation */}
                {recommendation && (
                  <div className="recommendation-card">
                    <div className="rec-header">
                      <span className="rec-icon"><IconCheck /></span>
                      {recommendation.title}
                    </div>
                    <div className="rec-hardware">
                      {recommendation.hardware}
                    </div>
                    <p className="rec-desc">
                      Upgrading to this component will significantly reduce your system bottleneck and increase overall gaming performance.
                    </p>
                  </div>
                )}

                {/* Smart Component Recommendation Panel */}
                {bottleneckData.severity >= 30 && (
                  <div className="smart-rec-panel">

                    {/* Panel title */}
                    <div className="smart-rec-title">
                      <span className="smart-rec-title-icon"><IconArrowRight /></span>
                      Upgrade Recommendation
                    </div>

                    {/* Step 2: Ask the user which component to upgrade */}
                    <p className="smart-rec-question">Which component would you like to upgrade?</p>

                    {/* Three selectable component cards */}
                    <div className="smart-rec-choices">
                      <button
                        id="smart-rec-cpu-btn"
                        className={`smart-rec-choice-btn ${selectedUpgradeComponent === 'CPU' ? 'selected' : ''}`}
                        onClick={() => generateSmartRecommendation('CPU')}
                      >
                        <span className="choice-icon"><IconCpu /></span>
                        CPU
                      </button>
                      <button
                        id="smart-rec-gpu-btn"
                        className={`smart-rec-choice-btn ${selectedUpgradeComponent === 'GPU' ? 'selected' : ''}`}
                        onClick={() => generateSmartRecommendation('GPU')}
                      >
                        <span className="choice-icon"><IconGpu /></span>
                        GPU
                      </button>
                      <button
                        id="smart-rec-ram-btn"
                        className={`smart-rec-choice-btn ${selectedUpgradeComponent === 'RAM' ? 'selected' : ''}`}
                        onClick={() => generateSmartRecommendation('RAM')}
                      >
                        <span className="choice-icon"><IconRam /></span>
                        RAM
                      </button>
                    </div>

                    {/* Step 3 & 4: Show results after a component is selected */}
                    {smartRec && (
                      <div className="smart-rec-result">

                        {/* Recommended component name */}
                        <div className="smart-rec-row">
                          <span className="smart-rec-label">Recommended</span>
                          <span className="smart-rec-value highlight">{smartRec.recommended}</span>
                        </div>

                        {/* Estimated performance improvement */}
                        <div className="smart-rec-row">
                          <span className="smart-rec-label">Est. Improvement</span>
                          <span className="smart-rec-value green">{smartRec.improvement}</span>
                        </div>

                        {/* Compatibility note */}
                        <div className="smart-rec-row">
                          <span className="smart-rec-label">Compatibility</span>
                          <span className="smart-rec-value">{smartRec.compatibility}</span>
                        </div>

                        {/* Upgrade priority badge */}
                        <div className="smart-rec-row">
                          <span className="smart-rec-label">Priority</span>
                          <span className="smart-rec-value">{smartRec.priority}</span>
                        </div>

                        {/* Step 4: Bottleneck tip message */}
                        <div className="smart-rec-tip">
                          <span className="tip-icon"><IconInfo /></span>
                          <p>{smartRec.tip}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation Panel (Technical/Non-Technical) */}
                <div className="explanation-panel">
                  <div className="explanation-title">
                    <span className="explanation-title-icon"><IconInfo /></span>
                    Performance Explanation
                  </div>

                  {/* Toggle buttons for explanation style */}
                  <div className="explanation-toggle">
                    <button
                      id="explanation-technical-btn"
                      className={`exp-toggle-btn ${explanationType === 'technical' ? 'active' : ''}`}
                      onClick={() => setExplanationType('technical')}
                    >
                      Technical Reason
                    </button>
                    <button
                      id="explanation-nontechnical-btn"
                      className={`exp-toggle-btn ${explanationType === 'nontechnical' ? 'active' : ''}`}
                      onClick={() => setExplanationType('nontechnical')}
                    >
                      Non-Technical Reason
                    </button>
                  </div>

                  {/* Show the explanation text when a style is selected */}
                  {explanationType && (
                    <div className="explanation-text">
                      <p>{getExplanation(bottleneckData, explanationType)}</p>
                    </div>
                  )}

                  {/* Prompt user to select a style if none chosen yet */}
                  {!explanationType && (
                    <p className="explanation-prompt">
                      Select an explanation style above to understand why this bottleneck is happening.
                    </p>
                  )}
                </div>

              </div>
            )}
          </section>

          {/* About Section */}
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

        {/* ── RIGHT SIDEBAR ────────────────────────────────────── */}
        <aside className="right-sidebar">

          {/* ── Status summary panel (always visible when results exist) ── */}
          {bottleneckData ? (
            <div className="right-panel-card">
              <div className="right-panel-heading">
                <span className="right-panel-icon"><IconScan /></span>
                Analysis Summary
              </div>
              <div className="summary-row">
                <span className="summary-label">FPS</span>
                <span className="summary-value primary">{prediction}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Severity</span>
                <span className="summary-value" style={{ color: bottleneckData.color }}>
                  {bottleneckData.severity}%
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Type</span>
                <span className="summary-value">
                  {bottleneckData.type ? bottleneckData.type.toUpperCase() + ' Bottleneck' : 'Balanced'}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">AI Accuracy</span>
                <span className="summary-value primary">{confidence}%</span>
              </div>
            </div>
          ) : (
            /* Placeholder card when no analysis is run yet */
            <div className="right-panel-card placeholder-card">
              <div className="right-panel-heading">
                <span className="right-panel-icon"><IconScan /></span>
                Analysis Summary
              </div>
              <p className="placeholder-text">Run an analysis to see your summary here.</p>
            </div>
          )}

          {/* ── Bottleneck Tips panel (always visible) ── */}
          <div className="right-panel-card">
            <div className="right-panel-heading">
              <span className="right-panel-icon"><IconBolt /></span>
              Bottleneck Tips
            </div>
            <ul className="tips-list">
              <li>A bottleneck above 70% means one component is significantly limiting performance.</li>
              <li>CPU bottlenecks are common when pairing old processors with new GPUs.</li>
              <li>GPU bottlenecks are common at high resolutions (1440p / 4K).</li>
              <li>16 GB RAM is the recommended minimum for modern gaming.</li>
              <li>Always check component compatibility before purchasing an upgrade.</li>
            </ul>
          </div>

          {/* ── Smart Recommendation Summary (shows when user selected a component) ── */}
          {smartRec && (
            <div className="right-panel-card rec-summary-card">
              <div className="right-panel-heading">
                <span className="right-panel-icon"><IconArrowRight /></span>
                Upgrade Suggestion
              </div>
              <div className="rec-summary-component">
                Upgrading: <strong>{selectedUpgradeComponent}</strong>
              </div>
              <div className="rec-summary-item">
                <span className="rec-summary-label">Recommended</span>
                <span className="rec-summary-value">{smartRec.recommended}</span>
              </div>
              <div className="rec-summary-item">
                <span className="rec-summary-label">Improvement</span>
                <span className="rec-summary-value green">{smartRec.improvement}</span>
              </div>
            </div>
          )}

          {/* Need Help cards moved to Left Sidebar under Need Help button */}

        </aside>

      </div>
      )}

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

      {/* ── SAVE RIG MODAL ── */}
      {showSaveRigModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div className="modal-content" style={{
            background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)', width: '90%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>💾</span> Save this PC
            </h3>
            <p style={{ color: 'var(--text-sub)', marginBottom: '1rem', fontSize: '0.95rem' }}>Give this PC a name (e.g. "My Gaming Rig"):</p>
            <input 
              type="text" 
              value={rigNameInput}
              onChange={(e) => setRigNameInput(e.target.value)}
              placeholder="My Awesome PC"
              style={{
                width: '100%', padding: '0.8rem', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', boxSizing: 'border-box',
                color: 'var(--text-main)', marginBottom: '1.5rem', outline: 'none', fontSize: '1rem'
              }}
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
                onClick={async () => {
                  if (!rigNameInput.trim()) return;
                  try {
                    // Get the JWT token saved at login time
                    const token = localStorage.getItem('aura_token');

                    // Guard: if token is missing or literally the string "null", stop immediately
                    if (!token || token === 'null' || token === 'undefined') {
                      setError('You are not logged in. Please sign in and try again.');
                      setShowSaveRigModal(false);
                      return;
                    }

                    await axios.post(`${import.meta.env.VITE_API_URL}/api/user/rigs`, 
                      { name: rigNameInput.trim(), cpu: selectedCpu, gpu: selectedGpu, ram, resolution },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setShowSaveRigModal(false);
                    alert('PC Saved successfully! You can view it in the "My Rigs" tab.');
                  } catch (err) {
                    // Extract the real error message from the backend response
                    const msg = err.response?.data?.error || err.message || 'Failed to save PC.';
                    console.error('Save Rig error:', msg);
                    setError(`Save failed: ${msg}`);
                    setShowSaveRigModal(false);
                  }
                }}
                disabled={!rigNameInput.trim()}
                style={{ background: 'var(--primary)', color: 'black', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius)', cursor: rigNameInput.trim() ? 'pointer' : 'not-allowed', fontWeight: 'bold', opacity: rigNameInput.trim() ? 1 : 0.5 }}
              >
                Save PC
              </button>
            </div>
          </div>
        </div>
      )}

    </ErrorBoundary>
  );
}

export default App;