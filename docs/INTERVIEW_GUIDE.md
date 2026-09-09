# Project Aura — Technical Interview & Portfolio Guide

> A comprehensive technical reference and discussion guide for software engineering recruiters, ML interviewers, and system architects.

---

## 30-Second Explanation

**Project Aura** is a machine learning-driven PC performance evaluation and bottleneck analyzer. Given a user's CPU, GPU, RAM, target game, and graphics preset, it predicts expected average framerates (FPS) and isolates hardware throughput bottlenecks. 

Unlike traditional calculators that rely on hardcoded heuristic formulas or strict hardware names, Project Aura Model V2 uses a **HistGradientBoostingRegressor** trained on physical silicon specifications (cores, clocks, cache, memory bandwidth, shader compute, and FP32 performance) across 24,624 benchmark observations to generalize performance across diverse PC configurations.

---

## Problem

Building or upgrading a gaming PC requires balancing CPU processing capacity with GPU rendering throughput. When one component significantly lags behind the other, hardware utilization is constrained—a condition known as a **bottleneck**. 

Existing online bottleneck calculators suffer from critical deficiencies:
1. **Opaque, Fabricated Percentages**: Many assign arbitrary "bottleneck percentages" (e.g., "18.4% bottleneck") without reproducible mathematical or physical foundations.
2. **Name-Dependent Memorization**: Legacy algorithms break when presented with new hardware models because they match static strings rather than physical silicon capabilities.
3. **Generic Workload Assumptions**: Rendering demand varies dramatically between CPU-bound esports titles (e.g., *Apex Legends*, *CS:GO*) and GPU-bound AAA titles (e.g., *Cyberpunk 2077*, *Far Cry 5*). A fixed ratio cannot capture game-specific architectural demands.

---

## Why Machine Learning?

PC gaming performance emerges from nonlinear interactions between hardware architecture, cache hierarchy, memory bandwidth, rasterization pipelines, and rendering engines:
- Memory bus width and memory clock jointly dictate bandwidth saturation thresholds at different resolutions.
- Multi-core CPU scaling exhibits diminishing returns past game engine thread-pool limits.
- Shader core counts scale framerates nonlinearly depending on graphics preset complexity.

A supervised regression model captures these multi-dimensional nonlinear relationships from empirical benchmark data without requiring hand-tuned heuristic equations for thousands of hardware combinations.

---

## Dataset

Project Aura Model V2 is trained on a curated benchmark dataset:
- **Clean Observations**: 24,624 empirical benchmark measurements.
- **Unique CPUs**: 19 distinct physical CPU models spanning multiple architectural generations (Intel Core 6th–12th Gen, AMD Ryzen 1000–5000 series).
- **Unique GPUs**: 27 distinct physical GPU models (NVIDIA Pascal, Turing, Ampere; AMD Polaris, RDNA 1, RDNA 2).
- **Unique Games**: 24 distinct PC game titles evaluated across standardized presets.
- **Resolution**: Standardized 1080p (1920×1080) native rendering baseline.

*(Note on historical metrics: Earlier documentation cited "54 GPUs"—data auditing revealed that figure counted GPU/preset profile combinations rather than unique physical silicon dies. The authoritative count is 27 unique physical GPUs).*

---

## Features

Model V2 accepts **16 strictly defined input features** representing physical silicon attributes and workload parameters:

### CPU Physical Features (6)
1. `CpuNumberOfCores` (Physical core count)
2. `CpuNumberOfThreads` (Logical thread count)
3. `CpuFrequency` (Base clock in MHz)
4. `CpuTurboClock` (Peak boost clock in MHz)
5. `CpuCacheL3` (Level 3 cache capacity in MB)
6. `CpuTDP` (Thermal Design Power in Watts)

### GPU Physical Features (8)
7. `GpuMemorySize` (VRAM capacity in MB)
8. `GpuBandwidth` (Memory bandwidth in MB/s)
9. `GpuMemoryBus` (Memory bus width in bits)
10. `GpuNumberOfShadingUnits` (Stream processors / CUDA cores)
11. `GpuBaseClock` (Base graphics clock in MHz)
12. `GpuBoostClock` (Boost graphics clock in MHz)
13. `GpuNumberOfROPs` (Render Output Units)
14. `GpuFP32Performance` (Single-precision compute capacity in GFLOPS)

### Workload / Game Features (2)
15. `GameName` (Categorical feature encoded via OneHotEncoder with unseen category handling)
16. `GameSetting_Ordinal` (Integer ordinal: `1 = Low`, `2 = Medium`, `3 = High`, `4 = Ultra`)

---

## Target Variable

The single regression target is:
- **`FPS`**: Measured native average frames per second delivered under the specified hardware and preset configuration.

Target leakage prevention strictly isolates target metrics: `Min FPS`, `Max FPS`, `1% Low FPS`, and composite scoring metrics are excluded from the model's feature space.

---

## Model V1

