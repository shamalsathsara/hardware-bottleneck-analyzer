# Project Aura V2: Game Benchmark Dataset Architecture & Validation Design

> **Document Version:** 2.1.3B  
> **Status:** Architecture & Audit Phase (Design Only — No Scraping, No Dataset Ingestion, No Retraining)  
> **Target Audience:** Engineering, ML Research, Data Architecture

---

## 1. Executive Summary & Purpose

Project Aura V2 is transitioning from a static hardware-ratio estimator into a global, game-aware PC gaming performance platform. To achieve this, **Model V2** and the upcoming **Can I Run It / Upgrade Advisor** engines must train on real, traceable, and legally compliant **Game Benchmark Observations**.

Every single benchmark observation in Project Aura connects seven fundamental dimensions:

$$\text{Observation} = \text{Game} + \text{CPU} + \text{GPU} + \text{System Config} + \text{Graphics Preset/Features} + \text{Measured Performance} + \text{Provenance}$$

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               Canonical Data Catalogs                                  │
│   • Game Catalog (IGDB ID, slug, title)                                                │
│   • Hardware Master (HardwareCpu, HardwareGpu, immutable hardwareId)                   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Raw Game Benchmark Observations                                 │
│                           Collection: game_benchmarks                                  │
│   • Identity: benchmarkId & observationFingerprint                                     │
│   • Display & Preset: Normalized Resolution (1080p, 1440p, 4K) & Graphics Presets      │
│   • Advanced Features: Ray Tracing (ON/OFF/tier), Upscaling (DLSS/FSR), Frame Gen      │
│   • Measured Performance: avgFps (Required), 1% Lows (Recommended), Frametimes         │
│   • Test Conditions: Built-in benchmark vs manual gameplay, duration, run count       │
│   • Quality & Provenance: Source URL/type, Licensing status, Provisional Quality score │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                      ┌─────────────────────┴─────────────────────┐
                      ▼                                           ▼
┌───────────────────────────────────────────┐   ┌────────────────────────────────────────┐
│        Dataset V2 Feature Builder         │   │       Public Benchmark Viewer API      │
│   • Strict Validation & Quality Gate      │   │   • Aggregated Game & Hardware FPS     │
│   • Target Leakage Elimination            │   │   • Display Performance Ranges         │
│   • Grouped Train/Val/Test Splitting      │   │   • Redistribution-Safe Summaries      │
└─────────────────────┬─────────────────────┘   └────────────────────────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────┐
│           Model V2 Training Matrix        │
│   • Game-Aware FPS Regression             │
│   • Generalization on Unseen Games & HW   │
└───────────────────────────────────────────┘
```

---

## 2. Audit of Current Project & Legacy V1 Dataset

### 2.1 Current Hardware & Game Schemas
- **`Game` Model (`models/Game.js`):** Contains canonical `slug`, `name`, `externalIds.igdb`, and `performanceProfile` (`supportedResolutions`, `graphicsPresets`, `rayTracingSupported`, `dlssSupported`). Provides an authoritative, unique game reference.
- **`HardwareCpu` & `HardwareGpu` Models:** Contain immutable `hardwareId` (e.g. `cpu_amd_ryzen_7_7800x3d_desktop`, `gpu_nvidia_geforce_rtx_4070_desktop`), physical specifications, and dual quality states.
- **Legacy Models (`CPU`, `GPU`):** Contain flat string records (`cpuName`, `cpuMark`, `Device`, `CUDA`) seeded from legacy CSVs.

### 2.2 Audit of `ai-python/FpsTest/fps_dataset.csv` (1,002 rows)
| Field in V1 CSV | Reliability Assessment | Verdict for Dataset V2 |
| :--- | :--- | :--- |
| `CPU` | Non-canonical strings (e.g., `Intel i7-12700F`, `Ryzen 9 5900X`) | **Reject** unless mapped to `HardwareCpu.hardwareId` |
| `CPU Cores`, `Threads`, `TDP` | Approximate integer values | **Replace** with verified physical specs from `HardwareCpu` |
| `GPU` | Non-canonical strings (e.g., `RTX 2070`, `RX 6800`) | **Reject** unless mapped to `HardwareGpu.hardwareId` |
| `GPU VRAM`, `Bandwidth`, `TDP` | Hardcoded integers | **Replace** with verified memory subsystem specs from `HardwareGpu` |
| `Total System TDP` | Derived arithmetic sum (`CPU TDP + GPU TDP`) | **Omit** (Redundant continuous feature) |
| `Bottleneck Score` | Pre-calculated synthetic ratio | **STRICTLY REJECT (Severe Target Leakage)** |
| `RAM (GB)` | Integer (8, 16, 32) | **Retain** as continuous system feature |
| `Resolution` | Flat strings (`1920x1080`, `2560x1440`, `3840x2160`) | **Normalize** into structured `{ width, height, label, pixelCount }` |
| `Graphics Settings` | Flat strings (`Low`, `Medium`, `High`, `Ultra`) | **Normalize** into structured preset schema |
| `Min FPS`, `Avg FPS`, `Max FPS` | Unanchored FPS targets without game context | **Reject** from Dataset V2 (No game identity) |

### 2.3 Critical Deficiencies in V1 Dataset
1. **Zero Game Identity:** V1 treats all gaming workloads as a single homogenous game.
2. **Zero Ray Tracing or Upscaling:** Cannot differentiate rasterization from RT or DLSS/FSR.
3. **Zero Provenance:** No timestamp, source URL, benchmark run count, or test condition tracking.
4. **Target Leakage:** Includes `Bottleneck Score` which was computed from the target performance metrics.

---

## 3. Detailed GameBenchmark Schema Design

Observations will be stored in a dedicated MongoDB collection: `game_benchmarks`.

```typescript
interface GameBenchmarkDocument {
  // Identity
  benchmarkId: string;                     // e.g. "bm_20260902_a8f9c1b2"
  observationFingerprint: string;          // SHA-256 hash for deduplication

