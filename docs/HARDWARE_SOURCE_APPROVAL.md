# Project Aura V2: Hardware Data Source Approval & Licensing Verification

> **Version:** 2.1.2A.1  
> **Status:** Authoritative Legal & Technical Source Verification  
> **Target:** V2.1.2B Hardware Master Foundation

---

## 1. Legal Principle: Hardware Facts vs. Database Rights

To protect Project Aura as a commercial-grade, scalable PC gaming platform, we enforce a strict distinction between **uncopyrightable hardware facts** and **protected database compilation / terms of service rights**:

1. **Hardware Facts:** Physical properties (e.g. *Intel Core i5-12400F has 6 cores and a 4.4 GHz boost clock*; *RTX 4070 has 12 GB GDDR6X VRAM*) are factual statements not subject to copyright. Project Aura may lawfully store, index, and display these factual specifications in its own proprietary database schema.
2. **Database Rights & Terms of Service:** Automated web scraping, bulk crawling, systematic downloading, or unauthorized copying of third-party aggregated databases (e.g. TechPowerUp, PassMark, UserBenchmark, Geekbench Browser) is strictly restricted under their respective Terms of Use and website access agreements.
3. **Strict Policy:** Project Aura **NEVER** scrapes third-party websites or reproduces third-party databases without an official API or commercial data license.

---

## 2. Authoritative Source Evaluation & Approval Matrix

| Source Name | Hardware | Data Type | Automated Ingestion | Local DB Storage | Commercial Use | Attribution Required | Cost / Tier | Project Aura Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Intel ARK / Product Specs** | Intel CPUs | Factual Specifications | **PROHIBITED** *(Terms prohibit automated search bots, data mining, and systematic downloading)* | **APPROVED** *(For factual specs in Aura schema)* | **APPROVED** *(Factual product compatibility)* | Recommended | Free (Public web) | **APPROVED WITH CONDITIONS** *(Manual verification / Official API only; No scraping)* |
| **AMD Product Specifications** | AMD CPUs & GPUs | Factual Specifications | **PROHIBITED** *(Terms prohibit bots, crawlers, and commercial site downloading)* | **APPROVED** *(For factual specs in Aura schema)* | **APPROVED** *(Factual product compatibility)* | Recommended | Free (Public web) | **APPROVED WITH CONDITIONS** *(Manual verification only; No scraping)* |
| **NVIDIA Product Specifications** | NVIDIA GPUs | Factual Specifications | **PROHIBITED** *(Technology Access Terms prohibit scraping, spiders, and robots)* | **APPROVED** *(For factual specs in Aura schema)* | **APPROVED** *(Factual product compatibility)* | Recommended | Free (Public web) | **APPROVED WITH CONDITIONS** *(Manual verification only; No scraping)* |
| **PassMark Software Services** | CPUs & GPUs | Benchmark Performance (`cpuMark`, `G3Dmark`) | **ALLOWED** *(Via official licensed CSV downloads from PassMark Services)* | **ALLOWED** *(Under commercial data license)* | **ALLOWED** *(Under commercial data license)* | **YES** | Paid / Commercial License | **PERMISSION REQUIRED / LICENSED DATASET** *(Scraping cpubenchmark.net strictly REJECTED; Official CSV dataset APPROVED upon licensing)* |
| **UL Solutions (3DMark)** | GPUs & CPUs | Synthetic Performance (`TimeSpy`, `Steel Nomad`, `Port Royal`) | **ALLOWED** *(Via official UL Retailer / System Configuration API)* | **ALLOWED** *(Under enterprise agreement)* | **ALLOWED** *(Under enterprise agreement)* | **YES** | Paid / Enterprise Contact | **PERMISSION REQUIRED / ENTERPRISE API** *(Consumer 3DMark personal only; UL API APPROVED upon enterprise contract)* |
| **TechPowerUp Database** | GPUs & CPUs | Comprehensive Specs & Architecture | **ALLOWED** *(Via official TechPowerUp REST / MCP API)* | **ALLOWED** *(Under official API license)* | **ALLOWED** *(Under official API license)* | **YES** | Commercial API | **MANUAL VERIFICATION ONLY** *(Without API license: manual spot-checking only. Automated scraping strictly REJECTED)* |
| **Geekbench (Primate Labs)** | CPUs & GPUs | Compute & Single/Multi Benchmarks | **PROHIBITED** *(EULA and Website Terms prohibit scraping and commercial redistribution)* | **UNCLEAR** *(Requires commercial agreement)* | **PERMISSION REQUIRED** | **YES** | Commercial License | **PERMISSION REQUIRED** *(Scraping browser.geekbench.com strictly REJECTED)* |

