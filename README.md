# Project Aura

> An ML-powered PC gaming performance analysis and hardware bottleneck evaluation platform that predicts framerates (FPS) and analyzes CPU/GPU balance using physical silicon specifications and empirical benchmark data.

---

## Overview

Building or upgrading a gaming PC requires balancing processor compute throughput with graphics rendering capacity. When components are mismatched, hardware utilization is constrained by a **bottleneck**—causing stuttering, frame drops, or underutilized GPU silicon.

Existing bottleneck calculators frequently rely on opaque formulas, static hardware name lookup, and fabricated "bottleneck percentages" that fail to account for modern hardware architectures or game-specific rendering characteristics.

**Project Aura** solves this problem by combining:
1. A **physical-specification machine learning pipeline** (Model V2) trained on empirical benchmark observations.
2. A **canonical hardware specification master catalog** that resolves real-world silicon properties (cores, clocks, cache, memory bus, bandwidth, shader units, and FP32 compute).
3. A **game-aware evaluation engine** that accounts for graphical presets and engine workloads.

---

## Key Features

- **ML-Based FPS Prediction**: Continuous framerate estimation powered by a trained `HistGradientBoostingRegressor` model.
- **CPU / GPU Bottleneck Analysis**: Identifies component limitations, calculates bottleneck severity, and suggests balanced upgrade recommendations.
- **Physical Hardware Search & Resolution**: Autocomplete query search for thousands of CPUs and GPUs resolving to canonical Hardware Master specification records.
- **PC Games Catalog**: Browse PC games with system requirements, genre filters, and technical capability profiles (Ray Tracing, DLSS, FSR) synchronized with IGDB.
- **Saved PC Builds (My Rigs)**: Authenticated user profiles for saving, loading, and managing custom PC hardware configurations.
- **Side-by-Side Rig Comparison**: Compare two PC configurations simultaneously with comparative performance delta metrics.
- **Known & Unseen Game Handling**: Deterministic high-confidence prediction for trained titles and transparent estimation disclaimers for unobserved games.
- **Secure Authentication**: User registration, login, and password recovery secured by bcrypt password hashing and JSON Web Tokens (JWT).

---

## Screenshots

> *Screenshots from the Project Aura user interface:*

| PC Bottleneck Analyzer | Side-by-Side Rig Comparison |
| :---: | :---: |
| *(Analyzer UI — Component selection, FPS gauge, metric cards, and upgrade advice)* | *(Comparison UI — Side-by-side performance evaluation)* |

| Games Catalog & System Requirements | Saved PC Builds Profile |
| :---: | :---: |
| *(Games catalog with search, genre filters, and tech specs)* | *(Saved Rigs profile for authenticated users)* |

---

## Technology Stack

- **Frontend**: React 19, Vite, Vanilla CSS design system (dark-mode glassmorphic theme).
- **Backend API Gateway**: Node.js, Express 5, Mongoose 8, Axios, bcryptjs, jsonwebtoken, express-rate-limit.
- **Database**: MongoDB Atlas Cloud.
- **Machine Learning & Inference**: Python 3.13, Flask, scikit-learn (`HistGradientBoostingRegressor`), joblib, pandas, NumPy.
- **External Metadata Integration**: IGDB API via Twitch OAuth 2.0.

---

## System Architecture

```mermaid
flowchart TD
    User([User Browser]) <--> React[React 19 + Vite Frontend]
    React <-->|REST API JSON| Node[Node.js / Express 5 API Gateway]
    
    subgraph Persistence & Metadata
        Node <--> MongoDB[(MongoDB Atlas)]
        Node <-->|Twitch OAuth 2.0| IGDB[(IGDB Metadata API)]
    end

    subgraph Machine Learning Pipeline
        Node -->|Resolves Physical Specs| Resolver[Hardware Master Resolver]
        Resolver -->|16-Feature JSON Payload| Flask[Python Flask ML Microservice]
        Flask -->|Physical Feature Pipeline| ModelV2[Model V2: HistGradientBoosting]
        Flask -.->|Rollback Path| ModelV1[Model V1: Random Forest]
        ModelV2 -->|Predicted FPS & Coverage Tier| Flask
        Flask -->|Inference Result| Node
    end

    Node -->|FPS & Bottleneck Evaluation| React
```

---

## Machine Learning Pipeline

Project Aura Model V2 predicts native 1080p framerates directly from physical silicon capabilities rather than relying on categorical hardware name memorization:

