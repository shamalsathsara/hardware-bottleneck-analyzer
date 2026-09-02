# Project Aura V2: Modern Hardware Data Architecture & Master Schema Specification

> **Version:** 2.1.2A  
> **Status:** Architecture Design & Audit Specification  
> **Target Release:** V2.1.2B Hardware Master Implementation

---

## 1. Executive Summary & Audit Findings

Project Aura's bottleneck analysis and ML performance prediction rely fundamentally on accurate central processing unit (CPU) and graphics processing unit (GPU) hardware specifications and performance indices.

### 1.1 Current V1 Hardware Audit

| Component | Current Source Files | MongoDB Representation | Issues & Technical Debt |
| :--- | :--- | :--- | :--- |
| **CPU Catalog** | `backend-node/CPU/cpu_data1.csv` (PassMark)<br>`backend-node/CPU/cpu_data2.csv` (Cinebench) | `mongoose.model('CPU', new Schema({}, { strict: false }))` | • No schema validation or required fields.<br>• Inconsistent fields (`cpuName`, `cpuMark`, `cores`).<br>• No distinction between desktop, mobile, and server.<br>• No aliases or canonical naming normalization. |
| **GPU Catalog** | `backend-node/GPU/gpu_data1.csv` (PassMark)<br>`backend-node/GPU/gpu_data2.csv` (Geekbench) | `mongoose.model('GPU', new Schema({}, { strict: false }))` | • Conflated PassMark G3DMark and Geekbench CUDA via synthetic formula `CUDA = G3Dmark * 10`.<br>• Assigned "CUDA" scores to AMD and Intel GPUs.<br>• Inconsistent naming (`gpuName` vs `Device`).<br>• Duplicate records inserted during seeding. |
| **ML Model V1** | `ai-python/FpsTest/fps_dataset.csv` (1,002 rows) | 71 one-hot encoded features in `ai_columns.joblib` | • Hardcoded raw name one-hot dummies (e.g. `CPU_Intel i7-12700F`).<br>• Unseen hardware zeroes out all one-hot features, falling back entirely to basic continuous features (`Cores`, `TDP`, `VRAM`, `Bandwidth`).<br>• TDP is an unreliable proxy for generational efficiency. |

---

## 2. Hardware Identity & Canonical Identifier Design

To eliminate string-matching fragilities and decouple Project Aura from any single external provider, every hardware record is assigned a unique, immutable Project Aura identifier (`hardwareId`).

### 2.1 Hardware Identity Model

```
┌────────────────────────────────────────────────────────┐
│               Project Aura Hardware Identity           │
├────────────────────────────────────────────────────────┤
│ • hardwareId:      "cpu_intel_core_i5_12400f"          │
│ • manufacturer:    "Intel"                             │
│ • canonicalName:   "Intel Core i5-12400F"              │
│ • slug:            "intel-core-i5-12400f"              │
│ • marketSegment:   "desktop"                           │
│ • aliases:         ["i5-12400F", "i5 12400F", ...]     │
└────────────────────────────────────────────────────────┘
```

### 2.2 Rules for `hardwareId` & `slug`
1. **Format:** `cpu_<manufacturer>_<model>` or `gpu_<manufacturer>_<model>` in lowercase alphanumeric with underscores.
2. **Immutability:** Once assigned, `hardwareId` NEVER changes, even if external vendors rebrand or change naming.
3. **Variant Preservation:** Genuinely different hardware must have distinct IDs (e.g. `gpu_nvidia_geforce_rtx_4070_desktop`, `gpu_nvidia_geforce_rtx_4070_mobile`, `gpu_nvidia_geforce_rtx_4070_super_desktop`, `gpu_nvidia_geforce_rtx_4070_ti_desktop`).

---

## 3. CPU Master Schema Design (`HardwareCpu`)