  // Game Relationship
  gameId: mongoose.Types.ObjectId;         // Ref to canonical Game document
  gameSlug: string;                        // Canonical slug (e.g. "cyberpunk-2077")
  rawGameName: string;                     // Raw string from source for auditing

  // Hardware Relationship
  cpuHardwareId: string;                   // Immutable ID (e.g. "cpu_amd_ryzen_7_7800x3d_desktop")
  rawCpuString: string;                    // Raw source CPU string
  gpuHardwareId: string;                   // Immutable ID (e.g. "gpu_nvidia_geforce_rtx_4070_desktop")
  rawGpuString: string;                    // Raw source GPU string

  // System Configuration
  system: {
    ramGB: number;                         // e.g. 32
    ramChannels?: 'single' | 'dual' | 'quad';
    ramType?: 'DDR4' | 'DDR5' | 'LPDDR5' | 'Other';
    ramSpeedMTs?: number;                  // e.g. 6000
    operatingSystem?: string;              // e.g. "Windows 11 64-bit"
    driverVersion?: string;                // e.g. "GeForce Game Ready 551.86"
    gameVersion?: string;                  // e.g. "2.12"
    api?: 'DirectX 12' | 'DirectX 11' | 'Vulkan' | 'OpenGL' | 'Other';
    resizableBarEnabled?: boolean;         // ReBAR / Smart Access Memory
    cpuOverclocked?: boolean;
    gpuOverclocked?: boolean;
  };

  // Display & Graphics Configuration
  display: {
    width: number;                         // e.g. 2560
    height: number;                        // e.g. 1440
    label: string;                         // e.g. "1440p"
    pixelCount: number;                    // 3,686,400 (computed)
    aspectRatio: string;                   // "16:9", "21:9", "32:9"
  };

  graphics: {
    rawPreset: string;                     // e.g. "Ray Tracing: Overdrive", "Epic"
    normalizedPreset: 'low' | 'medium' | 'high' | 'ultra' | 'custom' | 'unknown';
    renderScale?: number;                  // 1.0 = 100% native
  };

