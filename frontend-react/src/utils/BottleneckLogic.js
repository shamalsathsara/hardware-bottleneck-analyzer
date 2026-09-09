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
  
    if (absDiff === 0) {
      type      = null;
      color     = '#10b981';
      cardClass = 'has-bottleneck-ok';
      message   = 'Balanced Build: Your CPU and GPU work perfectly together — solid gaming setup.';
    } else if (absDiff === 1) {
      type      = diff > 0 ? 'gpu' : 'cpu';
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
  
    return { severity, percentage: severity, message, color, cardClass, type, classification };
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
  
export const getExplanation = (data, style) => {
    if (!data) return '';

    if (data.type === 'cpu') {
      if (style === 'technical') {
        return `The processor is operating at or near 100% utilization while the GPU still has available compute headroom. This CPU bottleneck scenario occurs because the processor cannot generate render commands fast enough to keep the GPU fully saturated.`;
      } else {
        return `Your computer's brain (the CPU) is working so hard that it's struggling to keep up with your graphics card. Imagine a chef cooking orders too slowly — the kitchen (GPU) is sitting idle waiting. This makes your games run slower than they should.`;
      }
    }

    if (data.type === 'gpu') {
      if (style === 'technical') {
        return `The GPU is operating at maximum utilization (close to 100% render load) while the CPU still has available processing headroom. This GPU bottleneck occurs because the graphics card cannot render frames fast enough to match the processor's output rate.`;
      } else {
        return `Your graphics card is working much harder than the rest of your computer. It's like a car engine running at full speed but the wheels can't keep up. This slows down your overall gaming performance, especially at higher resolutions.`;
      }
    }

    if (style === 'technical') {
      return `The CPU and GPU are operating with a balanced utilization ratio. Neither component is a significant limiting factor for the other, which means the system can sustain consistent frame delivery.`;
    } else {
      return `Great news! Your CPU and GPU are working well together as a team. Neither one is holding the other back. This means you get smooth, consistent gaming performance without any major weak links in your system.`;
    }
};

export const generateQA = (data) => {
    if (!data) {
      return [
        { q: 'What is a bottleneck?', a: 'A bottleneck happens when one component in your PC is much slower than the others, limiting overall performance.' },
        { q: 'How does Project Aura detect bottlenecks?', a: 'Project Aura uses a trained AI model to predict FPS and checks if your CPU and GPU power levels are balanced.' },
        { q: 'What should I do first?', a: 'Search for your CPU and GPU, select your game settings, and click "Run Analysis".' },
      ];
    }

    if (data.type === 'cpu') {
      return [
        { q: 'Why is my setup bottlenecked?', a: 'Your CPU is too slow to send enough render commands to keep your GPU busy. The GPU ends up waiting, which reduces your FPS.' },
        { q: 'Will upgrading the GPU improve my performance?', a: 'Not much — since the CPU is the bottleneck, a stronger GPU would still be limited by the slow processor.' },
        { q: 'What should I upgrade first?', a: 'Upgrade your CPU. Look for a modern processor with 6 or more cores.' },
      ];
    } else if (data.type === 'gpu') {
      return [
        { q: 'Why is my setup bottlenecked?', a: 'Your graphics card is maxed out and cannot draw frames as fast as your CPU is asking for them.' },
        { q: 'Is it bad to have a GPU bottleneck?', a: 'Not necessarily! In most gaming PCs, you want the GPU to be the limiting factor (working at 100%).' },
        { q: 'What should I upgrade first?', a: 'Upgrading your GPU will give you the most noticeable increase in framerate and allow higher graphics settings.' },
      ];
    }

    return [
      { q: 'What does a balanced build mean?', a: 'It means your CPU and GPU are perfectly matched for each other.' },
      { q: 'Do I need to upgrade?', a: 'Not right now! If you are happy with your FPS, your system is running optimally.' },
      { q: 'If I upgrade later, what should I change?', a: 'You will likely need to upgrade both the CPU and GPU at the same time to keep this balance.' },
    ];
};
