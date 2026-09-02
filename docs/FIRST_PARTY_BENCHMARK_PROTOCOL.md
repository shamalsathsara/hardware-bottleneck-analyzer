# Project Aura — First-Party Benchmark Capture & Ingestion Protocol
**Document Version:** 1.0.0  
**Status:** Approved Standard  
**Applicability:** First-Party Internal Performance Measurements (Model V2 Foundation)

---

## 1. Purpose & Core Philosophy

Project Aura's Model V2 requires **real, legally clean, verifiable, and reproducible** gaming performance observations.

```
Accuracy & Integrity > Dataset Size
```

Every benchmark observation ingested into Project Aura must represent an authentic physical measurement connecting:
1. **Game** (Canonical record & build version)
2. **CPU** (Hardware Master entry, clocking status)
3. **GPU** (Hardware Master entry, driver version)
4. **System Config** (RAM speed/channels, OS, ReBAR status)
5. **Game Settings** (Resolution, preset, RT, upscaling, frame generation)
6. **Measured Performance** (Avg FPS, 1% Low FPS, Frametimes)
7. **Provenance** (Capture tool, session ID, collection timestamp)

---

## 2. Pre-Test Preparation Protocol

To ensure repeatable and noise-free observations, follow this preparation checklist before recording any benchmark:

### A. Environment & Background Task Control
- Close all non-essential background applications (browsers, Discord, recording overlays, game launchers, sync clients).
- Disable automatic updates / antivirus background scans during the test session.
- Allow the physical system to reach thermal equilibrium (idle fan speeds and baseline temperatures).

### B. Hardware & System Configuration Audit
Record the exact specifications of the test rig:
- **Processor (CPU):** Exact model name (e.g. `AMD Ryzen 7 7800X3D` or `cpu_ryzen_7_7800x3d`), overclock/undervolt status.
- **Graphics Card (GPU):** Exact model name (e.g. `NVIDIA GeForce RTX 4070` or `gpu_rtx_4070`), driver version (e.g. `560.94`), overclock status.
- **System RAM:** Capacity (e.g. `32 GB`), Channels (`2` / Dual), Memory Type (`DDR5`), Rated Speed (`6000` MT/s).
- **Operating System:** Name and build version (e.g. `Windows 11 Pro 23H2`).
- **Motherboard / BIOS Features:** Resizable BAR (`true` / `false`).
- **Display Resolution:** Native render resolution (e.g. `1920x1080`, `2560x1440`, `3840x2160`).

---

## 3. Game Settings Documentation Standard

Never classify game settings with a single vague word like `"High"`. Every observation must explicitly define the render pipeline state:

| Parameter | Required Format / Values | Description |
| :--- | :--- | :--- |
| **`width` & `height`** | Integers (e.g. `1920`, `1080`) | Native output resolution |
| **`preset`** | `low`, `medium`, `high`, `ultra`, `custom` | Game graphics quality preset |
| **`renderScale`** | Float (e.g. `1.0` for 100% native) | In-game internal resolution scaling |
| **`rayTracingEnabled`** | `true` / `false` (Explicit boolean) | Ray tracing toggle state |
| **`rayTracingPreset`** | `off`, `low`, `medium`, `high`, `ultra` | Ray tracing sub-preset |
| **`pathTracing`** | `true` / `false` | Full path tracing / overdrive toggle |
| **`upscalingEnabled`** | `true` / `false` (Explicit boolean) | Temporal upscaling toggle |
| **`upscalingTechnology`** | `None`, `DLSS`, `FSR`, `XeSS`, `TSR` | Active upscaler technology |
| **`upscalingMode`** | `Quality`, `Balanced`, `Performance`, `Ultra Performance` | Upscaling profile |
| **`internalWidth`/`Height`** | Integers or `null` | Render resolution before upscaling |
| **`frameGenerationEnabled`**| `true` / `false` (Explicit boolean) | Optical multi-frame / frame gen toggle |
| **`frameGenerationTechnology`** | `None`, `DLSS 3`, `FSR 3` | Frame generation implementation |

> [!IMPORTANT]
> **Native Model V2 Training Rule:** Observations with `frameGenerationEnabled = true` or temporal upscalers are recorded for evaluation/product reference, but are strictly excluded from Native Model V2 Training datasets to preserve physical GPU rendering relationships.

---

## 4. Benchmark Methodology & Execution

### A. Scene Selection Hierarchy
Prioritize benchmark execution in the following order:
1. **Built-in Benchmark Utility (`builtin_benchmark`):** Preferred for deterministic camera path and repeatable load (e.g., Cyberpunk 2077 Benchmark, Shadow of the Tomb Raider Benchmark).
2. **Scripted / On-Rails Route (`scripted_run`):** Fixed travel route in open-world games without random combat variations.
3. **Controlled Gameplay Segment (`repeatable_gameplay`):** Fixed 60-second traversal route in identical in-game weather/time of day.