  rayTracing: {
    enabled: boolean;
    preset?: 'off' | 'low' | 'medium' | 'high' | 'ultra' | 'overdrive' | 'custom';
    pathTracing?: boolean;
  };

  upscaling: {
    enabled: boolean;
    technology?: 'DLSS' | 'FSR' | 'XeSS' | 'None' | 'Other';
    mode?: 'UltraPerformance' | 'Performance' | 'Balanced' | 'Quality' | 'NativeAA' | 'Custom';
    internalResolution?: { width: number; height: number };
  };

  frameGeneration: {
    enabled: boolean;
    technology?: 'DLSS Frame Generation' | 'FSR Frame Generation' | 'Other' | 'None';
  };

  // Measured Performance Targets
  performance: {
    avgFps: number;                        // Primary target (Required)
    onePercentLowFps?: number;             // Recommended
    pointOnePercentLowFps?: number;        // Optional
    minFps?: number;
    maxFps?: number;
    medianFps?: number;
    frameTimeMs?: {
      avg?: number;
      p99?: number;
    };
  };

  // Test Methodology & Duration
  testConditions: {
    sampleDurationSeconds?: number;        // e.g. 120
    runCount?: number;                     // e.g. 3
    benchmarkScene?: string;               // e.g. "Night City Bar Benchmark", "In-Game Mission 1"
    benchmarkType: 'built_in_benchmark' | 'manual_gameplay' | 'repeatable_route' | 'unknown';
  };

  // Provenance & Licensing
  provenance: {
    sourceType: 'project_aura_test' | 'licensed_dataset' | 'official_benchmark_api' | 'publisher_data' | 'trusted_review' | 'community_submission' | 'legacy_dataset';
    sourceName: string;                    // e.g. "Internal QA / Partner / Creator"
    sourceUrl?: string;
    sourceRecordId?: string;               // External ID
    sourceGroupId?: string;                // Grouping ID to isolate test sessions across splits
    benchmarkSessionId?: string;
    collectedAt: Date;
    verifiedAt?: Date;
    ingestionMethod: 'manual_verification' | 'partner_api' | 'curated_batch';
  };

  licenseStatus: 'approved' | 'approved_with_conditions' | 'internal_only' | 'permission_required' | 'unknown';

  // Quality & Machine Learning Readiness
  quality: {
    grade: 'verified' | 'high' | 'medium' | 'low' | 'quarantined' | 'rejected';
    provisionalQualityScore: number;       // 0 - 100 provisional data quality score
    quarantineReason?: string;
  };