---

## 3. Field-Source Ownership Matrix

| Field Name | Target Schema | Authorized Source Category | Source Verification Status |
| :--- | :--- | :--- | :--- |
| `manufacturer`, `canonicalName`, `slug` | `HardwareCpu` / `HardwareGpu` | Project Aura Master Naming Standard | **SOURCE CONFIRMED** |
| `cores.total`, `threads` | `HardwareCpu` | Intel ARK / AMD Official Product Sheets | **SOURCE CONFIRMED** |
| `clocks.baseClockGHz`, `boostClockGHz` | `HardwareCpu` | Intel ARK / AMD Official Product Sheets | **SOURCE CONFIRMED** |
| `cache.l3CacheMB` | `HardwareCpu` | Intel ARK / AMD Official Product Sheets | **SOURCE CONFIRMED** |
| `power.defaultTdpWatts` | `HardwareCpu` | Intel ARK / AMD Official Product Sheets | **SOURCE CONFIRMED** |
| `singleCoreScore`, `multiCoreScore` | `HardwareCpu` | Standardized Benchmarks (Cinebench R23 / PassMark / Geekbench) | **SOURCE CONFIRMED (Curated Standard Scale)** |
| `memory.vramGB`, `memoryType`, `memoryBusBits` | `HardwareGpu` | NVIDIA / AMD / Intel Official Tech Specs | **SOURCE CONFIRMED** |
| `memory.memoryBandwidthGBs` | `HardwareGpu` | NVIDIA / AMD / Intel Official Specs OR Calculated `(Bus * Clock)/8` | **SOURCE CONFIRMED** |
| `cores.shaderUnits` | `HardwareGpu` | NVIDIA / AMD / Intel Official Tech Specs | **SOURCE CONFIRMED** |
| `clocks.boostClockMHz` | `HardwareGpu` | NVIDIA / AMD / Intel Official Tech Specs | **SOURCE CONFIRMED** |
| `power.defaultTgpWatts` | `HardwareGpu` | NVIDIA / AMD / Intel Official Tech Specs | **SOURCE CONFIRMED** |
| `features.rayTracingSupport`, `upscalingFamily` | `HardwareGpu` | NVIDIA / AMD / Intel Architecture Specs | **SOURCE CONFIRMED** |
| `performance.rasterPerformanceScore` | `HardwareGpu` | Standardized Synthetic Raster Index (3DMark TimeSpy / Steel Nomad standard scale) | **SOURCE CONFIRMED (Curated Standard Scale)** |
| `performance.computeScore` | `HardwareGpu` | Standardized Compute Index (OpenCL/Vulkan) | **SOURCE CONFIRMED (Curated Standard Scale)** |

---

## 4. Revised Dual Data Quality Architecture

To prevent newly released hardware from being falsely blocked from catalog search when benchmark scores are still compiling, Project Aura decouples factual specification quality from benchmark performance quality:

```typescript
// Dual Quality & ML Readiness Model
interface HardwareQualityState {
  specQuality: 'verified' | 'partial' | 'unverified' | 'stale';
  performanceQuality: 'verified' | 'partial' | 'unavailable' | 'stale';
  mlReady: boolean; // True ONLY if all required ML continuous features exist & are verified
}
```

### State Definitions:
- **`specQuality`**:
  - `verified`: Physical specifications confirmed against official manufacturer data sheets.
  - `partial`: Basic specs present (e.g. core count, VRAM), secondary specs (e.g. L2 cache, memory bus) pending.
  - `unverified`: Legacy unreviewed entry.
  - `stale`: Specifications flagged for revision following an official revision.
- **`performanceQuality`**:
  - `verified`: Standardized synthetic raster/single-core benchmark score recorded from verified tests.
  - `partial`: Benchmark score estimated based on architectural sibling.
  - `unavailable`: Hardware listed in catalog, but benchmark score is not yet recorded.
  - `stale`: Performance re-indexing required due to major driver or microcode updates.
- **`mlReady`**:
  - Set to `true` **strictly when** `specQuality === 'verified'` AND `performanceQuality === 'verified'`.
  - Guarantees Model V2 inference receives complete, non-null, high-confidence physical and performance features.

---

## 5. ML Feature Safety & Target Leakage Elimination