- **Architecture**: `RandomForestRegressor` (100 decision trees) trained on a legacy 1,000-row tabular dataset.
- **Input Representation**: 71-dimensional one-hot encoded vector representing categorical hardware names (e.g., `CPU_Intel Core i7-9700K = 1`).
- **Limitation**: When presented with any hardware not present in the 1,000-row dataset, one-hot features evaluate to zero, forcing fallback to generic continuous heuristics.
- **Current Role**: Preserved as a validated, operational rollback mechanism (`MODEL_VERSION=v1`).

---

## Why V2 Was Created

Model V2 was engineered to solve the fundamental architectural flaws of Model V1:
1. **Transition to Physical Specifications**: By training on continuous silicon properties (transistor throughput, memory bandwidth, compute units) instead of categorical strings, the model learns underlying performance curves that transfer to unobserved hardware.
2. **Game-Aware Modeling**: Integrated game identity and preset complexity into the pipeline.
3. **Rigorous Generalization Benchmarking**: Evaluated across multi-protocol holdout partitions (unseen CPUs, unseen GPUs, unseen games) rather than relying solely on random holdout splits.

---

## Model V2

- **Architecture**: scikit-learn `HistGradientBoostingRegressor` wrapped in a production `Pipeline` with `ColumnTransformer`.
- **Artifact**: `ai-python/ml-model-v2/experiments/v2_baseline/candidate_model_v2.joblib`
- **Serialization**: Joblib serialized artifact (554 KB), loaded into memory upon service startup.
- **Inference Runtime**: Python 3.13 Flask microservice returning structured JSON with predicted FPS, model version, and game coverage tier.

---

## Why HistGradientBoostingRegressor?

During model exploration across Random Forest, Gradient Boosting, and Histogram-based Gradient Boosting:
1. **Histogram Binning**: Discretizes continuous numerical features into 256 integer bins, drastically speeding up tree split finding while maintaining high precision.
2. **Generalization Power**: Achieved superior generalization error across unseen hardware holdout sets (MAE: 4.75 FPS on unseen GPUs vs. 12.07 FPS for Random Forest).
3. **Native Handling & Inference Efficiency**: Minimal memory footprint (554 KB vs. 6.5 MB for Random Forest) and sub-10ms inference latency.

---

## Train/Test Strategy

To prevent over-optimistic evaluation metrics, Model V2 was benchmarked against four distinct validation protocols:

```
┌─────────────────────────┬──────────────────┬─────────────────┬─────────────────┐
│ Evaluation Protocol     │ Training Samples │ Testing Samples │ Split Strategy  │
├─────────────────────────┼──────────────────┼─────────────────┼─────────────────┤
│ 1. Standard Holdout     │ 19,699 (80%)     │ 4,925 (20%)     │ Random Shuffle  │
│ 2. Unseen GPU Holdout   │ 20,064 (81.5%)   │ 4,560 (18.5%)   │ 5 Held-out GPUs │
│ 3. Unseen CPU Holdout   │ 19,440 (78.9%)   │ 5,184 (21.1%)   │ 4 Held-out CPUs │
│ 4. Unseen Game Holdout  │ 20,520 (83.3%)   │ 4,104 (16.7%)   │ 4 Held-out Games│
└─────────────────────────┴──────────────────┴─────────────────┴─────────────────┘
```

---

## What is MAE?

**Mean Absolute Error (MAE)** measures the average magnitude of prediction errors in absolute terms:

$$\text{MAE} = \frac{1}{n} \sum_{i=1}^{n} |y_i - \hat{y}_i|$$

- **In Plain Language**: An MAE of **1.69 FPS** on standard holdout means that, on average, predicted framerates differed from measured benchmark framerates by approximately 1.69 FPS.
- **Interview Note**: MAE is not a strict guarantee that every prediction falls within $\pm 1.69$ FPS; rather, it indicates the expected average distance across the evaluation distribution.

---

## What is RMSE?

**Root Mean Squared Error (RMSE)** measures the square root of the average squared differences:

$$\text{RMSE} = \sqrt{\frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2}$$

- **Significance**: Because errors are squared before averaging, RMSE penalizes large outlier errors more heavily than MAE.
- **Model V2 Standard Holdout RMSE**: **2.32 FPS**, confirming tight error bounds without extreme outlier predictions.

---

## What is R²?

The **Coefficient of Determination ($R^2$)** represents the proportion of variance in the target variable explained by the model:

$$R^2 = 1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}$$

- **Model V2 Standard Holdout $R^2$**: **0.9982** (99.82% of FPS variance accounted for by the physical feature pipeline).
- **Baseline Comparison**: A dummy baseline predicting the dataset mean yields $R^2 = 0.0$ and MAE of 42.16 FPS.

---

## How Unseen CPU Testing Works

