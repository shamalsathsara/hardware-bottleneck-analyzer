# Project Aura V2: Benchmark Data Source, Licensing & Collection Strategy

> **Document Version:** 2.1.3B  
> **Status:** Research, Licensing & Source-Approval Strategy (Design Only — No Data Collection, No Scraping, No Training)  
> **Target Audience:** Engineering, Legal/Licensing, Machine Learning, Product Strategy

---

## 1. Executive Summary

Project Aura V2 requires real, verifiable, and legally compliant **Game Benchmark Observations** to power **Dataset V2**, **Model V2**, and future gameplay estimation features (*Can I Run It*, *Upgrade Advisor*). 

This document defines the authoritative data source approval matrix, legal boundaries, source-field ownership rules, and ingestion strategies for Project Aura.

### Core Guiding Principle:
$$\text{Accuracy, Traceability, and Legal Compliance} > \text{Dataset Size}$$

Under no circumstances will Project Aura treat "publicly visible on the web" as authorization to scrape, ingest, store, redistribute, or train machine learning models on third-party benchmark data.

---

## 2. Core Source Classification Standards

Every candidate data source is strictly categorized into one of five functional classes:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Data Source Classification Hierarchy                            │
├───────────────────────────────┬────────────────────────────────────────────────────────┤
│ Classification Category       │ Definition & Role in Project Aura                      │
├───────────────────────────────┼────────────────────────────────────────────────────────┤
│ A. MEASURED GROUND TRUTH      │ Actual game execution measured on verified physical    │
│                               │ hardware with documented settings and frametimes.      │
│                               │ ── Mandatory ground-truth label for Dataset V2.        │
├───────────────────────────────┼────────────────────────────────────────────────────────┤
│ B. THIRD-PARTY ESTIMATE       │ Model-generated or statistically estimated FPS from    │
│                               │ external vendors (e.g. UL /estimate endpoint).         │
│                               │ ── Prohibited from primary training data.              │
├───────────────────────────────┼────────────────────────────────────────────────────────┤
│ C. SYNTHETIC HARDWARE SCORE   │ Standardized synthetic benchmark metrics (e.g.         │
│                               │ PassMark CPU Mark, 3DMark Time Spy Graphics Score).     │
│                               │ ── Hardware Master signal / ML feature input only.     │
├───────────────────────────────┼────────────────────────────────────────────────────────┤
│ D. HARDWARE SPECIFICATION     │ Manufacturer physical specifications (ARK, TechPowerUp)│
│                               │ ── Hardware Master catalog attribution only.           │
├───────────────────────────────┼────────────────────────────────────────────────────────┤
│ E. UNKNOWN / UNVERIFIED       │ Data lacking verifiable provenance or explicit license.│
│                               │ ── STRICTLY PROHIBITED & REJECTED.                     │
└───────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 3. Granular Rights & Permissions Matrix

To prevent legal ambiguity, Project Aura evaluates candidate sources across **14 independent rights dimensions** rather than using generic "commercial use" labels:

| # | Right / Usage Dimension | Definition |
| :---: | :--- | :--- |
| **R1** | **Human Viewing / Reference** | Manual human inspection for research without persistent storage. |
| **R2** | **Automated API Access** | Programmatic fetching via official REST / GraphQL endpoints. |
| **R3** | **Automated Web Scraping** | Crawling or parsing unstructured HTML / DOM structures. *(Default: Prohibited)* |
| **R4** | **Bulk Dataset Download** | Downloading complete CSV, JSON, or SQL database dumps. |
| **R5** | **Local In-Memory Caching** | Ephemeral caching of responses during active execution. |
| **R6** | **Persistent Database Storage**| Saving records into Project Aura MongoDB (`game_benchmarks`). |
| **R7** | **Data Normalization** | Transforming raw values into Project Aura canonical schemas. |
| **R8** | **Machine Learning Training** | Feeding observations into supervised Model V2 training matrices. |
| **R9** | **Internal Commercial Use** | Utilizing data within internal analytics and development tools. |
| **R10**| **Public Display (Raw)** | Displaying exact individual benchmark numbers to public users. |
| **R11**| **Public Display (Aggregated)**| Displaying median ranges, percentiles, or charts to public users. |
| **R12**| **Raw Data Redistribution** | Reselling or re-hosting third-party raw datasets via public APIs. |
| **R13**| **Commercial Product Use** | Operating a monetized consumer platform based on the platform. |
| **R14**| **Attribution Requirements** | Mandatory public citation, backlinks, or trademark notices. |

---