### 5.1 Leakage-Prone Derived Features (DEFERRED from ML Inputs)
The following derived features are explicitly **DEFERRED and DISALLOWED** as input features for ML Model V2:
1. `gamingIndex` — **DEFERRED:** If derived from game framerate tests, it directly leaks the target variable (`avgFps`).
2. `bottleneckScore` — **DEFERRED:** Heuristic output metric; cannot be used as an input feature to predict FPS.
3. `performanceIndex` — **DEFERRED:** Internal composite score; must not be fed into the model predicting the same performance.

### 5.2 Approved Independent ML Features for Model V2
All Model V2 input features must be strictly physical specifications or independently measured synthetic benchmarks:
- **CPU:** `cores.total`, `threads`, `clocks.boostClockGHz`, `cache.l3CacheMB`, `performance.singleCoreScore`, `performance.multiCoreScore`.
- **GPU:** `memory.vramGB`, `memory.memoryBandwidthGBs`, `power.defaultTgpWatts`, `performance.rasterPerformanceScore`, `features.rayTracingSupport`.
- **System & Game:** `RAM (GB)`, `Resolution`, `Graphics Settings`, Game Requirements Profile.

---

## 6. PassMark & UL Benchmarks In-Depth Assessment

### 6.1 PassMark Software Data Services
- **Capability:** Provides complete, updated daily/weekly CSV dumps covering over 3,000 CPU and 3,000 GPU models.
- **Data Offered:** CPU Mark, Single Thread Mark, TDP, Cores, Socket, 3D Graphics Mark (G3DMark), 2D Graphics Mark.
- **Access & Licensing:** Available for purchase through PassMark Services for commercial redistribution and database storage.
- **Target Leakage Risk:** **ZERO.** PassMark scores are synthetic CPU/GPU compute tests independent of specific game FPS benchmarks.
- **Project Aura Role:** **HIGH-VALUE COMMERCIAL DATASET CANDIDATE** for automated bulk score synchronization upon commercial licensing.

### 6.2 UL Solutions (3DMark / PCMark)
- **Capability:** Industry-standard synthetic graphics benchmarks (TimeSpy, Steel Nomad, Port Royal, FireStrike) and UL Game Performance API.
- **Data Offered:** Standardized raster scores, ray-tracing scores, and hardware capability profiles.
- **Access & Licensing:** Professional/Enterprise licensing and commercial Retailer APIs.
- **Target Leakage Risk:** **ZERO.** Standardized 3DMark synthetic raster benchmarks measure pure GPU compute/fillrate without game-specific target leakage.
- **Project Aura Role:** **GOLD-STANDARD BENCHMARK REFERENCE** for defining Project Aura's 0–100 Normalized Raster Index.

---

## 7. Strategic Ingestion Roadmap: MVP vs. Commercial Scale

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ OPTION A: ZERO/LOW-COST MVP (Milestone V2.1.2B)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Scope: ~100 Top Modern Desktop CPUs & ~100 Top Modern Desktop GPUs        │
│ • Sources: Intel ARK / AMD Specs / NVIDIA Specs (Manually Verified)         │
│ • Benchmarks: Standardized Synthetic Index (Cinebench R23 / TimeSpy Scale)  │
│ • Storage: Clean, version-controlled master seed JSON files in repository   │
│ • Cost: $0. Zero legal risk. Zero scraping. 100% verified data quality.     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ OPTION B: COMMERCIAL SCALE (Future Milestone V2.3+)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Scope: 5,000+ Historical & Global PC Hardware Components                  │
│ • Sources: PassMark Licensed Data Dump OR TechPowerUp Enterprise API        │
│ • Benchmarks: UL Solutions / 3DMark API Integration                         │
│ • Storage: Automated nightly synchronization service                        │
│ • Cost: Commercial licensing contract. Supported by platform revenue.       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Implementation Gate for V2.1.2B

| Gate Check | Status | Rationale |
| :--- | :---: | :--- |
| **`READY_FOR_SCHEMA_IMPLEMENTATION`** | **YES** | Master Mongoose schemas, indexes, normalizers, aliases, validation, and APIs can be built immediately with 100% architectural safety. |
| **`READY_FOR_AUTOMATED_DATA_INGESTION`** | **NO** | Automated web scraping of hardware websites is strictly rejected. Automated ingestion requires an active commercial API contract (e.g. PassMark / TechPowerUp API), which is deferred to commercial scale. |
| **`READY_FOR_VERIFIED_MVP_SEEDING`** | **YES** | Clean, curated JSON seed datasets for ~100 top modern CPUs and GPUs verified against official manufacturer specs can proceed in V2.1.2B. |