```typescript
interface HardwareCpu {
  _id: ObjectId;
  hardwareId: string;               // Unique Aura ID: 'cpu_amd_ryzen_7_7800x3d'
  type: 'cpu';
  manufacturer: 'Intel' | 'AMD' | 'Apple' | 'Qualcomm' | 'Other';
  canonicalName: string;            // 'AMD Ryzen 7 7800X3D'
  slug: string;                     // 'amd-ryzen-7-7800x3d'
  aliases: string[];                // ['Ryzen 7 7800X3D', '7800X3D', 'AMD 7800X3D']

  // Classification
  family: string;                   // 'Ryzen 7' / 'Core i7' / 'Core Ultra 7'
  generation: string;               // 'Zen 4' / 'Raptor Lake' / 'Arrow Lake'
  architecture: string;             // 'Zen 4 (Raphael)'
  marketSegment: 'desktop' | 'mobile' | 'workstation' | 'server';
  releaseYear: number;              // 2023
  releaseDate?: Date;

  // Physical Specifications (Manufacturer Factual)
  cores: {
    total: number;                  // 8
    performanceCores?: number;      // 8
    efficiencyCores?: number;       // 0
  };
  threads: number;                  // 16
  clocks: {
    baseClockGHz: number;           // 4.2
    boostClockGHz: number;          // 5.0
  };
  cache: {
    l2CacheMB?: number;             // 8
    l3CacheMB: number;              // 96 (3D V-Cache)
  };
  power: {
    defaultTdpWatts: number;        // 120
    maxTurboPowerWatts?: number;    // 162
  };
  socket?: string;                  // 'AM5'

  // Performance Signals (Standardized Benchmarks)
  performance: {
    singleCoreScore?: number;       // Normalized Cinebench R23 / Geekbench single
    multiCoreScore?: number;        // Normalized Cinebench R23 / Geekbench multi
    gamingIndex?: number;           // Relative CPU gaming index (0-100)
  };

  // Feature Support
  features: {
    integratedGpu: boolean;
    pcieVersion?: string;           // '5.0'
    memorySupport?: string;         // 'DDR5-5200'
  };

  // Provenance & Quality
  dataQuality: 'verified' | 'partial' | 'unverified' | 'stale';
  provenance: {
    specSource: string;             // 'AMD Official Product Specifications'
    benchmarkSource?: string;       // 'Standardized Benchmarks 2024'
    lastVerifiedAt: Date;
    verifiedBy?: string;
  };
}
```

### CPU Field Classification Matrix

| Field | Classification | Rationale |
| :--- | :--- | :--- |
| `hardwareId`, `canonicalName`, `slug`, `manufacturer` | **REQUIRED** | Fundamental identity and database indexing. |
| `marketSegment` | **REQUIRED** | Crucial to avoid confusing mobile/laptop CPUs with desktop processors. |
| `cores.total`, `threads` | **REQUIRED** | Universal physical specification needed for baseline computation. |
| `clocks.baseClockGHz`, `clocks.boostClockGHz` | **REQUIRED** | Key physical spec from manufacturer. |
| `cache.l3CacheMB` | **RECOMMENDED** | Critical for gaming performance differentiation (e.g. X3D V-Cache). |
| `power.defaultTdpWatts` | **RECOMMENDED** | Standard baseline power spec. |
| `cores.performanceCores`, `cores.efficiencyCores` | **RECOMMENDED** | Essential for modern Intel hybrid architectures (12th–14th Gen, Core Ultra). |
| `performance.singleCoreScore`, `multiCoreScore` | **RECOMMENDED** | High-signal continuous features for ML Model V2. |
| `socket`, `pcieVersion`, `memorySupport` | **OPTIONAL** | Informational for hardware compatibility; not primary ML inputs. |
| `price` | **NOT RECOMMENDED** | Volatile market data; belongs in external pricing cache, not static master spec. |

---

## 4. GPU Master Schema Design (`HardwareGpu`)