To evaluate how well the model predicts performance on processors it was never trained on:
1. Four CPUs were completely withheld from training: `AMD Ryzen 7 3700X`, `Intel Core i5-8600K`, `AMD Ryzen 5 2600X`, `Intel Core i7-7700K` (5,184 benchmark rows).
2. The model was trained exclusively on the remaining 15 CPUs (19,440 rows).
3. **Result**: MAE of **2.47 FPS**, RMSE of **3.12 FPS**, $R^2$ of **0.9967**. The physical CPU features successfully generalized to unobserved processor architectures.

---

## How Unseen GPU Testing Works

To evaluate generalization to unseen graphics cards:
1. Five GPUs across architectures were completely withheld from training: `NVIDIA GeForce RTX 2070 SUPER`, `NVIDIA GeForce GTX 1070 Ti`, `AMD Radeon RX 5700 XT`, `NVIDIA GeForce GTX 1660`, `AMD Radeon RX 580` (4,560 rows).
2. The model was trained on the remaining 22 GPUs (20,064 rows).
3. **Result**: MAE of **4.75 FPS**, RMSE of **6.01 FPS**, $R^2$ of **0.9872** (compared to Random Forest's degraded MAE of 12.07 FPS).

---

## How Unseen Game Testing Works

To test behavior when a user queries a game outside the 24 training titles:
1. Four games were completely withheld from training: `Apex Legends`, `Destiny 2`, `Frostpunk`, `Grand Theft Auto V` (4,104 rows).
2. The model was trained on the remaining 20 games (20,520 rows).
3. **Result**: MAE of **16.58 FPS**, RMSE of **20.45 FPS**, $R^2$ of **0.6000**.
4. **Engineering Decision**: Game engine rendering pipelines differ significantly across genres. When an unseen game is detected, the frontend and API explicitly flag the result as `"gameCoverage": "unseen"` and display `"⚠️ Estimated for an untested game"` to maintain scientific transparency.

---

## Target Leakage Prevention

Target leakage occurs when training features contain direct or indirect information about the target variable that would not be available during real-world inference:
- `Min FPS`, `Avg FPS`, `Max FPS`, and composite `Bottleneck Score` fields were pruned before training.
- Physical specifications were normalized from manufacturer databases (Hardware Master) rather than extracted from run-time telemetry.

---

## How Frontend Talks to ML Model

```
[ User UI ] (React 19)
    │
    │  POST /api/predict { cpu: "Ryzen 7 7800X3D", gpu: "RTX 4070 Ti", game: "apexLegends" }
    ▼
[ Node.js API Gateway ] (Express 5)
    │
    │  1. Canonical Hardware Resolver queries MongoDB Hardware Master
    │  2. Assembles 16 strictly typed physical features (cores, clocks, VRAM, bandwidth, shaders)
    │  3. Validates completeness (rejects incomplete specs with HTTP 400 MODEL_V2_HARDWARE_DATA_INCOMPLETE)
    │
    │  POST http://127.0.0.1:5000/predict (V2 Payload)
    ▼
[ Python Flask AI Microservice ]
    │
    │  1. Ingests DataFrame into HistGradientBoosting pipeline
    │  2. Generates bounded, deterministic FPS prediction
    │  3. Attaches modelVersion: "v2", gameCoverage: "known" | "unseen"
    │
    ▼
[ Bottleneck Evaluation Engine ]
    │
    │  Calculates component throughput balance, severity score, and upgrade path
    │
    ▼
[ Rendered UI Performance & Bottleneck Card ]
```

---

## Why Model V1 Is Still Preserved

In production machine learning systems, preserving a known baseline ensures operational resilience:
- **Zero-Downtime Rollback**: If an edge case or upstream specification resolution issue arises in Model V2, setting `MODEL_VERSION=v1` immediately switches inference to the legacy Random Forest path without code deployments or database migrations.
- **Comparative Validation**: Enables regression testing between legacy baseline predictions and Model V2 inference.

---

## Current Limitations

1. **Resolution Scope**: Model V2 was trained on 1080p benchmark observations; 1440p and 4K estimations utilize application-level baseline modifiers.
2. **Preset Coverage**: Native training focuses on Medium and Ultra graphic presets.
3. **Training Catalog**: 24 verified training games; untested titles carry higher estimation variance and are labeled accordingly.
4. **Extreme Silicon Distribution**: Exotic or future server/workstation architectures (e.g., 64-core Threadripper) far outside consumer distribution bounds may exhibit larger estimation bounds.

---

## What I Would Improve With More Time/Data

1. **Multi-Resolution Native Training**: Expand training data to include native 1440p, 4K, and Ultrawide benchmark runs.
2. **1% Low Frametime Modeling**: Train a secondary regressor to predict 99th percentile frametime / 1% low FPS for micro-stutter analysis.
3. **Dynamic Architecture Embeddings**: Incorporate GPU architectural generation tags (e.g., Ada Lovelace, RDNA 3) and memory bus technology (GDDR6X, HBM) into the feature space.
4. **Automated Ingestion Pipeline**: Implement continuous benchmark ingestion with automated model evaluation and shadow deployment pipelines.