  trainingEligible: boolean;               // True ONLY if all mandatory gates pass
  evaluationEligible: boolean;
}
```

---

## 4. Field Classifications & Data Integrity Matrix

| Field | Classification | Justification & Impact |
| :--- | :---: | :--- |
| `benchmarkId`, `observationFingerprint` | **REQUIRED** | Mandatory for immutable referencing and deduplication. |
| `gameId`, `gameSlug` | **REQUIRED** | Cannot train a game-aware model without definitive game identity. |
| `cpuHardwareId`, `gpuHardwareId` | **REQUIRED** | Required to link physical architecture, caches, and memory subsystem. |
| `display.width`, `display.height`, `display.pixelCount` | **REQUIRED** | Exact render load calculation; separates standard 1440p from ultrawide 3440x1440. |
| `graphics.normalizedPreset` | **REQUIRED** | Standardizes visual workload across diverse engines. |
| `rayTracing.enabled` | **REQUIRED** | BVH traversal and ray intersection impose massive GPU load shifts. |
| `upscaling.enabled` | **REQUIRED** | Internal render resolution differs drastically from display resolution. |
| `frameGeneration.enabled` | **REQUIRED** | Interpolated frames must never mix silently with raw render framerates. |
| `performance.avgFps` | **REQUIRED** | Primary target variable for Model V2 regression. |
| `performance.onePercentLowFps` | **RECOMMENDED** | Captures frametime consistency and micro-stutters. |
| `system.ramGB` | **RECOMMENDED** | Critical for identifying RAM bottleneck thresholds (8GB vs 16GB vs 32GB). |
| `system.api` | **RECOMMENDED** | DX11 vs DX12 vs Vulkan alters CPU draw call bottlenecks. |
| `system.driverVersion`, `gameVersion` | **RECOMMENDED** | Significant optimization shifts occur across driver/patch lifecycles. |
| `provenance.sourceGroupId` | **RECOMMENDED** | Essential for clustered data splitting to avoid cross-split data leakage. |
| `system.ramSpeedMTs`, `ramChannels` | **OPTIONAL** | Sub-tier memory scaling (e.g. DDR5-6000 CL30 vs DDR5-4800). |
| `testConditions.sampleDurationSeconds` | **OPTIONAL** | Weights benchmark confidence. |
| `performance.pointOnePercentLowFps` | **OPTIONAL** | Rare metric outside specialized frametime capture. |
| `game_cpu_intensity`, `game_gpu_intensity` | **DEFERRED** | Must NOT be used as Model V2 inputs unless independently derived without FPS leakage. |
| `derived.gamingIndex`, `bottleneckScore` | **BANNED** | **Target leakage risk.** |

---

## 5. Normalization Architecture & Feature Models

### 5.1 Display & Resolution Normalization
Resolutions must never be stored as unconstrained text. The schema maps standard and ultrawide resolutions deterministically:

| Width | Height | Aspect Ratio | Standard Label | Pixel Count |
| :---: | :---: | :---: | :---: | :---: |
| 1280 | 720 | 16:9 | `720p` | 921,600 |
| 1920 | 1080 | 16:9 | `1080p` | 2,073,600 |
| 2560 | 1080 | 21:9 | `1080p Ultrawide` | 2,764,800 |
| 2560 | 1440 | 16:9 | `1440p` | 3,686,400 |
| 3440 | 1440 | 21:9 | `1440p Ultrawide` | 4,953,600 |
| 3840 | 2160 | 16:9 | `4K` | 8,294,400 |
| 5120 | 1440 | 32:9 | `Super Ultrawide` | 7,372,800 |

### 5.2 Graphics Preset Normalization
Games feature custom naming conventions (e.g., *Cyberpunk 2077* uses "Ray Tracing: Overdrive"; *Doom Eternal* uses "Ultra Nightmare").
- **`rawPreset`**: Preserves original source string exactly (e.g., `"Epic"`, `"Badass"`, `"Maximized"`).
- **`normalizedPreset`**: Maps systematically to `['low', 'medium', 'high', 'ultra', 'custom', 'unknown']`.
- If settings are custom or ambiguous, `normalizedPreset = 'custom'` to prevent fabricated uniformity.
- **Categorical Preservation:** Presets remain strictly categorical; ordinal numeric encoding (1–4) is deferred to ML preprocessing experiments.

### 5.3 Ray Tracing, Upscaling & Frame Generation Isolation
To preserve physical modeling integrity:
1. **Ray Tracing ON vs OFF:** Stored with explicit preset.
2. **Upscaling:** `upscaling.enabled: true` records `technology` (DLSS, FSR, XeSS) and `mode` (Quality, Balanced, Performance). Internal render pixel count is derived (e.g. 1440p DLSS Quality = 1707x960 internal).
3. **Frame Generation:** `frameGeneration.enabled: true` is strictly separated.
   - **No Fixed Multipliers:** Never synthesize Frame Generation FPS by multiplying native FPS.
   - **Modeling Path:** Model V2 predicts native rendered FPS. Frame Generation observations feed a separate future evaluation path.

---

## 6. Deduplication, Observation Fingerprints & Outlier Policy

### 6.1 Observation Fingerprint vs Immutable Benchmark ID
- **`benchmarkId`:** Unique identifier generated at ingestion (e.g., `bm_20260902_9f8e7d6c`).
- **`observationFingerprint`:** Deterministic SHA-256 hash computed over:
  $$\text{SHA256}(\text{gameSlug} + \text{cpuHardwareId} + \text{gpuHardwareId} + \text{width} + \text{height} + \text{normalizedPreset} + \text{rtEnabled} + \text{upscalingMode} + \text{fgEnabled} + \text{sourceRecordId})$$
- **Exact Duplicate vs Repeated Run:**
  - If a new record matches an existing fingerprint **AND** has the identical `sourceRecordId` and identical FPS: It is discarded as an **Exact Duplicate**.
  - If it shares the same hardware/game configuration but has distinct run timestamps or distinct run indices from the same session: It is marked as a **Repeated Measurement** and aggregated to calculate empirical variance.

### 6.2 Outlier Detection & Quarantine Policy
- **Robust Statistical Flagging:** Outliers are detected using Median Absolute Deviation (MAD), Interquartile Range (IQR), and cluster variance rather than simple naive standard deviation cuts.
- **Action on Flag:**
  1. **Do not delete:** The raw record is preserved for auditing.
  2. **Quarantine:** `quality.grade = 'quarantined'`, `trainingEligible = false`.
  3. **Reason Logged:** `quarantineReason: "FPS (240) deviates excessively from cluster median (83 FPS, MAD: 3.8)"`.

---

## 7. Quality Grading & Provisional Quality Score

### 7.1 Quality Grade Dimensions
1. **`verified`:** Direct manufacturer QA, verified internal test, or certified partner API with complete hardware, settings, and frametime metrics.
2. **`high`:** Trusted professional benchmark with complete driver, version, resolution, and preset specifications.
3. **`medium`:** Legitimate source with verified hardware and resolution, but optional fields (driver, RAM speed, 1% lows) omitted.
4. **`low`:** Uncontrolled community submission or partial settings metadata.
5. **`quarantined`:** Statistical outlier or conflicting metadata under review.
6. **`rejected`:** Ambiguous hardware/game mapping or unlicensed source.

### 7.2 Provisional Data-Quality Score
The provisional data quality score ($Q \in [0, 100]$) measures data completeness and source rigor. It is **NOT** a calibrated prediction confidence probability:

$$Q = 0.30 \cdot S_{\text{source}} + 0.30 \cdot S_{\text{identity}} + 0.20 \cdot S_{\text{settings}} + 0.10 \cdot S_{\text{methodology}} + 0.10 \cdot S_{\text{recency}}$$

- All component weights remain configurable and subject to empirical validation.
- User-facing prediction confidence is strictly **categorical** (`HIGH`, `MEDIUM`, `LOW`).

---

## 8. Training Eligibility Gate

An observation is marked `trainingEligible = true` **strictly when all of the following conditions are met**:
1. `gameId` links to a verified canonical `Game`.
2. `cpuHardwareId` links to a verified `HardwareCpu`.
3. `gpuHardwareId` links to a verified `HardwareGpu`.
4. `display.width` and `display.height` are valid positive integers.
5. `graphics.normalizedPreset` is non-null and not `'unknown'`.
6. `rayTracing.enabled` and `upscaling.enabled` are explicitly defined booleans.
7. `performance.avgFps` is a finite positive number ($5.0 \le \text{avgFps} \le 1200.0$).
8. `licenseStatus` is `'approved'` or `'approved_with_conditions'`.
9. `quality.grade` is `'verified'` or `'high'` ($Q \ge 75$).
10. `quality.quarantineReason` is empty.

---

## 9. Machine Learning Train / Validation / Test Splitting Strategy

A naive random train/test split causes **catastrophic data leakage**: benchmark runs of the same GPU and game from the same reviewer would appear in both training and test sets, artificially inflating validation accuracy while failing to generalize in production.

Model V2 evaluation mandates five distinct splitting protocols:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Model V2 Multi-Protocol Splitting Matrix                        │
├──────────────────────────┬─────────────────────────────────────────────────────────────┤
│ Split Protocol           │ What It Evaluates                                           │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 1. Grouped Source Split  │ Standard baseline: all observations from a single session   │
│    (sourceGroupId)       │ or review stay strictly inside one split.                   │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 2. Unseen Hardware       │ Generalization to unreleased or unobserved CPUs and GPUs    │
│    Holdout               │ (e.g. hold out RTX 4070 Ti SUPER or Ryzen 7 7700X entirely). │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 3. Unseen Game           │ Zero-shot performance estimation on newly released game     │
│    Holdout               │ titles absent from training data.                           │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 4. Configuration         │ Interpolation across unobserved CPU + GPU pairings.         │
│    Holdout (Pairwise)    │                                                             │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 5. Temporal Holdout      │ Train on historical observations ($\le 2023$), evaluate on   │
│                          │ recent drivers and game patches ($2024+$).                  │
└──────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 10. Model Evaluation Metrics & Error Bands

Model V2 performance will be evaluated against continuous regression metrics and player-centric error bands:

1. **Standard Regression Metrics:**
   - **MAE (Mean Absolute Error):** Average FPS error.
   - **RMSE (Root Mean Squared Error):** Penalizes extreme prediction outliers.
   - **$R^2$ Score:** Variance explained across resolution and hardware tiers.
   - **MAPE (Mean Absolute Percentage Error):** Relative error across low (30 FPS) vs high (240 FPS) targets.
   - **MedAE (Median Absolute Error):** Robust to heavy-tailed noise.
2. **Gaming-Specific Error Bands:**
   - **Within $\pm 5$ FPS:** Tight competitive esports threshold.
   - **Within $\pm 10$ FPS:** Playable target band for standard AAA titles.
   - **Within $\pm 15\%$:** Relative accuracy across high-refresh rates.

---

## 11. Legacy V1 Dataset Migration Strategy

The existing ~1,000-row `fps_dataset.csv` cannot be imported directly into Dataset V2 due to missing game identity and synthetic features.

Migration Strategy:
- **`rejected` (100% of V1 rows for Model V2 Training):** V1 dataset contains no game identity and includes synthetic `Bottleneck Score`. It is permanently restricted to Model V1 legacy runtime fallback.
- **Model V2 will train exclusively on Dataset V2 observations** adhering to the new `GameBenchmark` schema.

---

## 12. Database Index Recommendations

Recommended indexes for `game_benchmarks` collection:
```javascript
// Unique identity index
gameBenchmarksSchema.index({ benchmarkId: 1 }, { unique: true });