```
Empirical Benchmark Dataset (24,624 Clean Rows)
        ↓
Data Audit & Cleaning (Byte-string removal, null pruning, schema validation)
        ↓
Feature Selection & Transformation (Physical Silicon Specs + Game + Preset)
        ↓
Multi-Protocol Validation (Standard Holdout, Unseen CPU, Unseen GPU, Unseen Game)
        ↓
HistGradientBoostingRegressor Training
        ↓
Serialized Pipeline Artifact (candidate_model_v2.joblib)
        ↓
Flask REST Inference Service (PORT 5000)
        ↓
Project Aura Application Bridge
```

### Model V2 Input Features (16 Total)

| Category | Feature Name | Unit / Type | Description |
| :--- | :--- | :--- | :--- |
| **CPU Physical** | `CpuNumberOfCores` | Float | Physical CPU core count |
| | `CpuNumberOfThreads` | Float | Logical CPU thread count |
| | `CpuFrequency` | Float (MHz) | Base CPU clock frequency |
| | `CpuTurboClock` | Float (MHz) | Peak turbo/boost frequency |
| | `CpuCacheL3` | Float (MB) | Level 3 cache capacity |
| | `CpuTDP` | Float (Watts) | Processor Thermal Design Power |
| **GPU Physical** | `GpuMemorySize` | Float (MB) | Dedicated VRAM capacity |
| | `GpuBandwidth` | Float (MB/s) | Memory bandwidth throughput |
| | `GpuMemoryBus` | Float (Bits) | Memory bus width |
| | `GpuNumberOfShadingUnits`| Float | Stream processors / CUDA cores |
| | `GpuBaseClock` | Float (MHz) | GPU base clock frequency |
| | `GpuBoostClock` | Float (MHz) | GPU boost clock frequency |
| | `GpuNumberOfROPs` | Float | Render Output Units |
| | `GpuFP32Performance` | Float (GFLOPS) | Single-precision compute capacity |
| **Workload** | `GameName` | Categorical | Target game identifier (OneHot-encoded) |
| | `GameSetting_Ordinal` | Integer (1–4) | Preset level (`1=Low`, `2=Med`, `3=High`, `4=Ultra`) |

*Target variable:* **`FPS`** (Average frame delivery rate). Pruned from features to prevent target leakage.

---

## Model V1 vs. Model V2

| Dimension | Model V1 (Baseline / Rollback) | Model V2 (Production Candidate) |
| :--- | :--- | :--- |
| **Algorithm** | `RandomForestRegressor` (100 trees) | `HistGradientBoostingRegressor` |
| **Feature Representation** | 71-dimension one-hot categorical hardware names | 16 physical silicon specs + game + preset ordinal |
| **Unseen Hardware Support**| Degrades (one-hot columns collapse to 0) | Strong (evaluates physical continuous compute specs) |
| **Game Awareness** | 0 games (uncalibrated generic workload) | 24 trained games with explicit preset scaling |
| **Model Artifact Size** | 6.5 MB (`project_aura.joblib`) | 554 KB (`candidate_model_v2.joblib`) |
| **Status** | Preserved operational rollback path | Active default production model |

> **Evaluation Dataset Note**: Model V1 and Model V2 were trained on different historical datasets (1,000-row synthetic/legacy dataset vs. 24,624-row empirical benchmark dataset). Their metrics represent distinct evaluation methodologies rather than a direct apples-to-apples training split.

---

## Model V2 Authoritative Evaluation

Model V2 was rigorously evaluated across four independent validation protocols:

```
┌──────────────────────────────────────┬──────────────┬──────────────┬─────────────┐
│ Validation Protocol                  │ MAE (FPS)    │ RMSE (FPS)   │ R² Score    │
├──────────────────────────────────────┼──────────────┼──────────────┼─────────────┤
│ 1. Standard Holdout (Random 80/20)   │ 1.69 FPS     │ 2.32 FPS     │ 0.9982      │
│ 2. Unseen CPU Holdout (4 held out)   │ 2.47 FPS     │ 3.12 FPS     │ 0.9967      │
│ 3. Unseen GPU Holdout (5 held out)   │ 4.75 FPS     │ 6.01 FPS     │ 0.9872      │
│ 4. Unseen Game Holdout (4 held out)  │ 16.58 FPS    │ 20.45 FPS    │ 0.6000      │
└──────────────────────────────────────┴──────────────┴──────────────┴─────────────┘
```

### Understanding the Evaluation Metrics
- **Mean Absolute Error (MAE)**: Measures average prediction error. An MAE of **1.69 FPS** means predictions differed from measured benchmarks by approximately 1.69 FPS on average. *(Note: MAE indicates average expected error, not a guaranteed absolute error bound).*
- **Root Mean Squared Error (RMSE)**: Penalizes larger outlier deviations. The low standard RMSE of **2.32 FPS** demonstrates consistent accuracy across the test distribution.
- **Coefficient of Determination ($R^2$)**: Represents the percentage of target variance explained by the model ($R^2 = 0.9982$ on standard holdout).

