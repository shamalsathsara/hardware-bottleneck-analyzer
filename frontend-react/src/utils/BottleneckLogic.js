export const analyzeBottleneck = (cpu, gpu, maxStats) => {
    if (!cpu || !gpu) {
      return { 
        severity: 0, 
        percentage: 0,
        message: 'Please select both CPU and GPU to analyze bottleneck.', 
        color: '#10b981', 
        cardClass: 'has-bottleneck-ok', 
        type: null,
        classification: getBottleneckClassification(0, null)
      };
    }

    // Resolve CPU score or estimate from core count
    let cpuMark = 8000;
    if (typeof cpu.cpuMark === 'number' && Number.isFinite(cpu.cpuMark)) {
      cpuMark = cpu.cpuMark;
    } else if (typeof cpu.cpuMark === 'string') {
      cpuMark = parseInt(cpu.cpuMark, 10) || 8000;
    } else if (cpu.performance?.multiCoreScore) {
      cpuMark = cpu.performance.multiCoreScore;
    } else if (cpu.cores) {
      const cores = typeof cpu.cores === 'object' ? (cpu.cores.total || 6) : (parseInt(cpu.cores, 10) || 6);
      cpuMark = cores * 3000;
    }

    // Resolve GPU score or estimate from VRAM tier
    let gpuCUDA = 100000;
    if (typeof gpu.CUDA === 'number' && Number.isFinite(gpu.CUDA)) {
      gpuCUDA = gpu.CUDA;
    } else if (typeof gpu.CUDA === 'string') {
      gpuCUDA = parseInt(gpu.CUDA, 10) || 100000;
    } else if (gpu.performance?.rasterPerformanceScore) {
      gpuCUDA = gpu.performance.rasterPerformanceScore * 3000;
    } else if (gpu.memory?.vramGB) {
      const vram = gpu.memory.vramGB;
      if (vram >= 24) gpuCUDA = 350000;
      else if (vram >= 16) gpuCUDA = 220000;
      else if (vram >= 12) gpuCUDA = 140000;
      else if (vram >= 8) gpuCUDA = 80000;
      else gpuCUDA = 50000;
    }
  
    // Distinguish between G3DMark and CUDA baseline scales
    const isRawG3D = (maxStats?.maxGpuCuda || 400000) < 50000;
    const gpuAnchor = isRawG3D ? 40000 : 400000;
    const cpuAnchor = 60000;

    const cpuRatio = Math.max(0, cpuMark) / cpuAnchor;
    const gpuRatio = Math.max(0, gpuCUDA) / gpuAnchor;

    const cpuIndex = Math.min(Math.sqrt(cpuRatio) * 100, 100) || 1;
    const gpuIndex = Math.min(Math.sqrt(gpuRatio) * 100, 100) || 1;

    const cpuTier = Math.ceil(cpuIndex / 10);
    const gpuTier = Math.ceil(gpuIndex / 10);
  
    // Positive diff indicates CPU is ahead (GPU bottleneck)
    const diff = cpuTier - gpuTier;
    const absDiff = Math.abs(diff);
  
    const SEVERITY_TABLE = [0, 5, 15, 30, 50, 70, 85];
    const rawSeverity = SEVERITY_TABLE[Math.min(absDiff, 6)] || 0;
    const severity = Math.max(0, Math.min(100, Number.isFinite(rawSeverity) ? rawSeverity : 0));
  
    let message, color, cardClass, type;
    let lean = null; // which side is marginally weaker, even when the build counts as balanced
  
    if (absDiff === 0) {
      type      = null;
      color     = '#10b981';
      cardClass = 'has-bottleneck-ok';
      message   = 'Balanced Build: Your CPU and GPU work perfectly together — solid gaming setup.';
    } else if (absDiff === 1) {
      // One tier apart is within the balanced band (severity 5%): no bottleneck type.
      type      = null;
      lean      = diff > 0 ? 'gpu' : 'cpu';
      color     = '#10b981';
      cardClass = 'has-bottleneck-ok';
      message   = diff > 0
        ? 'Slightly GPU-limited: Your CPU is marginally ahead. Performance is still solid — a GPU upgrade would help at 1440p/4K.'
        : 'Slightly CPU-limited: Your GPU is marginally ahead. Performance is still solid — a CPU upgrade would help in CPU-heavy titles.';
    } else if (diff > 0) {
      type = 'gpu';
      if (absDiff >= 5) {
        color = '#ef4444'; cardClass = 'has-bottleneck-severe';
        message = 'Severe GPU Bottleneck: Your graphics card is severely holding back your processor. A GPU upgrade will give the biggest performance jump.';
      } else if (absDiff >= 3) {
        color = '#f59e0b'; cardClass = 'has-bottleneck-warning';
        message = 'GPU Bottleneck: Your graphics card is noticeably holding back your processor. Consider upgrading to a GPU with a higher compute score.';
      } else {
        color = '#f59e0b'; cardClass = 'has-bottleneck-warning';
        message = 'Mild GPU Bottleneck: Your CPU is a couple tiers ahead of your GPU. A GPU upgrade would give a clear FPS boost, especially at higher resolutions.';
      }
    } else {
      type = 'cpu';
      if (absDiff >= 5) {
        color = '#ef4444'; cardClass = 'has-bottleneck-severe';
        message = 'Severe CPU Bottleneck: Your processor is way too weak for this graphics card. It is severely holding your FPS back. Upgrade to a modern 6- or 8-core CPU.';
      } else if (absDiff >= 3) {
        color = '#f59e0b'; cardClass = 'has-bottleneck-warning';
        message = 'CPU Bottleneck: Your CPU is significantly limiting your GPU\'s potential. Upgrading your processor will give a noticeable FPS improvement.';
      } else {
        color = '#f59e0b'; cardClass = 'has-bottleneck-warning';
        message = 'Mild CPU Bottleneck: Your GPU is a couple tiers ahead of your CPU. A CPU upgrade would help unlock more performance in CPU-heavy games.';
      }
    }

    const classification = getBottleneckClassification(severity, type);
  
    return { severity, percentage: severity, message, color, cardClass, type, lean, classification };
  };

