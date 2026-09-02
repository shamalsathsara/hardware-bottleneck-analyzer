# Project Aura V2: Dataset V2 Schema & Feature Engineering Specification

> **Document Version:** 2.1.3B  
> **Status:** Architecture Design (Design Only — No Model V2 Training in this milestone)  
> **Component:** Dataset V2 Feature Pipeline & Model V2 Input Matrix

---

## 1. Pipeline Overview: From Raw Observation to Training Row

Dataset V2 transforms verified, training-eligible observations from the `game_benchmarks` collection into clean, strongly typed tabular training rows for Model V2.

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
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          Hardware Spec Join & Denormalization          │
│    • Fetch CPU physical specs from HardwareCpu         │
│    • Fetch GPU physical specs from HardwareGpu         │
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
│                Dataset V2 Feature Row                  │
│              Target Variable: avgFps                   │
└────────────────────────────────────────────────────────┘
```

---

## 2. Dataset V2 Input Feature Matrix

| Feature Group | Column Name | Type | Unit / Encoding | Description |
| :--- | :--- | :--- | :--- | :--- |
| **CPU Physical** | `cpu_cores_total` | Integer | Count | Total physical execution cores |
| | `cpu_threads` | Integer | Count | Total simultaneous logical threads |
| | `cpu_boost_clock_ghz` | Float | GHz | Maximum single-core boost clock speed |
| | `cpu_l3_cache_mb` | Float | MB | Total Level 3 Cache (crucial for gaming / X3D) |
| | `cpu_tdp_w` | Float | Watts | Default Thermal Design Power |
| **GPU Physical** | `gpu_vram_gb` | Float | GB | Total dedicated video memory |
| | `gpu_memory_bandwidth_gbs` | Float | GB/s | Theoretical VRAM bandwidth throughput |
| | `gpu_memory_bus_bits` | Integer | Bits | Memory bus width (e.g. 128, 192, 256, 384) |
| | `gpu_shader_units` | Integer | Count | Total shader ALU / CUDA / Stream processor cores |
| | `gpu_boost_clock_mhz` | Float | MHz | Advertised GPU boost clock |
| | `gpu_tgp_w` | Float | Watts | Total Graphics Power / Board power |
| **System** | `system_ram_gb` | Float | GB | Installed system memory capacity (e.g. 16, 32) |
| **Workload / Display**| `render_width` | Integer | Pixels | Horizontal pixel dimension (e.g. 1920, 2560, 3840) |
| | `render_height` | Integer | Pixels | Vertical pixel dimension (e.g. 1080, 1440, 2160) |
| | `pixel_count` | Integer | Pixels | Total render resolution pixel load ($\text{width} \times \text{height}$) |
| | `preset_category` | Categorical | String (`low`, `medium`, `high`, `ultra`, `custom`) | Standardized graphics preset |
| **Advanced Features** | `ray_tracing_enabled` | Binary | 0 or 1 | Ray tracing hardware pipeline active |
| | `ray_tracing_preset` | Categorical | String (`off`, `low`, `medium`, `high`, `ultra`, `overdrive`) | RT workload tier |
| | `upscaling_active` | Binary | 0 or 1 | DLSS / FSR / XeSS active |
| | `internal_pixel_count` | Integer | Pixels | Actual native pixels rendered before reconstruction |
| | `frame_gen_active` | Binary | 0 or 1 | Frame generation active (isolated from native target) |
| **Game Profile** | `game_release_year` | Integer | Year | Baseline game engine vintage |
| | `game_cpu_intensity` | DEFERRED | N/A | Deferred to prevent target FPS leakage |
| | `game_gpu_intensity` | DEFERRED | N/A | Deferred to prevent target FPS leakage |
| | `game_vram_intensity`| DEFERRED | N/A | Deferred to prevent target FPS leakage |
| **Target Variable** | `target_avg_fps` | Float | FPS | **Primary Ground Truth Label** (Measured native average FPS) |
| **Secondary Target** | `target_1pct_low_fps`| Float | FPS | **Optional Secondary Label** (Measured native 1% Low FPS) |

---

## 3. Strict Target Leakage Audit

To ensure the integrity of Model V2 predictions, every proposed feature must satisfy the **Strict Causality Rule**:
> *"No input feature may contain, derive from, or approximate the target FPS of the game being predicted."*

### Explicitly Prohibited Features in Dataset V2:
1. **`Bottleneck Score`:** Computed in V1 using relative FPS ratios. **BANNED.**
2. **`gamingIndex` / `performanceIndex`:** If derived from game framerates. **BANNED.**
3. **`game_cpu_intensity` / `game_gpu_intensity`:** If derived from benchmark FPS. **DEFERRED.**
4. **`User-Reported FPS`:** Uncontrolled self-reports without verified methodology. **BANNED.**
5. **`Synthetic CUDA Multipliers`:** Formulas such as $\text{G3DMark} \times 10$. **BANNED.**
6. **`Fixed Frame Generation Multipliers`:** E.g., $\text{Native FPS} \times 1.8$. **BANNED.**

---

## 4. Multi-Protocol Data Splitting Strategy

```
                                  Dataset V2
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
 1. Standard Grouped Split    2. Unseen Hardware Holdout   3. Unseen Game Holdout
 (Grouped by sourceGroupId)   (Hold out RTX 4070 / 7800X3D)(Hold out 15% Game Titles)
   Train: 70%                   Train: 75%                   Train: 75%
   Val:   15%                   Val:   10%                   Val:   10%
   Test:  15%                   Test:  15% (New HW)          Test:  15% (New Games)
```

1. **Protocol 1 (Grouped Source Split):**
   - Ensures observations from the same reviewer benchmark session do not leak across Train and Test sets.
2. **Protocol 2 (Unseen Hardware Holdout):**
   - Evaluates whether Model V2 accurately predicts FPS for newly released GPUs and CPUs using only their physical architecture specifications.
3. **Protocol 3 (Unseen Game Holdout):**
   - Evaluates whether Model V2 can generalize its predictions to new game titles based on resolution, preset, and game performance profile attributes.

---

## 5. Confidence-Aware User Interface Output

Future Model V2 outputs will communicate categorical uncertainty and accuracy bounds rather than misleading uncalibrated probability percentages:

| Condition | UI Output Mode | Example Display |
| :--- | :---: | :--- |
| **High Coverage:** Exact game + exact CPU + exact GPU observed in Dataset V2 | **Point Estimate + Tight Range** | **84 FPS** *(Expected: 80–88 FPS) — Confidence: HIGH* |
| **Interpolated HW:** Exact game observed, but CPU/GPU specs interpolated | **Expected Range** | **70–82 FPS** *(Median: 76 FPS) — Confidence: MEDIUM* |
| **New Game Title:** Game profile estimated from requirements/engine | **Performance Tier Band** | **60–75 FPS** *(Playable at 1440p High) — Confidence: LOW* |
