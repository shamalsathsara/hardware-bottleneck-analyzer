# Project Aura V2: Hardware Master Foundation Implementation Guide

> **Version:** 2.1.2B  
> **Status:** Implemented & Verified  
> **Component:** Hardware Master Architecture (`HardwareCpu`, `HardwareGpu`)

---

## 1. Executive Summary

Project Aura V2.1.2B establishes the production-grade **Hardware Master Foundation**. It implements strict, strongly-typed schemas for PC processors and graphics cards, deterministic normalization, alias collision protection, dual quality states, explicit provenance tracking, and bounded REST APIs while preserving 100% backward compatibility for existing V1 runtime endpoints and ML pipelines.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Verified Manufacturer Specifications                 │
│              (Intel ARK, AMD Product Sheets, NVIDIA Tech Specs)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Manual Verification / Seed JSON)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               Hardware Normalizer & Identity Engine                    │
│      (hardwareId Generator, Slugifier, Alias Engine, ML Gate)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              Hardware Master Collections (MongoDB Atlas)               │
│       • hardware_cpus (Strict HardwareCpu Mongoose Model)              │
│       • hardware_gpus (Strict HardwareGpu Mongoose Model)              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 Hardware Master REST API Layer                         │
│   • GET /api/hardware/cpus/search     • GET /api/hardware/cpus/:slug   │
│   • GET /api/hardware/gpus/search     • GET /api/hardware/gpus/:slug   │
│   • GET /api/hardware/cpus/summary    • GET /api/hardware/stats        │
│   • GET /api/hardware/gpus/summary                                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Models & Schema Architecture

### 2.1 CPU Master Model (`backend-node/models/HardwareCpu.js`)
- **Collection:** `hardware_cpus`
- **Unique Indexes:** `hardwareId` (e.g. `cpu_amd_ryzen_7_7800x3d_desktop`), `slug` (e.g. `amd-ryzen-7-7800x3d`)
- **Classification:** `family`, `generation`, `architecture`, `releaseYear`, `marketSegment` (`desktop | mobile | workstation | server`)
- **Physical Specifications:**
  - `cores.total`, `cores.performanceCores`, `cores.efficiencyCores`
  - `threads`
  - `clocks.baseClockGHz`, `clocks.boostClockGHz`
  - `cache.l2CacheMB`, `cache.l3CacheMB`
  - `power.defaultTdpWatts`, `power.maxTurboPowerWatts`
  - `socket`, `features.integratedGpu`, `features.pcieVersion`, `features.memorySupport`
- **Dual Quality State:**
  - `quality.specQuality`: `verified` | `partial` | `unverified` | `stale`
  - `quality.performanceQuality`: `verified` | `partial` | `unavailable` | `stale`
  - `quality.mlReady`: `boolean`

### 2.2 GPU Master Model (`backend-node/models/HardwareGpu.js`)
- **Collection:** `hardware_gpus`
- **Unique Indexes:** `hardwareId` (e.g. `gpu_nvidia_geforce_rtx_4070_desktop`), `slug` (e.g. `nvidia-geforce-rtx-4070`)
- **Classification:** `family`, `generation`, `architecture`, `releaseYear`, `marketSegment` (`desktop | laptop | workstation`)
- **Memory Subsystem:**
  - `memory.vramGB`, `memory.memoryType`, `memory.memoryBusBits`, `memory.memoryBandwidthGBs`
- **Execution Hardware & Clocks:**
  - `cores.shaderUnits`, `cores.tensorCores`, `cores.rayTracingCores`
  - `clocks.baseClockMHz`, `clocks.boostClockMHz`
  - `power.defaultTgpWatts`, `power.recommendedPsuWatts`
- **Feature Flags:**
  - `features.rayTracingSupport`, `features.hardwareUpscalingFamily` (`DLSS | FSR | XeSS | None`), `features.dlssGenerationSupport`, `features.directXVersion`
- **Dual Quality & Provenance:** Matches CPU master architecture.

---

## 3. Normalization, Identity & Alias Engine