### B. Warm-Up Run
Before logging formal data:
- Run the benchmark scene once (1-2 minutes) to trigger shader compilation, load game assets into VRAM, and warm the GPU core.
- Discard the warm-up run from the final observation set.

### C. Repeated Runs (Sample Rigor)
- Execute **3 repeated runs** for each hardware and settings configuration.
- Store each run as an independent observation row with identical configuration and unique `sourceRecordId`.
- **Do NOT average repeated runs during capture or ingestion.** Project Aura Dataset V2 processing will compute statistical variance (mean, median, IQR, MAD).

---

## 5. Capture Tooling & Metrics Protocol

### A. Supported Tools
Use open, tool-neutral capture utilities:
- **CapFrameX** (PresentMon-backed)
- **PresentMon** (Intel)
- **NVIDIA FrameView**
- **Validated Built-in In-Game CSV Exporters**

### B. Metrics Hierarchy
- **`avgFps` (Required):** Exact measured average frames per second (Must be between 5 and 1200 FPS).
- **`onePercentLowFps` (Strongly Preferred):** 1st percentile FPS (99th percentile frametime converted to FPS).
- **`pointOnePercentLowFps` (Optional):** 0.1 percentile FPS.
- **`minFps` / `maxFps` / `medianFps` (Optional):** Observed minimum, maximum, and median FPS.
- **`avgFrameTimeMs` / `p99FrameTimeMs` (Optional):** Average and 99th percentile frametimes in milliseconds.

> [!CAUTION]
> **Zero Fabrication Rule:** If 1% low or frametime data is not recorded by the capture tool, leave the fields empty (`null`). **Never compute synthetic or estimated 1% lows from average FPS.**

---

## 6. Pilot Collection Plan (Phase 1)

To validate the end-to-end ingestion pipeline without burdening test operators:

| Parameter | Pilot Target |
| :--- | :--- |
| **Physical Test Rigs** | 1 available physical PC |
| **Games** | 2–3 legally owned titles with built-in benchmarks (e.g., *Cyberpunk 2077*, *Shadow of the Tomb Raider*, *Red Dead Redemption 2*) |
| **Resolutions** | 1 native resolution (e.g. 1080p or 1440p) |
| **Presets** | 2 presets per game (e.g. `Medium` and `Ultra`) |
| **Runs per Config** | 3 repeated runs per preset |
| **Expected Total** | **~12–18 authentic observations** |

---

## 7. Step-by-Step Operator Guide: From Capture to Ingestion

### Step 1: Open the Import Template
Copy the official template:
```bash
cp backend-node/data/benchmark-templates/project-aura-benchmark-template.csv my_first_benchmark.csv
```

### Step 2: Fill in Observed Values
Fill the CSV row with the actual recorded values from your physical run. Example row layout:
```csv
game,cpu,gpu,ramGB,ramChannels,ramType,ramSpeedMTs,width,height,preset,renderScale,rayTracingEnabled,rayTracingPreset,pathTracing,upscalingEnabled,upscalingTechnology,upscalingMode,internalWidth,internalHeight,frameGenerationEnabled,frameGenerationTechnology,avgFps,onePercentLowFps,pointOnePercentLowFps,minFps,maxFps,medianFps,avgFrameTimeMs,p99FrameTimeMs,sampleDurationSeconds,runCount,benchmarkScene,benchmarkType,operatingSystem,driverVersion,gameVersion,api,resizableBarEnabled,cpuOverclocked,gpuOverclocked,captureTool,captureToolVersion,sourceRecordId,sourceGroupId,benchmarkSessionId,collectedAt
Cyberpunk 2077,Core i5-12400F,GeForce RTX 3060,32,2,DDR4,3200,1920,1080,high,1.0,false,off,false,false,None,,,,,78.4,56.2,44.1,42.0,98.5,77.9,12.75,17.79,60,1,City Center,builtin_benchmark,Windows 11 Pro,560.94,2.13,DirectX 12,true,false,false,CapFrameX,1.7.2,run_01,pilot_batch_1,session_pilot_01,2026-09-02T12:00:00Z
```

### Step 3: Run Dry-Run Validation (0 Database Writes)
Validate your file against the master catalog, source policy, and eligibility gates:
```bash
npm run benchmarks:ingest -- --file my_first_benchmark.csv --dry-run
```
Review the console output:
- Ensure all rows are marked `Accepted`.
- If any row is rejected (e.g., `CPU_NOT_FOUND`, `MISSING_RT_STATE`), fix the CSV and re-run.

### Step 4: Execute Live Ingestion
Once dry-run reports 100% valid rows:
```bash
npm run benchmarks:ingest -- --file my_first_benchmark.csv
```
The CLI will generate immutable observation IDs, register fingerprints, and persist verified records into the `GameBenchmark` collection.
