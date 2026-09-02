# Project Aura V2: Game Data Source Strategy & Architecture Specification

> **Version:** 2.1.1  
> **Status:** Active  
> **Primary Game Metadata Source:** IGDB (Internet Game Database via Twitch OAuth 2.0)

---

## 1. Executive Summary

Project Aura is evolving into a global PC gaming performance platform. This specification establishes the architecture for external catalog ingestion, data source isolation, metadata provenance, and data layer separation.

```
┌─────────────────────────────────────────────────────────┐
│                    IGDB (Twitch API)                    │
└────────────────────────────┬────────────────────────────┘
                             │ (Apicalypse HTTP API)
                             ▼
┌─────────────────────────────────────────────────────────┐
│              Backend IGDB Client & Auth                 │
│         (Token Caching, 429 Backoff, 5xx Retry)         │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│             Mapping & Normalization Layer               │
│         (PC Platform Filter, Safe Slug Parsing)         │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│               Controlled Sync Service                   │
│        (Field Ownership & Duplicate Reconciliation)     │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│              MongoDB Game Collection                    │
│      (Project Aura Internal Source of Truth)            │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                Project Aura REST API                    │
│        (/api/games, /api/games/search, /api/games/:slug)│
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   React Frontend                        │
└─────────────────────────────────────────────────────────┘
```

**Crucial Architecture Rule:** Runtime client requests NEVER connect directly to IGDB. Users search and browse from Project Aura's indexed MongoDB database. IGDB acts strictly as a background ingestion/synchronization source.

---

## 2. Data Layer Separation

To maintain architectural integrity, Project Aura strictly separates three distinct data layers:

| Layer | Responsibility | Primary Source | Mutation Rules |
| :--- | :--- | :--- | :--- |
| **Game Metadata** | Title, release year, developer, publisher, genres, platforms, cover images. | **IGDB** | Synced and refreshed via background sync scripts. |
| **System Requirements** | Minimum & recommended CPU, GPU, VRAM, RAM, Storage, OS, DirectX. | **Official Dev Specs / Steam / Curated** | Manually verified or enriched via store APIs. **Never overwritten by basic metadata sync.** |
| **FPS Benchmark Data** | Real-world hardware framerate observations (FPS, 1% Lows, Settings). | **Dedicated Benchmarks Collection** | Kept separate from game documents; never hallucinated or synthetically fabricated. |

---

## 3. IGDB Authentication & Security

1. **Protocol:** Twitch OAuth 2.0 Client Credentials Flow (`POST https://id.twitch.tv/oauth2/token`).
2. **Secrets Storage:** Strictly backend environment variables:
   - `IGDB_CLIENT_ID`
   - `IGDB_CLIENT_SECRET`
3. **Zero Frontend Exposure:** Credentials must never be prefixed with `VITE_` or exposed in React builds, client bundles, network responses, error messages, or logs.
4. **In-Memory Token Cache:** Tokens are cached in `igdbAuth.js`. Expiry is calculated with a safety buffer of 60 seconds (`expiresAt = Date.now() + (expires_in - 60) * 1000`).
5. **No Per-Request Auth:** OAuth tokens are reused across calls until expiration or invalidation.

---

## 4. Resilience & Rate-Limit Strategy

All external communication is centralized in `backend-node/services/igdb/igdbClient.js`:

* **Request Timeout:** Configurable 10,000 ms timeout per HTTP request.
* **401 Unauthorized Recovery:** If an access token is revoked or rejected, the client invalidates its in-memory cache and transparently retries once with a fresh token.
* **429 Rate-Limit Backoff:** Uses `Retry-After` response headers or exponential backoff to pause and retry without crashing.
* **5xx Transient Error Retry:** Up to 3 retries with exponential backoff (`delay = 500ms * 2^attempt`).
* **Failure Isolation:** An IGDB outage will only cause catalog sync scripts to report failure; it will **never crash** the Project Aura API, database, or ML prediction services.

---

## 5. PC Platform Filtering

Project Aura is focused on PC gaming performance. Catalog ingestion filters out console-exclusive and mobile-only titles using official IGDB platform identifiers:

```javascript
const IGDB_PLATFORM_IDS = {
  WINDOWS: 6, // PC (Microsoft Windows)
  LINUX: 3,   // Linux
  MAC: 14,    // Mac / macOS
};
```

Apicalypse query filter:
```
where platforms = (6) & category = (0, 8, 9, 10) & first_release_date != null & total_rating_count != null;
sort total_rating_count desc;
```
* **Category 0:** Main Game
* **Category 8:** Remake
* **Category 9:** Remaster
* **Category 10:** Expanded Game

---

## 6. Field Ownership & Reconciliation Strategy

To protect manually curated game entries (e.g. Cyberpunk 2077, GTA V, The Witcher 3), the synchronization engine enforces strict field ownership:

### Field Ownership Matrix

| Field | Owner | Updated during IGDB Sync? |
| :--- | :--- | :--- |
| `name`, `alternateNames` | IGDB / Shared | Yes (Merged/Updated) |
| `slug` | Project Aura | Reconciled (Adheres to `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`) |
| `developer`, `publisher` | IGDB | Yes (if provided) |
| `releaseDate`, `releaseYear` | IGDB | Yes |
| `genres`, `platforms` | IGDB | Yes (Merged) |
| `thumbnailUrl` | IGDB | Yes |
| `externalIds.igdb` | IGDB | Yes |
| `metadataSource`, `metadataLastSyncedAt` | IGDB | Yes (`'igdb'`, current timestamp) |
| `requirements.minimum` | **Project Aura / Manual** | **NO — Preserved** |
| `requirements.recommended` | **Project Aura / Manual** | **NO — Preserved** |
| `dataSource` (verification flags) | **Project Aura / Manual** | **NO — Preserved** |
| `performanceProfile` (RT/DLSS/FSR) | **Project Aura / Manual** | **NO — Preserved** |
| `seo` | **Project Aura / Manual** | **NO — Preserved** |

### Duplicate Reconciliation Priority
1. **Match by `externalIds.igdb`**: If an existing record already has this IGDB ID, update its metadata fields.
2. **Match by exact normalized `slug`**: If an existing record shares the exact slug (e.g. `cyberpunk-2077`), link the IGDB ID and safely merge metadata without overwriting requirements.
3. **No Match**: Insert a new record with `dataQuality: 'metadata_only'`.
4. **Fuzzy Matches**: Never auto-merge ambiguous titles (e.g. Game vs Game Remastered). Flag for review instead of destructive overwrites.

---

## 7. Synchronization Commands

Execute sync through npm scripts in `backend-node`:

```bash
# Dry Run (Preview mappings and actions without writing to MongoDB)
npm run games:sync -- --limit=50 --dry-run

# Live Ingestion (Upsert 50 games into MongoDB)
npm run games:sync -- --limit=50

# Offset / Pagination
npm run games:sync -- --limit=50 --offset=50

# Incremental Mode (Only updates metadata for already-imported games)
npm run games:sync -- --mode=incremental
```

---

## 8. Future Data Sources (Roadmap V2.2+)

| Source | Target Phase | Planned Purpose |
| :--- | :--- | :--- |
| **Steam Store API** | V2.2 | Official PC system requirements extraction, Steam AppIDs, player counts. |
| **PCGamingWiki** | V2.2 | PC-specific graphics engine features (FOV, ultrawide, frame limiters, HDR). |
| **Master Hardware DB** | V2.3 | Exhaustive CPU/GPU hardware database with clock speeds, architecture, TDP. |
| **Dataset V2 Benchmarks**| V2.3 | Multi-resolution verified real-world framerate samples. |