---

## Dataset Scope

- **Clean Observations**: 24,624 verified benchmark rows.
- **Unique CPUs**: 19 physical processors across architectures (Intel Core i3–i9, AMD Ryzen 3–7).
- **Unique GPUs**: 27 physical graphics cards (NVIDIA GTX 10-series, RTX 20/30-series; AMD RX 500, RX 5000/6000-series).
- **Unique Games**: 24 PC game titles.

*(Authoritative Note: Early documentation referenced 54 GPUs; data auditing confirmed that counted GPU/preset profile combinations rather than unique physical GPU silicon dies).*

---

## Current Model Limitations

1. **Native 1080p Scope**: Model V2 was trained and validated on native 1080p benchmark observations. 1440p and 4K estimations in the web interface utilize application-level baseline scaling rather than native higher-resolution ML training.
2. **Graphics Presets**: Native training encompasses Medium and Ultra presets; Low and High presets are normalized cleanly to corresponding ordinals.
3. **Training Catalog (24 Games)**: Untested game titles are supported via categorical one-hot unseen handling, but carry higher variance (MAE: 16.58 FPS). The UI explicitly labels these as `"⚠️ Estimated for an untested game"`.
4. **Estimation Nature**: Predictions represent statistical approximations under standard thermal and benchmark conditions, not a manufacturer-guaranteed framerate.

---

## Local Development & Installation

### Prerequisites
- **Node.js**: v18.0+ or v20.0+
- **Python**: v3.10+ or v3.13+
- **MongoDB**: MongoDB Atlas URI or local instance
- **npm** and **pip**

---

### 1. Python ML Microservice Setup
```bash
cd ai-python

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate      # On Windows
# source venv/bin/activate # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Start prediction server (Default: Port 5000)
python app.py
```

### 2. Node.js Backend API Setup
```bash
cd backend-node

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env and configure MongoDB URI & JWT Secret
cp .env.example .env

# Start Express server (Default: Port 4000)
node server.js
```

### 3. React Frontend Setup
```bash
cd frontend-react

# Install dependencies
npm install

# Start Vite development server (Default: Port 5173)
npm run dev
```

---

## Environment Variables

| Variable | Service | Description | Example |
| :--- | :--- | :--- | :--- |
| `PORT` | Backend | Express HTTP port | `4000` |
| `NODE_ENV` | Backend | Environment mode | `development` / `production` |
| `MONGO_URI` | Backend | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/...` |
| `JWT_SECRET` | Backend | Secret key for signing auth tokens | `your_jwt_secret_key` |
| `AURA_AI_URL` | Backend | Python ML service endpoint URL | `http://127.0.0.1:5000` |
| `MODEL_VERSION` | Backend / ML | Active model switch (`v2` or `v1`) | `v2` |
| `IGDB_CLIENT_ID` | Backend | Twitch Developer Client ID | `your_twitch_client_id` |
| `IGDB_CLIENT_SECRET` | Backend | Twitch Developer Client Secret | `your_twitch_client_secret` |
| `VITE_API_URL` | Frontend | Backend API base URL | `http://localhost:4000` |

---

## Model Version Configuration (Rollback Path)

Project Aura supports zero-downtime model switching via environment configuration:

- **`MODEL_VERSION=v2`** *(Default)*: Uses the physical-feature `HistGradientBoostingRegressor` model.
- **`MODEL_VERSION=v1`**: Rolls back to the legacy Random Forest baseline model without code modifications or database migrations.

---

## API Documentation

### 1. Predict Gaming FPS & Bottleneck
`POST /api/predict`

**Request Payload (Model V2)**:
```json
{
  "modelVersion": "v2",
  "GameName": "apexLegends",
  "GameSetting_Ordinal": 2,
  "CpuNumberOfCores": 6,
  "CpuNumberOfThreads": 6,
  "CpuFrequency": 3000,
  "CpuTurboClock": 4400,
  "CpuCacheL3": 9,
  "CpuTDP": 65,
  "GpuMemorySize": 6000,
  "GpuBandwidth": 336000,
  "GpuMemoryBus": 192,
  "GpuNumberOfShadingUnits": 1408,
  "GpuBaseClock": 1530,
  "GpuBoostClock": 1785,
  "GpuNumberOfROPs": 48,
  "GpuFP32Performance": 5027000
}
```

**Response (HTTP 200 OK)**:
```json
{
  "predictedFps": 98.42,
  "predicted_fps": 98.42,
  "modelVersion": "v2",
  "gameCoverage": "known",
  "resolution": "1080p",
  "preset": "Medium",
  "game": "apexLegends"
}
```

