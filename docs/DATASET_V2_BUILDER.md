# Project Aura V2 — Dataset V2 Builder Foundation

> **Document Version:** 2.1.3E  
> **Status:** Production-Ready Pipeline Foundation (Data Pipeline Only — No Model V2 Training)  
> **Component:** `backend-node/services/datasetV2/` & `backend-node/scripts/buildDatasetV2.js`

---

## 1. Overview & Architectural Role

The **Dataset V2 Builder** is an offline/internal data engineering pipeline that transforms verified, license-compliant, training-eligible observations from the `game_benchmarks` MongoDB collection into clean, strongly typed, machine-learning-ready tabular training sets.

```
┌────────────────────────────────────────────────────────┐
│             Raw GameBenchmark Document                 │
│         (gameSlug, cpuHardwareId, gpuHardwareId, ...)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│            Validation & Quality Gatekeeper             │
│    • trainingEligible == true                          │
│    • licenseStatus in ['approved', 'approved_w_cond']  │
│    • quality.grade in ['verified', 'high']             │
│    • frameGeneration.enabled == false                  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          Hardware Spec Join & Denormalization          │
│    • Fetch CPU physical specs from HardwareCpu         │
│    • Fetch GPU physical specs from HardwareGpu         │
│    • Fetch Game metadata from Game                     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│              Feature Builder & Scaling                 │
│    • Encode Visual Load (Pixels, Presets, RT, DLSS)    │
│    • Remove Target-Leakage Signals                     │
│    • Isolate Native FPS from Frame Generation          │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         Multi-Protocol Group-Aware Split               │
│    • Protocol 1: Grouped Source (sourceGroupId)        │
│    • Protocol 2: Unseen Hardware Holdout (CPU/GPU)     │
│    • Protocol 3: Unseen Game Holdout (gameSlug)        │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             Dataset V2 Export & Build Report           │
│    • CSV Export to data/generated/dataset-v2/          │
│    • JSON Build & Coverage Report                      │
└────────────────────────────────────────────────────────┘
```

---

## 2. Hard Boundaries & Critical Status Distinction

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Dataset V2 Builder Ready  ≠  Dataset V2 Has Enough Data  ≠  Model V2 Ready │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **Dataset V2 Builder Foundation Ready:** The extraction, validation, join, leakage auditing, splitting, and export code is complete, tested, and production-safe.
2. **Dataset V2 Data Adequacy:** The benchmark collection currently contains 0 real benchmark observations. The pipeline correctly handles empty and tiny collections without fabricating synthetic data.
3. **Model V2 Training:** **BLOCKED.** Model V2 must not be trained until sufficient real-world hardware, game, and visual settings coverage is collected through approved ingestion protocols.
4. **Model V1 Runtime Invariance:** Model V1 production inference and preprocessing remain 100% untouched and operational.

---

## 3. Training Row Source Filter & Eligibility Policy

Dataset V2 training rows originate **only** from observations passing strict multi-gate criteria:

| Gate | Policy | Allowed Values |
| :--- | :--- | :--- |
| **Training Eligibility Flag** | `trainingEligible` | Must be strictly `true` |
| **Source License Status** | `licenseStatus` | `approved`, `approved_with_conditions` |
| **Observation Quality Grade**| `quality.grade` | `verified`, `high` (`medium`, `low`, `rejected` excluded) |
| **Quarantine State** | `quality.quarantineReason` | Must be `null` / empty |
| **Frame Generation Gate** | `frameGeneration.enabled` | Must be `false` (native FPS target only) |

---

## 4. Hardware Master Join Specification

For every accepted benchmark observation, foreign keys are resolved against canonical Master collections:
- `cpuHardwareId` $\rightarrow$ `HardwareCpu`
- `gpuHardwareId` $\rightarrow$ `HardwareGpu`
- `gameSlug` $\rightarrow$ `Game`

Raw strings (`rawCpuString`, `rawGpuString`, `rawGameName`) are provenance/audit metadata only and are **never** used to infer physical machine-learning features.

If any canonical record cannot be resolved, the observation is rejected with structured error codes (`CPU_NOT_FOUND`, `GPU_NOT_FOUND`, `GAME_NOT_FOUND`).

---

## 5. Feature Manifest (Schema Version 2.0)

