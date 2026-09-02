# Project Aura V2: Game Data Source Strategy & Large Catalog Specification

> **Version:** 2.1.1B  
> **Status:** Production-Ready  
> **Primary Game Metadata Source:** IGDB (Internet Game Database via Twitch OAuth 2.0)

---

## 1. Executive Summary & Large Sync Architecture

Project Aura is evolving into a global PC gaming performance platform. This specification establishes the architecture for scalable catalog ingestion, multi-batch pagination, bounded-memory bulk operations, checkpointing, and field ownership protection.

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
│               Multi-Batch Sync Service                  │
│       (Bounded Memory, bulkWrite, Atomic Checkpoint)    │
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

## 2. Data Coverage States & Hierarchy

To prevent false claims of performance data, Project Aura enforces four distinct coverage states:

| Coverage State | Meaning | Database Indicator | Frontend Badge |
| :--- | :--- | :--- | :--- |
| **1. CATALOG LISTED** | Game metadata exists (title, release year, genres, platforms, cover art). System requirements and performance observations are uncollected. | `dataQuality: 'metadata_only'` | *"Requirements Available"* / Base Profile |
| **2. REQUIREMENTS AVAILABLE** | System requirements collected from store pages or publisher materials, awaiting verification. | `dataQuality: 'requirements_available'` | *"Requirements Available"* |
| **3. OFFICIAL SPECS VERIFIED** | Hardware requirements confirmed by the Project Aura team against official developer publications. | `dataQuality: 'verified'`, `requirementsVerified: true` | *"✓ Official Verified Specs"* |
| **4. BENCHMARK OBSERVED** | Real-world hardware framerate observations recorded in dedicated benchmark collection (Future V2.2+). | Linked `GameBenchmark` records | *"Tested On Real Hardware"* |

---

## 3. Large Sync Pagination & Deterministic Ordering

1. **Deterministic Ordering:** IGDB API queries use `where platforms = (6) & rating_count != null; sort rating_count desc;`. Rating count indexing provides stable result ordering across pagination offsets.
2. **Bounded Batches:** Large jobs are partitioned into discrete chunks of 50–100 games (`--batch-size=50`).
3. **Bounded Memory:** Temporary game data from each batch is mapped, written, and garbage-collected before requesting the next batch. Memory consumption stays flat regardless of whether 100 or 10,000 games are processed.
4. **Rate Limit Safety Pacing:** A 250ms pause is enforced between consecutive batch requests to keep overall API request velocity well within IGDB's 4 requests/second limit.

---

## 4. Checkpoint & Resume Architecture

Synchronization state is persisted atomically after each batch in `backend-node/data/igdb_sync_checkpoint.json`:

```json
{
  "syncRunId": "sync_20260902141500_a1b2c3",
  "mode": "initial",
  "requestedLimit": 1000,
  "batchSize": 50,
  "currentOffset": 250,
  "processedTotal": 250,
  "createdTotal": 220,
  "updatedTotal": 30,
  "skippedTotal": 0,
  "failedTotal": 0,
  "batchesCompleted": 5,
  "status": "in_progress",
  "startedAt": "2026-09-02T08:45:00.000Z",
  "updatedAt": "2026-09-02T08:47:30.000Z",
  "completedAt": null,
  "lastError": null
}
```

### Checkpoint Lifecycle Rules
- **Strict Post-Write Saving:** Checkpoints are updated ONLY AFTER a batch's MongoDB writes succeed.
- **Failed Batch Isolation:** If a batch fails (network error, rate-limit, or MongoDB error), the checkpoint remains at the previous successful offset.
- **Interruption Safety:** Handlers for `SIGINT` (Ctrl+C) and `SIGTERM` allow the active batch to complete, save state with `status: 'interrupted'`, and exit gracefully.
- **Resuming:** Running `npm run games:sync -- --resume` automatically reads the checkpoint and resumes from the exact saved offset.

---

## 5. Field Ownership & Reconciliation Strategy

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

## 6. CLI Commands & Execution Examples

```bash
# 1. Preview / Dry Run (200 games across 4 batches of 50)
npm run games:sync -- --limit=200 --batch-size=50 --dry-run

# 2. Live Large Ingestion (200 games)
npm run games:sync -- --limit=200 --batch-size=50

# 3. Resume previous interrupted or stopped sync
npm run games:sync -- --resume

# 4. Fresh sync (clears existing checkpoint and starts from offset 0)
npm run games:sync -- --limit=500 --batch-size=50 --fresh

# 5. Incremental sync (only refreshes metadata for already-imported games)
npm run games:sync -- --mode=incremental
```

---

## 7. Future Scheduled Ingestion (Roadmap)

When automated synchronization is introduced in future milestones:
- **Nightly Incremental Sync:** `npm run games:sync -- --mode=incremental` will run off-peak to refresh metadata and new releases.
- **Weekly Catalog Discovery:** `npm run games:sync -- --limit=500` will discover newly trending PC releases.
