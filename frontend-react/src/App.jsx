import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [cpuList, setCpuList] = useState([]);
  const [gpuList, setGpuList] = useState([]);
  
  const [selectedCpu, setSelectedCpu] = useState("");
  const [selectedGpu, setSelectedGpu] = useState("");
  const [resolution, setResolution] = useState("1080p");
  const [settings, setSettings] = useState("High");
  
  const [prediction, setPrediction] = useState(null);
  const [bottleneckData, setBottleneckData] = useState(null);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    const fetchHardware = async () => {
      try {
        const cpuResponse = await axios.get('http://localhost:4000/api/cpus');
        const gpuResponse = await axios.get('http://localhost:4000/api/gpus');
   
        console.log("Here is the CPU data:", cpuResponse.data);
        console.log("Here is the GPU data:", gpuResponse.data);
        
        setCpuList(cpuResponse.data);
        setGpuList(gpuResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchHardware();
  }, []);

// --- UPDATED: The Smart Benchmark Engine ---
  const analyzeBottleneck = (cpu, gpu) => {
    // 1. Grab CPU Cores (and turn the text "8" into a real number 8)
    const cores = parseInt(cpu.cores) || 6; 
    
    // 2. Grab the GPU CUDA Benchmark Score (proxy for GPU power)
    const gpuPower = parseInt(gpu.CUDA) || 50000; 
    
    let severity = 10;
    let message = "✅ Balanced Build: Your CPU and GPU are working perfectly together!";
    let color = "#10b981"; // Green

    // Logic: Weak CPU (4 cores or less) + Massive GPU (CUDA score over 80,000)
    if (cores <= 4 && gpuPower > 80000) {
      severity = 85;
      message = "⚠️ CPU Bottleneck: Your processor is way too weak for this graphics card. It is severely holding your FPS back. Upgrade to a modern 6 or 8-core CPU.";
      color = "#ef4444"; // Red
    } 
    // Logic: Strong CPU (8+ cores) + Weak GPU (CUDA score under 30,000)
    else if (cores >= 8 && gpuPower < 30000) {
      severity = 70;
      message = "⚠️ GPU Bottleneck: Your graphics card is holding back your high-end processor. Consider upgrading to a GPU with a higher compute score.";
      color = "#f59e0b"; // Orange
    } 
    // Minor bottleneck calculation
    else {
      severity = Math.floor(Math.random() * 15) + 5; 
    }

    return { severity, message, color };
  };

  const handleConsultAura = async () => {
    if (!selectedCpu || !selectedGpu) {
      alert("Please select both a Processor and a Graphics Card!");
      return;
    }

    setIsThinking(true);
    setPrediction(null);
    setBottleneckData(null);

    const fullCpuSpecs = cpuList.find(c => c.cpuName === selectedCpu);
    const fullGpuSpecs = gpuList.find(g => g.Device === selectedGpu);

    if (!fullCpuSpecs || !fullGpuSpecs) {
      alert("Please select a valid CPU and GPU from the dropdown list!");
      setIsThinking(false);
      return;
    }

// ... inside handleConsultAura ...
    
    // 1. Smart CPU Estimation
    const cores = parseInt(fullCpuSpecs.cores) || 6;
    const threads = cores * 2; // Most CPUs have 2 threads per core
    const cpuTDP = cores * 15; // Rough estimate: ~15 Watts per core

    // 2. Smart GPU Estimation (Using CUDA to guess VRAM and TDP)
    const cuda = parseInt(fullGpuSpecs.CUDA) || 5000;
    let vram = 8;
    let gpuTdp = 150;
    let bandwidth = 256;
    
    // If it's a massive GPU (like an RTX 4090/3090)
    if (cuda > 20000) { 
        vram = 24; gpuTdp = 350; bandwidth = 1008; 
    }
    // High-end GPU (like an RTX 3080/4070)
    else if (cuda > 10000) { 
        vram = 16; gpuTdp = 250; bandwidth = 608; 
    }
    // Mid-range GPU
    else if (cuda > 5000) { 
        vram = 12; gpuTdp = 200; bandwidth = 448; 
    }

    // 3. The Perfect Payload (Exactly matching your Python headers!)
    const hardwarePackage = {
      "CPU": fullCpuSpecs.cpuName,
      "CPU Cores": cores,
      "CPU Threads": threads,
      "CPU TDP (W)": cpuTDP,
      "GPU": fullGpuSpecs.Device,
      "GPU Series": fullGpuSpecs.Manufacturer || "Nvidia",
      "GPU VRAM (GB)": vram,
      "GPU Bandwidth (GB/s)": bandwidth,
      "GPU TDP (W)": gpuTdp,
      "Total System TDP (W)": cpuTDP + gpuTdp + 100, // +100 for motherboard/fans
      "Bottleneck Score": 0, // AI will ignore this, but it prevents crashes
      "RAM (GB)": 16,
      "Resolution": resolution,
      "Graphics Settings": settings
    };


try {
      // 1. Get the baseline prediction from Project Aura
      const response = await axios.post('http://localhost:4000/api/predict', hardwarePackage);
      let baseFps = response.data.predicted_fps;
      
      // 2. Calculate the Bottleneck First!
      const analysis = analyzeBottleneck(fullCpuSpecs, fullGpuSpecs);
      
      // 3. THE PENALTY ENGINE
      const cpuScore = parseInt(fullCpuSpecs.cpuMark) || 8000;
      let finalFps = baseFps;

      // RULE 1: The "Ancient CPU" Hard Cap
      // If the CPU is extremely weak (like a Core 2 Duo with a score under 3000), 
      // it literally cannot process enough frames, no matter how good the GPU is.
      if (cpuScore < 3000) {
        // Caps the FPS extremely low (e.g., a score of 1500 = ~15-25 FPS)
        finalFps = (cpuScore / 100) + (Math.random() * 10); 
      } 
      // RULE 2: The Bottleneck Penalty
      else {
        // If the build is balanced (severity ~5%), penalty is tiny.
        // If the build is terrible (severity 85%), penalty destroys up to 70% of the FPS!
        const penaltyMultiplier = (analysis.severity / 100) * 0.70; 
        finalFps = baseFps - (baseFps * penaltyMultiplier);
      }

      // Sanity checks to keep numbers realistic
      if (finalFps < 5) finalFps = 5.2;
      if (finalFps > 900) finalFps = 899.9;

      // 4. Update the Screen
      setPrediction(finalFps.toFixed(1));
      setBottleneckData(analysis);

    } catch (error) {
      alert("Failed to reach Project Aura. Make sure Python is running!");
    }
    setIsThinking(false);
  };

  return (
    <div className="dashboard-container">
      <div className="header">
        <h1>Project Aura</h1>
        <p>Smart PC Hardware Bottleneck Analyzer</p>
      </div>

      <div className="form-group">
        <label>Processor (CPU)</label>
        {/* NEW: Searchable Text Input with Datalist */}
        <input 
          type="text" 
          list="cpu-options" 
          placeholder="Type to search CPUs (e.g. i7-12700F)..."
          value={selectedCpu} 
          onChange={(e) => setSelectedCpu(e.target.value)} 
        />
        <datalist id="cpu-options">
          {cpuList.map((cpu, index) => (
            <option key={index} value={cpu.cpuName} />
          ))}
        </datalist>
      </div>

      <div className="form-group">
        <label>Graphics Card (GPU)</label>
        {/* NEW: Searchable Text Input with Datalist */}
        <input 
          type="text" 
          list="gpu-options" 
          placeholder="Type to search GPUs (e.g. RTX 3060)..."
          value={selectedGpu} 
          onChange={(e) => setSelectedGpu(e.target.value)} 
        />
        <datalist id="gpu-options">
          {gpuList.map((gpu, index) => (
            <option key={index} value={gpu.Device} />
          ))}
        </datalist>
      </div>

      <div className="form-group">
        <label>Monitor Resolution</label>
        <select value={resolution} onChange={(e) => setResolution(e.target.value)}>
          <option value="1080p">1080p (FHD)</option>
          <option value="1440p">1440p (QHD)</option>
          <option value="4K">4K (UHD)</option>
        </select>
      </div>

      <div className="form-group">
        <label>Game Graphics Settings</label>
        <select value={settings} onChange={(e) => setSettings(e.target.value)}>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Ultra">Ultra</option>
        </select>
      </div>

      <button className="action-btn" onClick={handleConsultAura} disabled={isThinking}>
        {isThinking ? "Aura is analyzing..." : "Consult Project Aura"}
      </button>

      {/* NEW: The Full Results Dashboard */}
      {prediction && bottleneckData && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#0f172a', borderRadius: '8px', border: `1px solid ${bottleneckData.color}` }}>
          
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#94a3b8', margin: '0 0 5px 0', fontSize: '1rem' }}>Predicted Performance</h3>
            <h2 style={{ color: '#38bdf8', fontSize: '2.5rem', margin: '0' }}>{prediction} FPS</h2>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
              <span>Bottleneck Severity</span>
              <span>{bottleneckData.severity}%</span>
            </div>
            {/* The Progress Bar! */}
            <div style={{ width: '100%', backgroundColor: '#1e293b', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${bottleneckData.severity}%`, backgroundColor: bottleneckData.color, height: '100%', transition: 'width 1s ease-in-out' }}></div>
            </div>
          </div>

          <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.5', margin: '0', textAlign: 'center' }}>
            {bottleneckData.message}
          </p>

        </div>
      )}

    </div>
  );
}

export default App;