```typescript
interface HardwareGpu {
  _id: ObjectId;
  hardwareId: string;               // Unique Aura ID: 'gpu_nvidia_geforce_rtx_4070_desktop'
  type: 'gpu';
  manufacturer: 'NVIDIA' | 'AMD' | 'Intel' | 'Other';
  canonicalName: string;            // 'NVIDIA GeForce RTX 4070'
  slug: string;                     // 'nvidia-geforce-rtx-4070-desktop'
  aliases: string[];                // ['RTX 4070', 'GeForce RTX 4070', 'Nvidia RTX 4070']

  // Classification
  family: string;                   // 'GeForce RTX 40' / 'Radeon RX 7000' / 'Arc Alchemist'
  generation: string;               // 'Ada Lovelace' / 'RDNA 3' / 'Alchemist'
  architecture: string;             // 'AD104'
  marketSegment: 'desktop' | 'laptop' | 'workstation';
  releaseYear: number;              // 2023
  releaseDate?: Date;

  // Memory Subsystem (Manufacturer Factual)
  memory: {
    vramGB: number;                 // 12
    memoryType: string;             // 'GDDR6X'
    memoryBusBits: number;          // 192
    memoryBandwidthGBs: number;     // 504.2
  };

  // Execution Hardware
  cores: {
    shaderUnits: number;            // 5888 (CUDA cores / Stream Processors / Execution Units)
    tensorCores?: number;           // 184
    rayTracingCores?: number;       // 46
  };
  clocks: {
    baseClockMHz?: number;          // 1920
    boostClockMHz: number;          // 2475
  };
  power: {
    defaultTgpWatts: number;        // 200 (Total Graphics Power)
    recommendedPsuWatts?: number;   // 650
  };

  // Performance Signals (Standardized Benchmarks)
  performance: {
    rasterPerformanceScore?: number; // Normalized 3DMark TimeSpy/Steel Nomad synthetic raster
    rayTracingScore?: number;        // Normalized 3DMark Port Royal / Speedway RT score
    computeScore?: number;           // OpenCL/Vulkan compute index
  };

  // Feature Support
  features: {
    rayTracingSupport: boolean;      // true
    hardwareUpscalingFamily: 'DLSS' | 'FSR' | 'XeSS' | 'None'; // 'DLSS'
    dlssGenerationSupport?: number;  // 3 (Frame Generation supported)
    directXVersion?: string;         // '12 Ultimate'
  };

  // Provenance & Quality
  dataQuality: 'verified' | 'partial' | 'unverified' | 'stale';
  provenance: {
    specSource: string;             // 'NVIDIA Official Product Specifications'
    benchmarkSource?: string;       // 'Standardized Benchmarks 2024'
    lastVerifiedAt: Date;
    verifiedBy?: string;
  };
}
```

### GPU Field Classification Matrix

| Field | Classification | Rationale |
| :--- | :--- | :--- |
| `hardwareId`, `canonicalName`, `slug`, `manufacturer` | **REQUIRED** | Fundamental identity and database indexing. |
| `marketSegment` | **REQUIRED** | Mobile/laptop GPUs have significantly lower TGPs and different die configurations. |
| `memory.vramGB`, `memory.memoryBandwidthGBs` | **REQUIRED** | Core physical bottleneck drivers for modern gaming at 1080p, 1440p, and 4K. |
| `power.defaultTgpWatts` | **REQUIRED** | Total Graphics Power baseline. |
| `clocks.boostClockMHz` | **REQUIRED** | Standard core clock specification. |
| `cores.shaderUnits` | **RECOMMENDED** | Raw execution width (normalized by architecture). |
| `performance.rasterPerformanceScore` | **RECOMMENDED** | Highest-signal continuous predictor for gaming framerates across resolutions. |
| `features.rayTracingSupport`, `features.hardwareUpscalingFamily` | **RECOMMENDED** | Directly aligns with Game schema `performanceProfile.rayTracingSupported` / `dlssSupported`. |
| `power.recommendedPsuWatts`, `directXVersion` | **OPTIONAL** | Helpful for user PC build checks; not primary ML features. |
| `synthetic "CUDA" formula` | **NOT RECOMMENDED** | **ELIMINATED.** Conflating PassMark with CUDA across vendors is inaccurate. |

---