## 4. In-Depth Source Assessments

### 4.1 UL Benchmarks (3DMark / Procyon / Performance Data API)
- **Primary Domain:** `benchmarks.ul.com` / `ul.com`
- **Data Classification:**
  - Standard API Endpoint (`/estimate`): **B. THIRD-PARTY ESTIMATE**
  - Benchmark Suite Runs (3DMark Time Spy / Steel Nomad): **C. SYNTHETIC HARDWARE SCORE**
- **Gaming Coverage:** 50+ popular PC games across 1080p, 1440p, and 4K at standard fidelity tiers.
- **API Availability:** Commercial Performance Data API available via sales licensing.
- **Licensing Assessment:**
  - *Standard API Output:* Provides statistical estimations derived from internal UL regression models, not raw telemetry observations.
  - *ML Training Rights:* Training an independent machine learning model on another vendor's model outputs constitutes model distillation / extraction and is strictly prohibited without a custom OEM agreement.
  - *Public Display:* Suitable for product comparison fallbacks or display validation if licensed commercially.
- **Verdict for Dataset V2 Training:** **PROHIBITED FOR TRAINING LABELS.**
- **Verdict for Product Validation:** **APPROVED_PRODUCT_DISPLAY_ONLY (Subject to Commercial License Agreement).**

---

### 4.2 PassMark Software (PerformanceTest / CPU Benchmarks)
- **Primary Domain:** `passmark.com` / `cpubenchmark.net` / `videocardbenchmark.net`
- **Data Classification:** **C. SYNTHETIC HARDWARE BENCHMARK** & **D. HARDWARE SPECIFICATION**
- **Game-Specific FPS Data:** None. PassMark publishes synthetic composite performance indices (PassMark G3D Mark, CPU Mark, Thread Mark).
- **Commercial Licensing Options:** PassMark sells structured commercial database dumps (CSV/JSON) with annual update subscriptions.
- **Licensing Assessment:**
  - *Commercial Rights:* Full commercial internal database integration permitted under commercial data dump license.
  - *ML Training Rights:* Permitted as an independent input feature (e.g. `cpu_passmark_score`, `gpu_passmark_g3d`), provided it is not treated as a target label.
  - *Raw Redistribution:* Prohibited (aggregates and derived models only).
- **Verdict for Dataset V2 Target Labels:** **NOT APPLICABLE (Synthetic metric, not game FPS).**
- **Verdict for Hardware Master / ML Input Features:** **APPROVED_HARDWARE_FEATURE (Requires Paid License Dump).**

---

### 4.3 OpenBenchmarking.org / Phoronix Test Suite
- **Primary Domain:** `openbenchmarking.org` / `phoronix-test-suite.com`
- **Data Classification:** **A. MEASURED GROUND TRUTH** & **C. SYNTHETIC BENCHMARK**
- **Software License:** Phoronix Test Suite client is licensed under GNU GPLv3.
- **Result Data Licensing:**
  - Public test profiles and results hosted on OpenBenchmarking.org are submitted by diverse community users, hardware vendors, and automated bots.
  - While test scripts are open source, individual benchmark run submissions do not carry a unified CC-BY or public domain waiver for automated commercial scraping and commercial ML model training.
- **Technical Relevance:** Heavily focused on Linux gaming (Proton/Vulkan), server workloads, and synthetic tests. Limited Windows DX12 gaming coverage.
- **Verdict:** **UNRESOLVED — LEGAL/LICENSING REVIEW REQUIRED.** Automated scraping or mass ingestion of public OpenBenchmarking records is prohibited until terms are formally clarified.

---

### 4.4 Review Publications & Benchmark Labs (Tom's Hardware, TechPowerUp, Hardware Unboxed, Gamers Nexus)
- **Data Classification:** **A. MEASURED GROUND TRUTH**
- **Assessment:**
  - These laboratories produce the industry's highest quality measured gaming benchmarks (repeatable routes, 1% lows, frame capture tools like FrameView and CapFrameX).
  - **Copyright & Database Rights:** Benchmark charts, article tables, and video presentations are protected under copyright law and database rights. "Fair use" does not permit automated bulk scraping or commercial ML dataset construction.
- **Verdict for Automated Scraping:** **STRICTLY REJECTED.**
- **Approved Ingestion Pathway:** **Creator & Publisher Partnership Agreements** (voluntary structured data sharing).

---

