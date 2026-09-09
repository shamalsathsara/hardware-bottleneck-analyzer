# Project Aura V2 — Production Release & Deployment Checklist

> Pre-flight verification checklist for publishing, deploying, and validating Project Aura V2 in staging and production environments.

---

## 1. Environment & Infrastructure Configuration

- [ ] **Environment variables configured** (`.env` populated from `.env.example` in `backend-node/` and `frontend-react/`)
- [ ] **MongoDB production database configured** (MongoDB Atlas cluster connection string tested and IP access lists whitelisted)
- [ ] **Twitch/IGDB credentials configured** (`IGDB_CLIENT_ID` and `IGDB_CLIENT_SECRET` active for game metadata synchronization)
- [ ] **MODEL_VERSION configured** (`MODEL_VERSION=v2` set for default HistGradientBoosting inference)
- [ ] **CORS production origin configured** (Allowed frontend origin explicitly set in `backend-node/server.js`)
- [ ] **Port bindings verified** (Node.js API on PORT `4000`, Python ML Service on PORT `5000`, Frontend on production CDN / web server)

---

## 2. Service Deployment & Health Verification

- [ ] **Backend deployed** (Node.js runtime active with process supervisor like PM2 / container orchestration)
- [ ] **Python ML service deployed** (Flask / Gunicorn service running with `scikit-learn`, `joblib`, `pandas`)
- [ ] **Frontend deployed** (Static bundle built via `npm run build` hosted on Vercel, Netlify, or Nginx)
- [ ] **Health endpoints verified**:
  - [ ] `GET /health` on Python ML microservice returns `{"status": "healthy", "models": {"v1_available": true, "v2_available": true}}`
  - [ ] Node.js backend responds to `/api/hardware/stats`

---

## 3. End-to-End Functional Smoke Tests

- [ ] **Authentication tested**:
  - [ ] User registration with input validation
  - [ ] User login returning valid JWT
  - [ ] Protected route access (`/api/user/rigs`)
  - [ ] User logout and state cleanup
- [ ] **Known-game prediction tested** (e.g., Apex Legends on i5-9500 + GTX 1660 Super returns Model V2 output with `gameCoverage: "known"`)
- [ ] **Unseen-game prediction tested** (e.g., Forza Horizon 5 returns Model V2 output with `gameCoverage: "unseen"` and UI disclaimer)
- [ ] **Hardware search & resolution tested** (Autocomplete queries for CPUs and GPUs resolve to Hardware Master records)
- [ ] **Save/Load Rig tested** (Saving a rig to user profile, refreshing, and loading into calculator)
- [ ] **Compare Rigs tested** (Side-by-side comparison executes without `NaN` or layout clipping)
- [ ] **Game Catalog verified** (Browsing games, genre filtering, and single-game detail views)

---

## 4. Security, Hygiene & Release Audit

- [ ] **No secrets committed** (Zero API keys, JWT secrets, or DB passwords in version control history)
- [ ] **README reviewed** (Root documentation accurate, with updated ML pipeline and architecture details)
- [ ] **Model V1 rollback path verified** (Tested `MODEL_VERSION=v1` fallback functionality)
- [ ] **Production smoke test complete** (Zero uncaught frontend console errors or 500 API responses during standard user journey)