## 5. Source Type Separation & Field Ownership Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. MANUFACTURER SPECIFICATIONS (Factual Specs)                              │
│    • Intel ARK / AMD Product Specs / NVIDIA Tech Specs                      │
│    • Fields: Cores, Threads, Base/Boost Clocks, VRAM, Bus Width, TGP/TDP   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. STANDARDIZED BENCHMARK SOURCES (Measured Performance)                    │
│    • Cinebench R23, Geekbench 6, 3DMark TimeSpy / Steel Nomad Raster        │
│    • Fields: singleCoreScore, multiCoreScore, rasterPerformanceScore        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. PROJECT AURA DERIVED VALUES (Calculated Transparently)                   │
│    • Memory Bandwidth = (Bus Width * Memory Effective Clock) / 8            │
│    • Bottleneck Severity Tier = f(CPU Score, GPU Score)                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Strict Field Ownership

| Master Field | Authorized Source Type | Disallowed Sources |
| :--- | :--- | :--- |
| `cores`, `threads`, `cache` | Manufacturer Tech Specs | User submissions, forum scrapes |
| `vramGB`, `memoryBandwidthGBs` | Manufacturer Tech Specs | User submissions, unverified retail tags |
| `baseClock`, `boostClock` | Manufacturer Tech Specs | Overclocked user profiles |
| `singleCoreScore`, `multiCoreScore` | Standardized Benchmarks | In-game FPS measurements |
| `rasterPerformanceScore` | Standardized Synthetic GPU Benchmarks | Single-game FPS averages |
| `bottleneckScore`, `performanceIndex` | Project Aura Derived Logic | Raw benchmark strings |

---

## 6. External Data Source Research & Evaluation

| Candidate Source | Hardware | Available Data | Access Type | Reuse / Commercial Rights | Assessment & Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Intel ARK (Product Specifications)** | Intel CPUs | Complete official specs (cores, clocks, cache, TDP, sockets). | Official Web / Search API | Public factual specs. Data reuse permitted for factual identification. | **RECOMMENDED** for Intel CPU factual specifications. |
| **AMD Official Product Specifications** | AMD CPUs & GPUs | Complete official specs (Zen architectures, RDNA compute units, V-Cache). | Official Web / Downloads | Public factual specs. | **RECOMMENDED** for AMD CPU & GPU factual specifications. |
| **NVIDIA Developer / Product Specs** | NVIDIA GPUs | Complete official specs (Ada/Ampere/Turing specs, CUDA cores, TGP). | Official Web / Specs | Public factual specs. | **RECOMMENDED** for NVIDIA GPU factual specifications. |
| **TechPowerUp GPU Database** | GPUs | Exhaustive historical and modern GPU architecture specs. | Web catalog | **LICENSING REVIEW REQUIRED.** Scrapes/bulk pulls without license violate ToS. | **USE ONLY FOR MANUAL CROSS-VERIFICATION**; do not scrape. |
| **Geekbench Open Benchmark Database** | CPUs & GPUs | Cross-platform single/multi-core and OpenCL/Vulkan compute scores. | Public result database | **LICENSING REVIEW REQUIRED** for commercial packaging. | **ACCEPTABLE AS STANDARDIZED REFERENCE** with attribution. |
| **UL / 3DMark Synthetic Indices** | GPUs | TimeSpy, Steel Nomad, Port Royal raster and RT indices. | Published benchmark rankings | **LICENSING REVIEW REQUIRED** for direct programmatic ingestion. | **RECOMMENDED** as external benchmark index standard. |

---

## 7. Normalization, Aliasing, and Variant Handling

### 7.1 Normalization Pipeline
Raw user input or CSV hardware names pass through deterministic normalization before database queries:

```
"  Nvidia GeForce RTX 4070 (12GB)  "
          │
          ▼  1. Clean Whitespace & Strip Vendor Redundancies
"NVIDIA GeForce RTX 4070"
          │
          ▼  2. Generate Search Key / Normalized Slug
"nvidia-geforce-rtx-4070-desktop"
          │
          ▼  3. Match via Alias Index
Hardware Record Found: [hardwareId: "gpu_nvidia_geforce_rtx_4070_desktop"]
```