| Category | Column Name | Type | Unit | Required | Allowed / Bounds | Description |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **CPU Physical** | `cpu_cores_total` | Integer | Count | Yes | $1 \le \text{val} \le 256$ | Physical CPU cores |
| | `cpu_threads` | Integer | Count | Yes | $1 \le \text{val} \le 512$ | Logical CPU threads |
| | `cpu_boost_clock_ghz` | Float | GHz | Yes | $0.5 \le \text{val} \le 10.0$ | Single-core boost clock |
| | `cpu_l3_cache_mb` | Float | MB | Yes | $0 \le \text{val} \le 2048$ | Total Level 3 cache |
| | `cpu_tdp_w` | Float | Watts | Yes | $5 \le \text{val} \le 1000$ | Default Thermal Design Power |
| **GPU Physical** | `gpu_vram_gb` | Float | GB | Yes | $1 \le \text{val} \le 128$ | Dedicated VRAM capacity |
| | `gpu_memory_bandwidth_gbs` | Float | GB/s | Yes | $10 \le \text{val} \le 5000$ | Memory bandwidth throughput |
| | `gpu_memory_bus_bits` | Integer | Bits | Yes | $32 \le \text{val} \le 8192$ | Memory bus interface width |
| | `gpu_shader_units` | Integer | Count | Yes | $64 \le \text{val} \le 65536$| Total shader ALU / CUDA cores |
| | `gpu_boost_clock_mhz` | Float | MHz | Yes | $100 \le \text{val} \le 5000$ | Advertised boost clock |
| | `gpu_tgp_w` | Float | Watts | Yes | $10 \le \text{val} \le 1500$ | Total Graphics Power |
| **System** | `system_ram_gb` | Float | GB | Yes | $1 \le \text{val} \le 512$ | Installed system memory capacity |
| **Display** | `render_width` | Integer | Pixels | Yes | $640 \le \text{val} \le 15360$| Output horizontal resolution |
| | `render_height` | Integer | Pixels | Yes | $480 \le \text{val} \le 8640$ | Output vertical resolution |
| | `pixel_count` | Integer | Pixels | Yes | $\text{width} \times \text{height}$ | Server-computed total pixel load |
| **Workload** | `preset_encoded` | Integer | Ordinal | Yes | `1` (Low), `2` (Med), `3` (High), `4` (Ultra) | Standard graphics preset |
| | `ray_tracing_enabled` | Binary | Flag | Yes | `0` (Off), `1` (On) | Ray tracing active flag |
| | `upscaling_active` | Binary | Flag | Yes | `0` (Off), `1` (On) | Upscaling active flag |
| | `internal_pixel_count`| Integer | Pixels | Yes | Native or internal width $\times$ height | Pre-reconstruction pixel load |
| | `frame_gen_active` | Binary | Flag | Yes | `0` (Native only) | Frame generation active flag |
| **Game** | `game_release_year` | Integer | Year | No | $1980 \le \text{val} \le 2050$| Game engine vintage |

---

## 6. Target Variables

| Target Name | Type | Unit | Required | Bounds | Source |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `target_avg_fps` | Float | FPS | **Yes** | $5.0 \le \text{val} \le 1200.0$ | `GameBenchmark.performance.avgFps` |
| `target_1pct_low_fps` | Float | FPS | No | $0.0 \le \text{val} \le 1200.0$ | `GameBenchmark.performance.onePercentLowFps` |

**Target Rules:**
- `target_avg_fps` must be real measured ground truth.
- `target_1pct_low_fps` is populated **only** when physically recorded during benchmark capture. It is never fabricated using fixed multiplier rules (such as $0.8 \times \text{avgFps}$).

---

## 7. Strict Target Leakage Protection

The validator enforces a zero-tolerance filter against target-correlated signals:
- `bottleneckScore` / `bottleneckPercentage`: **BANNED**
- `gamingIndex` / `performanceIndex`: **BANNED**
- `predictedFps` / `estimatedFps`: **BANNED**
- `modelV1Output`: **BANNED**
- `synthetic_cuda`: **BANNED**
- `fixed_fg_multiplier`: **BANNED**

Any row containing a prohibited feature key is rejected with `TARGET_LEAKAGE_DETECTED`.

---

## 8. Missing Feature Policy

- Missing physical specifications are **never** silently imputed with zeros or arbitrary averages in this milestone.
- If an observation references hardware lacking required physical specifications, the row is excluded from the training export with `MISSING_REQUIRED_FEATURE` and the exact missing attribute names are recorded in the build report.

---

## 9. Non-Feature Audit Columns

Audit metadata is isolated from ML feature inputs:
- `benchmarkId`
- `observationFingerprint`
- `gameSlug`
- `cpuHardwareId`
- `gpuHardwareId`
- `sourceGroupId`
- `benchmarkSessionId`
- `collectedAt`

---

## 10. Multi-Protocol Data Splitting Strategy

Split calculations are deterministic via a configurable PRNG seed (default `42`).

### Supported Protocols:
1. **Protocol 1 (Grouped Source Split):**
   - Groups observations by `sourceGroupId` / `benchmarkSessionId`.
   - Prevents observations from the same reviewer test session from leaking between Train (70%), Val (15%), and Test (15%).
2. **Protocol 2 (Unseen Hardware Holdout):**
   - Isolates designated or deterministically selected CPU / GPU hardware IDs exclusively into the Test set to measure architectural generalization.
3. **Protocol 3 (Unseen Game Holdout):**
   - Isolates designated or deterministically selected game titles into the Test set to measure transferability to unobserved titles.

---

## 11. CLI Execution & npm Scripts

### Build Script:
```bash
# Dry run validation (0 files written)
npm run dataset:v2:build -- --dry-run

# Live build and export with custom seed and protocol
npm run dataset:v2:build -- --protocol grouped_source --seed 42

# Command-line direct invocation
node scripts/buildDatasetV2.js --dry-run
```

### Supported CLI Flags:
- `--dry-run`: Validate pipeline in-memory without creating filesystem artifacts.
- `--output <dir>`: Custom export directory (default: `backend-node/data/generated/dataset-v2/`).
- `--limit <n>`: Maximum observations to process.
- `--protocol <name>`: `grouped_source` (default), `unseen_hardware`, `unseen_game`.
- `--seed <n>`: Deterministic PRNG seed (default: `42`).

---

## 12. Build Artifacts & Output Format

When eligible observations exist, exports are written to `backend-node/data/generated/dataset-v2/`:
- `dataset_v2_<timestamp>.csv`: Complete tabular training dataset.
- `dataset_v2_<timestamp>_build_report.json`: Machine-readable build and coverage report.

On an empty database ($n=0$):
- Status: `INSUFFICIENT_REAL_DATA`
- Exported training rows: 0
- No fake rows are generated.
- Model V2 training remains blocked.