### 4.5 Public Datasets (Kaggle / GitHub)
- **Data Classification:** Varies (**E. UNVERIFIED** by default)
- **Assessment:**
  - The vast majority of gaming benchmark datasets on Kaggle or GitHub are unsanctioned scrapings of review websites, synthetic simulations, or user self-reports lacking verified hardware specifications.
  - A Kaggle repository license (e.g., MIT, CC0) is invalid if the uploader did not hold the original IP rights to the underlying measurements.
- **Verdict:** **REJECTED BY DEFAULT.** Any individual dataset must undergo strict provenance verification before consideration.

---

## 5. First-Party Benchmarking Strategy (Project Aura Lab)

The gold standard for empirical ground truth is **Project Aura First-Party Benchmarking**: controlled, standardized testing executed on physical hardware owned or managed by Project Aura.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                     Project Aura Standardized Test Protocol                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Hardware Verification: Full system spec audit (CPU, GPU, RAM speed, ReBAR state).   │
│ 2. System State Baseline: Clean Windows 11 install, latest WHQL Game Ready driver.     │
│ 3. Thermal Warm-Up: 10-minute looping thermal saturation run prior to measurement.     │
│ 4. Test Execution: 3 consecutive runs using repeatable route or built-in benchmark.    │
│ 5. Metric Capture: CapFrameX / FrameView hardware telemetry logging.                   │
│ 6. Validation Gate: Standard deviation across runs must be < 2.5% to accept avgFps.    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Advantages:
- **100% Provenance & Legal Clarity:** Fully owned first-party data; zero third-party licensing dependencies.
- **Frametime Telemetry:** Captures full frametime distribution (Avg, 1% Low, 0.1% Low, Stutter Index).
- **Exact Settings Control:** Eliminates guessing of background tasks, memory timings, or render scale.

---

## 6. Benchmark Creator Partnership Program

To scale empirical coverage without requiring millions in hardware inventory, Project Aura will establish a **Creator Partnership Program**:

1. **Target Partners:** Independent hardware reviewers and YouTube benchmark creators.
2. **Mechanism:** Creators export raw benchmark CSV / CapFrameX telemetry logs directly into a secure Project Aura Creator Portal.
3. **Incentive Structure:**
   - Prominent attribution, link-backs, and branded partner badges on Project Aura game detail pages.
   - Access to Project Aura analytics and automated charting tools.
4. **Legal Framework:** Standardized Data Contribution Agreement granting Project Aura non-exclusive, perpetual, worldwide rights to store, normalize, aggregate, and train ML models.

---

## 7. Future Community Benchmark Collection Architecture

A long-term scaling avenue is opt-in community submissions via an open-source **Project Aura Telemetry Client**:

```
┌───────────────────────────┐
│ Project Aura Client Agent │ ── Auto-detects physical CPU, GPU, RAM, driver, OS
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ Supported In-Game Run     │ ── Captures frametimes during built-in benchmark execution
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ Anti-Spoofing & Privacy   │ ── Zero PII (No IP, no email, no device identifiers)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ Quality & Sanity Gate     │ ── Verifies statistical plausibility against cluster bounds
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ MongoDB: game_benchmarks  │ ── Stored as quality.grade = 'medium' (source: community)
└───────────────────────────┘
```

---

## 8. Realistic Business & Ingestion Plans

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                            Three-Tiered Ingestion Strategy                             │
├──────────────────────────┬─────────────────────────────────────────────────────────────┤
│ Strategy Tier            │ Components, Scope, and Feasibility                          │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ PLAN A:                  │ • First-Party Lab Testing (50–100 core benchmark configs).  │
│ Near-Zero Budget         │ • Creator Partnership Program (10–15 participating labs).   │
│ (Independent / MVP)      │ • Verified open telemetry datasets (CapFrameX shared logs). │
│                          │ ── Legal Risk: Zero | Engineering: Low | Accuracy: High     │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ PLAN B:                  │ • Plan A foundation PLUS:                                   │
│ Small Commercial Budget  │ • Commercial PassMark Hardware Database Dump.               │
│ ($5K – $25K)             │ • Paid Creator data bounties / hardware test rotation.      │
│                          │ ── Legal Risk: Zero | Hardware Coverage: Extensive          │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ PLAN C:                  │ • Plan B foundation PLUS:                                   │
│ Commercial Scale         │ • Enterprise UL Performance Data API license for product.   │
│ ($50K+)                  │ • Publisher telemetry integrations & automated QA feeds.    │
│                          │ ── Scalability: Global | Coverage: 100+ Games               │
└──────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 9. Minimum Dataset V2 Coverage Matrix & Intelligent Sampling

