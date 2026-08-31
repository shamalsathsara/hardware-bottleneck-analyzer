# Project Aura — ML-Powered PC Gaming Bottleneck Analyzer

> An intelligent, Machine Learning-driven PC hardware analysis platform that predicts gaming framerates (FPS), identifies CPU/GPU bottlenecks, recommends upgrade paths, and simulates PC builds.

---

## 📌 Overview

**Project Aura** empowers PC gamers, system builders, and hardware enthusiasts to evaluate component synergy and balance before investing in hardware. By combining a trained **Random Forest Machine Learning Regressor** with real-world hardware benchmark data, Project Aura estimates gaming framerates across multiple resolutions and isolates performance bottlenecks with fine-grained precision.

---

## 🏗️ System Architecture

Project Aura is organized as a decoupled, multi-service architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    React 19 + Vite Frontend                 │
│         (Client Routing, SEO Metadata, Dynamic UI)          │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Node.js + Express 5 API Gateway             │
│        (Auth, Security, Rate Limiting, Database CRUD)       │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────┐┌──────────────────────────────┐
│     MongoDB Atlas Cloud     ││    Python Flask AI Service   │
│  (CPUs, GPUs, Users, Rigs)  ││  (Random Forest Regressor)   │
└─────────────────────────────┘└──────────────────────────────┘
```

* **Frontend**: React 19, Vite, Vanilla CSS design system.
* **Backend API Gateway**: Node.js, Express 5, Mongoose 8.
* **Database**: MongoDB Atlas.
* **ML Microservice**: Python 3.13, Flask, scikit-learn, joblib, pandas.

---

## 📁 Repository Structure

```
hardware-bottleneck-analyzer/
├── frontend-react/               # React 19 + Vite User Interface
│   ├── public/                   # Static assets, robots.txt, sitemap.xml
│   ├── src/
│   │   ├── components/           # UI components (Navbar, Footer, Modals)
│   │   ├── constants/            # Hardware, routing, and store constants
│   │   ├── hooks/                # Custom state hooks (useAuth, useHardwareData)
│   │   ├── pages/                # Public and tool pages
│   │   ├── services/             # Centralized API service layer
│   │   ├── utils/                # Pure business logic (Bottleneck calculations)
│   │   ├── App.jsx               # Client application orchestrator
│   │   ├── index.css             # Unified dark gaming design system
│   │   └── main.jsx              # React DOM mounting
│   ├── package.json
│   └── vite.config.js
│
├── backend-node/                 # Express 5 API Gateway
│   ├── config/                   # Database connection configuration
│   ├── middleware/               # Auth verification & rate limiters
│   ├── models/                   # Mongoose schemas (User, Hardware)
│   ├── routes/                   # Modular API routers (auth, user, hardware, predict, pricing)
│   ├── utils/                    # ReDoS-safe regex escaping
│   ├── server.js                 # Express server entry point
│   ├── server.test.js            # Jest backend test suite
│   └── package.json
│
├── ai-python/                    # Flask Machine Learning Microservice
│   ├── ai_columns.joblib         # 71-dimension feature schema artifact
│   ├── project_aura.joblib       # Trained Random Forest model artifact
│   ├── preprocessing.py          # Input bounding, mapping, and one-hot encoding
│   ├── app.py                    # Flask REST API server
│   ├── test_app.py               # Pytest ML verification suite
│   └── requirements.txt          # Python dependencies
│
├── docs/                         # Technical Architecture Specifications
│   └── ARCHITECTURE.md
└── README.md
```

---

## 🚀 Local Development Setup

### Prerequisites
* **Node.js** (v18+ recommended)
* **Python** (v3.10+ recommended)
* **MongoDB Atlas** database connection URI

### 1. Start the Python AI Microservice
```bash
cd ai-python
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate      # On Windows
# source venv/bin/activate # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Run the Flask prediction server (Port 5000)
python app.py
```

### 2. Start the Node.js Backend API
```bash
cd backend-node

# Install dependencies
npm install

# Create environment configuration
# Copy .env.example or create .env with required keys (see below)

# Run the Express API server (Port 4000)
node server.js
```

### 3. Start the React Frontend
```bash
cd frontend-react

# Install dependencies
npm install

# Start the Vite development server (Port 5173)
npm run dev
```

---

## 🔑 Environment Variables

Create a `.env` file in `backend-node/`:

```env
PORT=4000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=aura
JWT_SECRET=your_jwt_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password_here
GEMINI_API_KEY=your_gemini_api_key_here
AURA_AI_URL=http://127.0.0.1:5000
```

*(Optional)* Create a `.env` file in `frontend-react/`:
```env
VITE_API_URL=http://localhost:4000
```

---

## 🧪 Testing Suite

### Backend Jest Tests (9 Suites)
```bash
cd backend-node
npm test
```

### Python ML Pytest Tests (5 Suites)
```bash
cd ai-python
venv\Scripts\python.exe -m pytest
```

### Frontend Linting & Build Verification
```bash
cd frontend-react
npm run lint
npm run build
```

---

## 🌐 Public Routes

| Path | Purpose | Access |
| :--- | :--- | :--- |
| `/` | Homepage & Feature Overview | Public |
| `/bottleneck-calculator` | Bottleneck & FPS Analyzer | Public |
| `/games` | PC Games Hardware Requirements Catalog | Public |
| `/games/:slug` | Detailed Game System Requirements & Tech Profile | Public |
| `/compare` | Side-by-Side PC Rig Comparison | Public |
| `/my-rigs` | Saved PC Builds Profile | Authenticated |
| `/about` | Mission & Architecture | Public |
| `/methodology` | ML Regression & Limitation Guide | Public |
| `/privacy` | Privacy Policy | Public |
| `/terms` | Terms of Service | Public |
| `/contact` | Contact & Inquiries | Public |
| `/auth` | Sign In / Sign Up / Password Reset | Public |
| `/quotation` | Sri Lankan Retail Hardware Quotation | Public |

---

## 🚦 Project Versions & Branches

* **`main`**: Verified stable release of Project Aura (Phases 01 & 02).
* **`V2`**: Cleaned, modularized foundation branch prepared for Phase 03 feature expansion.

---

## 🔮 Future Roadmap (Phase 03)

* **Game Database & Game-Aware FPS Modeling**: Specific framerate estimates for popular titles (Cyberpunk 2077, CS2, Valorant, GTA V, etc.).
* **"Can I Run It?" Validator**: Direct minimum and recommended system requirements checker.
* **Upgrade Advisor V2**: Algorithmic cost-to-performance recommendations with component compatibility checks.
* **Hardware Catalog**: Searchable, sortable browseable index for CPUs and GPUs.
* **1% Low Framerate Predictions**: Microservice expansion for frame stability estimates.