### 7.2 Variant Preservation Rules
- **Desktop vs Laptop:** "RTX 4070 Laptop" MUST NOT resolve to "RTX 4070 Desktop". Laptops operate at 35W–140W TGPs vs 200W desktop TGPs and have different CUDA counts.
- **Product Suffixes:** Suffixes such as `Ti`, `SUPER`, `XT`, `XTX`, `GRE`, `X3D`, and `F` indicate distinct silicon or memory configurations and must never be stripped during normalization.

---

## 8. Dual Data Quality States & Provenance Model

To avoid conflating factual manufacturer specifications with benchmark performance scores, Project Aura decouples physical specification quality from benchmark score quality:

```typescript
interface HardwareQualityState {
  specQuality: 'verified' | 'partial' | 'unverified' | 'stale';
  performanceQuality: 'verified' | 'partial' | 'unavailable' | 'stale';
  mlReady: boolean; // True ONLY when specQuality === 'verified' AND performanceQuality === 'verified'
}
```

### 8.1 State Definitions

| Dimension | State | Definition | Requirements to Achieve |
| :--- | :--- | :--- | :--- |
| **`specQuality`** | `verified` | All physical specifications confirmed against official manufacturer data sheets. | Official manufacturer spec source documented + manual/automated verification date. |
| | `partial` | Basic physical specs verified (e.g. cores, VRAM); secondary specs (e.g. L2 cache, memory bus) pending. | Primary specs confirmed. |
| | `unverified` | Ingested from legacy dataset; pending verification against manufacturer specifications. | Default state for unreviewed imports. |
| | `stale` | Specifications require revision due to vendor silicon or naming revisions. | Flagged for review. |
| **`performanceQuality`** | `verified` | Standardized synthetic raster/single-core benchmark score recorded from verified testing. | Standardized benchmark source documented. |
| | `partial` | Benchmark score estimated from architectural sibling. | Estimated flag documented. |
| | `unavailable` | Hardware catalog listed, but benchmark score is not yet recorded. | Default for newly released hardware. |
| | `stale` | Benchmark score requires re-indexing due to major driver or microcode updates. | Flagged for re-benchmarking. |
| **`mlReady`** | `boolean` | Indicates whether this component is eligible for high-confidence Model V2 predictions. | Set to `true` strictly when `specQuality === 'verified'` AND `performanceQuality === 'verified'`. |

---

## 9. ML Model V2 Feature Engineering Strategy

### 9.1 Hardware Feature Classification for Model V2

| Feature Candidate | Classification | Rationale |
| :--- | :--- | :--- |
| **GPU Raster Performance Score** | **GOOD ML FEATURE** | Strongest single predictor of gaming framerates across different graphics engines. |
| **GPU VRAM (GB) & Bandwidth (GB/s)** | **GOOD ML FEATURE** | Primary drivers for resolution scaling (1080p → 1440p → 4K) and texture settings. |
| **CPU Single-Core Performance Score** | **GOOD ML FEATURE** | Direct driver of frame times and minimum/average FPS in draw-call heavy gaming scenes. |
| **CPU Multi-Core Performance Score** | **GOOD ML FEATURE** | Governs background streaming, physics, and modern multithreaded game engines. |
| **CPU L3 Cache (MB)** | **GOOD ML FEATURE** | Captures modern gaming-specific architecture advantages (e.g. AMD 3D V-Cache). |
| **Architecture / Release Year** | **POSSIBLE ML FEATURE** | Helps model generational IPC (instructions per cycle) improvements. |
| **CPU / GPU Physical TDP (Watts)** | **POSSIBLE ML FEATURE** | Weak proxy for power; should be secondary to benchmark/raster scores. |
| **Raw Hardware Categorical Names** | **AVOID** | **ELIMINATE AS PRIMARY FEATURES.** One-hot encoded hardware names fail on unseen hardware and cause high dimensionality. |
| **`gamingIndex`, `bottleneckScore`, `performanceIndex`** | **DEFERRED / DISALLOWED AS INPUTS** | **TARGET LEAKAGE RISK.** Derived output metrics or composite indices must NOT be fed into ML models predicting target framerates. |
| **Target Game FPS Observations as Features** | **AVOID (STRICT)** | **TARGET LEAKAGE RISK.** Model features must be independently measured from external synthetic/standardized workloads, never computed from target game FPS tests. |