---

### 2. Hardware Autocomplete Search
`GET /api/hardware/cpus/search?q=7800X3D`  
`GET /api/hardware/gpus/search?q=4070`

**Response (HTTP 200 OK)**:
```json
{
  "count": 1,
  "data": [
    {
      "hardwareId": "amd_ryzen_7_7800x3d",
      "canonicalName": "AMD Ryzen 7 7800X3D",
      "slug": "amd-ryzen-7-7800x3d",
      "manufacturer": "AMD",
      "cores": { "total": 8, "threads": 16 },
      "clocks": { "baseClockGHz": 4.2, "boostClockGHz": 5.0 }
    }
  ]
}
```

---

### 3. User Authentication
`POST /api/auth/register` — Register new user  
`POST /api/auth/login` — Authenticate and receive JWT token

---

### 4. Saved Rigs (Protected)
`GET /api/user/rigs` — Retrieve user's saved PC builds  
`POST /api/user/rigs` — Save a new PC build  
`DELETE /api/user/rigs/:rigId` — Delete a saved PC build

---

## Project Structure

```
hardware-bottleneck-analyzer/
├── frontend-react/               # React 19 + Vite Frontend
│   ├── src/
│   │   ├── components/           # Navbar, Footer, Modals, Gauges
│   │   ├── constants/            # Routes, stores, hardware definitions
│   │   ├── hooks/                # useAuth, useHardwareData
│   │   ├── pages/                # BottleneckCalculatorPage, GamesPage, Compare, About
│   │   ├── services/             # apiClient, authService, analysisService, rigService
│   │   ├── utils/                # BottleneckLogic evaluation engine
│   │   ├── App.jsx               # Application root & client routing
│   │   └── index.css             # Dark gaming design system
│   └── package.json
│
├── backend-node/                 # Express 5 API Gateway
│   ├── config/                   # MongoDB connection logic
│   ├── middleware/               # JWT authentication & rate limiters
│   ├── models/                   # Mongoose schemas (User, Game, HardwareCpu, HardwareGpu)
│   ├── routes/                   # API routers (auth, user, hardware, predict, games)
│   ├── services/                 # Hardware Master & Model V2 feature resolver
│   ├── server.js                 # Express server entry point
│   └── package.json
│
├── ai-python/                    # Python Flask ML Microservice
│   ├── ml-model-v2/              # Model V2 Engineering
│   │   ├── data/                 # Raw & cleaned benchmark datasets
│   │   ├── experiments/          # Baseline candidate artifacts, error analysis & metrics
│   │   ├── audit_dataset.py      # Dataset auditing script
│   │   ├── prepare_dataset_v2.py # 16-feature dataset preparation
│   │   ├── train_model_v2.py     # Training & multi-protocol holdout evaluation
│   │   └── test_model_v2.py      # Pytest validation suite
│   ├── app.py                    # Flask dual-model prediction API (v1 & v2)
│   ├── project_aura.joblib       # Model V1 artifact (Rollback)
│   ├── ai_columns.joblib         # Model V1 feature schema
│   ├── test_app.py               # Model V1 endpoint tests
│   ├── test_model_v2_integration.py # Integration test suite
│   └── requirements.txt          # Python dependencies
│
├── docs/                         # Technical Architecture & Guides
│   ├── ARCHITECTURE.md           # System architecture specification
│   ├── INTERVIEW_GUIDE.md        # Technical interview reference & discussion guide
│   ├── RELEASE_CHECKLIST.md      # Production release checklist
│   ├── ML_DATASET_V2_AUDIT.md    # Machine learning dataset audit
│   └── DATASET_V2_SCHEMA.md      # Physical feature contract schema
│
├── .env.example                  # Environment template
├── .gitignore                    # Version control ignore definitions
└── README.md                     # Project documentation
```

---

## Dataset Attribution & External Sources

- **FPS Benchmark Data**: Empirical gaming benchmark measurements collected across verified PC hardware configurations. Used exclusively for educational, non-commercial machine learning modeling and performance evaluation.
- **Game Metadata**: Game titles, genres, cover imagery, and technical metadata provided via the [Internet Game Database (IGDB)](https://www.igdb.com/) API under Twitch OAuth developer terms.

---

## Technical Documentation & Guides

For in-depth technical specifications and interview preparation:
- [Technical Interview Guide](docs/INTERVIEW_GUIDE.md)
- [Production Release Checklist](docs/RELEASE_CHECKLIST.md)
- [ML Dataset V2 Audit](docs/ML_DATASET_V2_AUDIT.md)
- [Dataset V2 Physical Feature Schema](docs/DATASET_V2_SCHEMA.md)