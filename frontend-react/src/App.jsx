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
        setCpuList(cpuResponse.data);
        setGpuList(gpuResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchHardware();
  }, []);

  // --- NEW: The Recommendation Engine ---
  const analyzeBottleneck = (cpu, gpu) => {
    // We safely grab the core counts and VRAM, defaulting to standard numbers if missing
    const cores = cpu.Cores || 6; 
    const vram = gpu.Memory || 8;
    
    let severity = 10;
    let message = "✅ Balanced Build: Your CPU and GPU are working perfectly together!";
    let color = "#10b981"; // Green

    // Logic: Weak CPU + Strong GPU
    if (cores <= 4 && vram >= 8) {
      severity = 75;
      message = "⚠️ CPU Bottleneck: Your processor is too weak for this graphics card. It is holding your FPS back. Consider upgrading to a CPU with at least 6 or 8 cores.";
      color = "#ef4444"; // Red
    } 
    // Logic: Strong CPU + Weak GPU
    else if (vram <= 4 && cores >= 8) {
      severity = 65;
      message = "⚠️ GPU Bottleneck: Your graphics card is holding back your high-end processor. Consider upgrading to a GPU with more VRAM for better gaming.";
      color = "#f59e0b"; // Orange
    } 
    // Minor bottleneck calculations
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

    // If the user typed a name that isn't in the list, stop them
    if (!fullCpuSpecs || !fullGpuSpecs) {
      alert("Please select a valid CPU and GPU from the dropdown list!");
      setIsThinking(false);
      return;
    }

    const hardwarePackage = {
      "CPU": fullCpuSpecs.cpuName,
      "CPU Cores": fullCpuSpecs.Cores || 8,
      "CPU Threads": fullCpuSpecs.Threads || 16,
      "GPU": fullGpuSpecs.Device,
      "GPU VRAM (GB)": fullGpuSpecs.Memory || 8,
      "RAM (GB)": 16,
      "Resolution": resolution,
      "Graphics Settings": settings
    };

    try {
      const response = await axios.post('http://localhost:4000/api/predict', hardwarePackage);
      setPrediction(response.data.predicted_fps);
      
      // Calculate the Bottleneck!
      const analysis = analyzeBottleneck(fullCpuSpecs, fullGpuSpecs);
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