---

## 10. Database Architecture & Index Design

### 10.1 Collection Recommendation: Separate `cpus` and `gpus` Collections

We recommend **separate `cpus` and `gpus` collections** over a single polymorphic `Hardware` collection for the following reasons:
1. **Schema Integrity:** CPU and GPU physical schemas share almost no fields (`cores/threads/l3Cache/singleCoreScore` vs `vram/bandwidth/shaderUnits/rasterScore`). Separate collections provide clean Mongoose schemas and strict validation.
2. **Query Performance:** User searches are strictly partitioned (selecting a CPU in frontend dropdown queries CPU collection; selecting a GPU queries GPU collection).
3. **Index Efficiency:** Indexes on CPU-specific fields (e.g. `l3CacheMB`) and GPU-specific fields (e.g. `vramGB`) remain compact and dedicated.

### 10.2 Proposed Indexes

```javascript
// CPUs Collection Indexes
cpuSchema.index({ hardwareId: 1 }, { unique: true });
cpuSchema.index({ slug: 1 }, { unique: true });
cpuSchema.index({ canonicalName: 1 });
cpuSchema.index({ aliases: 1 });
cpuSchema.index({ manufacturer: 1, marketSegment: 1 });
cpuSchema.index({ dataQuality: 1 });

// GPUs Collection Indexes
gpuSchema.index({ hardwareId: 1 }, { unique: true });
gpuSchema.index({ slug: 1 }, { unique: true });
gpuSchema.index({ canonicalName: 1 });
gpuSchema.index({ aliases: 1 });
gpuSchema.index({ manufacturer: 1, marketSegment: 1 });
gpuSchema.index({ dataQuality: 1 });
```

---

## 11. Proposed REST API Surface

```
# Hardware Search Endpoints (Bounded, Fast, Cached)
GET /api/hardware/cpus/search?q={query}&segment={desktop|mobile}&limit=20
GET /api/hardware/gpus/search?q={query}&segment={desktop|laptop}&limit=20

# Hardware Details by Slug
GET /api/hardware/cpus/:slug
GET /api/hardware/gpus/:slug

# Lightweight List for Preloading
GET /api/hardware/cpus/summary
GET /api/hardware/gpus/summary

# Hardware Statistics & Anchors (for frontend tier calculation)
GET /api/hardware/stats
```

---

## 12. Dataset V2 Relationship & V1 Migration Strategy

### 12.1 Dataset V2 Benchmark Schema Linking

In Dataset V2 and all future benchmark observations, rows will store **immutable `hardwareId` references** alongside raw source strings for auditing:

```json
{
  "gameId": "cyberpunk-2077",
  "cpuHardwareId": "cpu_amd_ryzen_7_7800x3d",
  "gpuHardwareId": "gpu_nvidia_geforce_rtx_4070_desktop",
  "rawCpuString": "AMD Ryzen 7 7800X3D 8-Core Processor",
  "rawGpuString": "NVIDIA GeForce RTX 4070 (12GB GDDR6X)",
  "resolution": "2560x1440",
  "qualityPreset": "High",
  "rayTracing": false,
  "avgFps": 84.5,
  "onePercentLowFps": 68.2,
  "verified": true,
  "source": "Project Aura Hardware Lab"
}
```

### 12.2 V1 Backward Compatibility & Migration
1. **Zero Breaking Changes:** Existing `/api/cpus/search` and `/api/gpus/search` routes will remain supported during V2.1.2, proxying to the new normalized collections with backwards-compatible response fields (`cpuName`, `Device`, `cpuMark`, `CUDA`).
2. **Old Dataset Preservation:** `fps_dataset.csv` and existing ML artifacts remain untouched until Dataset V2 and Model V2 are officially constructed in milestone V2.2.