A full Cartesian product ($\text{CPUs} \times \text{GPUs} \times \text{Games} \times \text{Settings}$) is mathematically infeasible ($200 \times 300 \times 100 \times 12 \approx 72,000,000$ combinations).

### Intelligent Stratified Sampling Strategy (MVP Target):
- **Core Game Suite:** 35 representative PC games spanning modern engines (Unreal Engine 5, REDengine 4, Decima, Frostbite, Unity, Creation Engine).
- **GPU Performance Anchor Tiers:**
  - *Tier 1 (Flagship / 4K Ultra):* RTX 4090, RX 7900 XTX
  - *Tier 2 (High-End / 1440p Ultra):* RTX 4070 SUPER, RX 7800 XT
  - *Tier 3 (Mid-Range / 1080p High):* RTX 4060, RX 7600, RTX 3060
  - *Tier 4 (Entry / 1080p Low-Med):* GTX 1650, RX 6500 XT
- **CPU Scaling Tiers:** Low (4c/8t), Mid (6c/12t), Gaming High (Ryzen 7 7800X3D / Core i7-14700K).
- **Total Initial Target Size:** **1,500 – 3,500 verified, high-quality observations**.

---

## 10. Third-Party Estimate Policy

1. **Strict Segregation:** Third-party statistical estimates (e.g. UL `/estimate`, UserBenchmark algorithms) must **NEVER** be ingested into the `game_benchmarks` collection or mixed into Dataset V2 training labels.
2. **Product Reference Only:** If licensed, third-party estimates may be exposed as an auxiliary UI reference badge (`"UL Estimated Performance: ~85 FPS"`), clearly differentiated from Project Aura AI predictions.

---

## 11. Source Approval Matrix

| Source Candidate | Primary Data Type | Classification | Approved Use Cases | Gating Status |
| :--- | :--- | :--- | :--- | :---: |
| **Project Aura First-Party Lab** | Game FPS Frametimes | A. Measured Ground Truth | Model V2 Training, Public Display | `APPROVED_MEASURED_TRAINING` |
| **Creator Partnership Feeds** | CapFrameX / Game Logs | A. Measured Ground Truth | Model V2 Training, Public Display | `APPROVED_MEASURED_TRAINING` |
| **PassMark Data Dump** | CPU / GPU Benchmark Scores | C. Synthetic Benchmark | Hardware Master Specs & ML Features| `APPROVED_HARDWARE_FEATURE` |
| **UL Performance API** | Estimated Game Performance | B. Third-Party Estimate | Public Display Fallback Only | `APPROVED_PRODUCT_DISPLAY_ONLY` |
| **OpenBenchmarking.org** | Benchmark Run Submissions | A / C (Mixed) | Internal Exploration Only | `UNRESOLVED` |
| **Unsanctioned Web Scraping** | HTML Tables / Video OCR | A. Measured Ground Truth | None | `REJECTED` |
| **Unverified Public Repos** | Scraped CSVs | E. Unknown / Unverified | None | `REJECTED` |

---

## 12. Source-Field Ownership Matrix

To prevent data contamination, each database field has a single authoritative source:

```
┌──────────────────────────────────────────┬─────────────────────────────────────────────┐
│ Database Field                           │ Authoritative Source System                 │
├──────────────────────────────────────────┼─────────────────────────────────────────────┤
│ Game Identity, Slugs, IGDB ID            │ Game Catalog (IGDB Sync Engine)             │
│ CPU / GPU Physical Specs (Cores, VRAM)   │ Hardware Master (Manufacturer Specs / ARK)  │
│ Synthetic Benchmark Index (CPU/G3D Mark) │ Licensed Hardware Benchmark (PassMark)      │
│ Measured avgFps, 1% Lows, Frametimes     │ Approved GameBenchmark (Lab / Partner Feed) │
│ Resolution, Presets, RT / DLSS Flags     │ Approved GameBenchmark Observation Record   │
│ Derived Confidence & Quality Scores      │ Project Aura Normalization Engine           │
└──────────────────────────────────────────┴─────────────────────────────────────────────┘
```

---

## 13. Summary & Recommended Next Step

Project Aura V2 has established a clear, legal, and technically sound strategy for gathering real gaming benchmark data.

### Recommended Next Milestone:
**V2.1.3C — GAME BENCHMARK MONGOOSE SCHEMA & VALIDATION IMPLEMENTATION**
- Implement the `GameBenchmark` Mongoose model in `models/GameBenchmark.js`.
- Implement strict ingestion validation rules and deduplication fingerprinting.
- Add comprehensive backend test suites verifying schema constraints and training eligibility gating.