// Fingerprint index for deduplication
gameBenchmarksSchema.index({ observationFingerprint: 1 });

// Fast lookup by game and hardware
gameBenchmarksSchema.index({ gameSlug: 1, gpuHardwareId: 1, 'display.label': 1 });
gameBenchmarksSchema.index({ gameSlug: 1, cpuHardwareId: 1 });
gameBenchmarksSchema.index({ cpuHardwareId: 1, gpuHardwareId: 1 });

// Training dataset extraction index
gameBenchmarksSchema.index({ trainingEligible: 1, licenseStatus: 1 });

// Session grouping for data split isolation
gameBenchmarksSchema.index({ 'provenance.sourceGroupId': 1 });
```

---

## 13. Future API Surface Design (Internal & Public)

### 13.1 Public Benchmark Summaries (Redistribution-Safe Aggregates)
- `GET /api/benchmarks/game/:slug?resolution=1440p&preset=ultra`
  - Returns aggregated median and interquartile FPS ranges per GPU tier.
- `GET /api/benchmarks/compare?game=cyberpunk-2077&gpuA=rtx-4070&gpuB=rx-7800-xt`
  - Returns side-by-side empirical performance deltas.

### 13.2 Internal Training Access (Secured / Pipeline-Only)
- `GET /api/internal/datasets/v2/export?format=jsonl&splitProtocol=grouped`
  - Stream validated, training-eligible feature rows directly to the Python ML pipeline.