/**
 * Canonical Bottleneck Classification
 * Centralized severity and status mapping.
 *
 * 0–5%: Well Balanced
 * >5–10%: Minor Bottleneck
 * >10–20%: Mild Bottleneck
 * >20–35%: Moderate Bottleneck
 * >35%: Significant Bottleneck
 */
export const getBottleneckClassification = (severity, type) => {
  const numericSeverity = Number.isFinite(Number(severity)) ? Number(severity) : 0;
  const clampedSeverity = Math.max(0, Math.min(100, numericSeverity));

  if (clampedSeverity <= 5 || !type) {
    return {
      severity: clampedSeverity,
      title: 'Well Balanced',
      status: 'Well Balanced',
      level: 'balanced',
      color: '#4ade80',
      badgeColor: 'var(--green, #4ade80)',
      icon: '✓',
      shortExplanation: 'CPU and GPU are reasonably balanced. Your system operates with good component harmony.',
      type: null,
    };
  }

  const isCpu = type === 'cpu';
  const component = isCpu ? 'CPU' : 'GPU';

  if (clampedSeverity <= 10) {
    return {
      severity: clampedSeverity,
      title: `Minor ${component} Limit`,
      status: 'Minor Bottleneck',
      level: 'minor',
      color: '#4ade80',
      badgeColor: 'var(--green, #4ade80)',
      icon: '✓',
      shortExplanation: isCpu
        ? 'Your CPU is slightly limiting your GPU in CPU-heavy workloads.'
        : 'Your GPU is slightly limiting overall performance at higher resolutions.',
      type,
    };
  }

  if (clampedSeverity <= 20) {
    return {
      severity: clampedSeverity,
      title: `Mild ${component} Limit`,
      status: 'Mild Bottleneck',
      level: 'mild',
      color: '#f59e0b',
      badgeColor: 'var(--amber, #f59e0b)',
      icon: '⚠️',
      shortExplanation: isCpu
        ? 'CPU and GPU are reasonably balanced. Your CPU may slightly limit performance in CPU-heavy workloads.'
        : 'CPU and GPU are reasonably balanced. Your GPU may slightly limit performance at higher graphics settings.',
      type,
    };
  }

  if (clampedSeverity <= 35) {
    return {
      severity: clampedSeverity,
      title: `Moderate ${component} Bottleneck`,
      status: 'Moderate Bottleneck',
      level: 'moderate',
      color: '#f59e0b',
      badgeColor: 'var(--amber, #f59e0b)',
      icon: '⚠️',
      shortExplanation: isCpu
        ? 'Your CPU is noticeably restricting your GPU throughput.'
        : 'Your graphics card is running at full capacity and limiting framerates.',
      type,
    };
  }

  return {
    severity: clampedSeverity,
    title: `Significant ${component} Bottleneck`,
    status: 'Significant Bottleneck',
    level: 'significant',
    color: '#ef4444',
    badgeColor: 'var(--red, #ef4444)',
    icon: '⚠️',
    shortExplanation: isCpu
      ? 'Your processor is significantly holding back your graphics card potential.'
      : 'Your graphics card is severely underpowered compared to your processor.',
    type,
  };
};