Located in [`backend-node/services/hardware/hardwareNormalizer.js`](file:///i:/Projects/Hardware-Bottleneck-Analyzer/hardware-bottleneck-analyzer/backend-node/services/hardware/hardwareNormalizer.js):

### 3.1 Normalization Examples
| Raw User / CSV Input | Canonical Output |
| :--- | :--- |
| `i5 12400F` | `Intel Core i5-12400F` |
| `Intel i5-12400F` | `Intel Core i5-12400F` |
| `Intel Core i5 12400F` | `Intel Core i5-12400F` |
| `RTX 4070` | `NVIDIA GeForce RTX 4070` |
| `NVIDIA RTX 4070` | `NVIDIA GeForce RTX 4070` |
| `GeForce RTX 4070` | `NVIDIA GeForce RTX 4070` |
| `RX 7800 XT` | `AMD Radeon RX 7800 XT` |
| `Ryzen 7 7800X3D` | `AMD Ryzen 7 7800X3D` |

### 3.2 Suffix & Variant Preservation
The normalizer strictly preserves distinguishing silicon suffixes and prevents false mapping:
- `RTX 4070` $\neq$ `RTX 4070 Ti` $\neq$ `RTX 4070 SUPER`
- `Ryzen 7 7800X3D` $\neq$ `Ryzen 7 7700X`
- `RX 7800 XT` $\neq$ `RX 7900 XTX`
- `RTX 4070 Laptop` $\neq$ `RTX 4070 Desktop`

### 3.3 Alias Collision Detection
The `detectAliasCollisions(records)` audit utility scans generated aliases across distinct SKUs. If two distinct `hardwareId` records claim the same normalized alias string, a collision is flagged and rejected during pre-seeding.

---

## 4. ML Readiness Gate

The `isCpuMlReady(cpu)` and `isGpuMlReady(gpu)` functions enforce strict requirements:
1. `quality.specQuality === 'verified'`
2. `quality.performanceQuality === 'verified'`
3. All required continuous physical and performance fields are non-null, finite numbers.

For the MVP seed, performance benchmark scores are intentionally left `null` (`performanceQuality: 'unavailable'`). Thus, `quality.mlReady = false` for all MVP records, correctly reflecting that benchmark datasets have not yet been ingested.

---

## 5. Seed Execution & MVP Catalog

- **Seeder Script:** [`backend-node/scripts/seedHardwareMaster.js`](file:///i:/Projects/Hardware-Bottleneck-Analyzer/hardware-bottleneck-analyzer/backend-node/scripts/seedHardwareMaster.js)
- **Seed Datasets:**
  - [`backend-node/data/hardware/cpus.seed.json`](file:///i:/Projects/Hardware-Bottleneck-Analyzer/hardware-bottleneck-analyzer/backend-node/data/hardware/cpus.seed.json) (20 verified modern desktop CPUs)
  - [`backend-node/data/hardware/gpus.seed.json`](file:///i:/Projects/Hardware-Bottleneck-Analyzer/hardware-bottleneck-analyzer/backend-node/data/hardware/gpus.seed.json) (20 verified modern desktop GPUs)
- **Execution Commands:**
  ```bash
  # Dry run preview (audits validation and alias collisions)
  node scripts/seedHardwareMaster.js --dry-run

  # Live seed/upsert
  node scripts/seedHardwareMaster.js
  ```

---

## 6. Legacy Route Preservation & Policy on Synthetic CUDA

1. **Non-Destructive Coexistence:** The legacy `CPU` and `GPU` Mongoose models and the collections seeded from `CPU/` and `GPU/` CSV files remain completely intact.
2. **Zero Synthetic CUDA:** `HardwareGpu` strictly omits synthetic `CUDA = G3DMark * 10` formulas.
3. **Legacy Stats Route:** `GET /api/hardware/stats` returns both legacy scaling anchors (`maxCpuMark`, `maxGpuCuda`) and new hardware master counts (`cpus`, `gpus`).

---

## 7. Automated Test Suite

Test suite located in [`backend-node/tests/hardwareMaster.test.js`](file:///i:/Projects/Hardware-Bottleneck-Analyzer/hardware-bottleneck-analyzer/backend-node/tests/hardwareMaster.test.js):
- 19 automated tests covering schema validation, numeric bounds, identity uniqueness, normalization, alias collision detection, dual quality states, ML readiness, zero synthetic CUDA verification, and REST endpoints.
