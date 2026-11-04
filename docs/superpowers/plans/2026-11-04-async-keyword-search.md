# Async Keyword Search & In-CRM SDR Qualification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an asynchronous Instagram keyword search engine using `apify/instagram-search-scraper` that prevents Vercel serverless 504 timeouts, ingests all mined leads into Supabase/store without dropping records, and provides in-CRM SDR qualification (15k+ followers filter, anti-agency badges, Lead Score ranking).

**Architecture:** 
1. Decouple search scraping from HTTP response: `POST /api/mine/start` calls `client.actor('apify/instagram-search-scraper').start()` and returns immediately (`<500ms`) with `{ jobId, runId, status: 'RUNNING' }`.
2. Asynchronous job status & batch ingest: `GET /api/mine/status/:jobId` checks Apify run state. When finished (`SUCCEEDED`), it pulls dataset items, executes zero-latency bio/link enrichment (`fastInspectBio` + `calculateScore`), bulk upserts into Supabase/store, and returns `{ status: 'COMPLETED', imported, profiles }`.
3. Frontend integration: `MineModal.jsx` supports freeform keywords + active niche presets, displaying a non-blocking progress tracker.
4. In-CRM SDR filtering: `FilterBar.jsx` and `InfluencerTable.jsx` gain an audience tier selector (`Todos`, `15k+`, `50k+`, `100k+`), auto-ranking by Lead Score and highlighting autênticos vs agências.

**Tech Stack:** Node.js, Express, Apify SDK (`apify-client`), Supabase JS Client / In-memory Store, React (Vite), TailwindCSS, Lucide-react.

## Global Constraints
- Do not drop or gatekeep leads during API scraping; all discovered profiles must enter the database.
- Keep all synchronous HTTP endpoints on Vercel under 5 seconds execution time to avoid 504 Gateway Timeouts.
- Maintain resilient fallback in `server/db/store.js` if Supabase DNS is temporarily unreachable.
- Frontend must build cleanly with 0 errors (`npm --prefix client run build`).

---

### Task 1: Backend Asynchronous Mining Engine (`services/apify.js` & `routes/mine.js`)

**Files:**
- Modify: `server/services/apify.js`
- Modify: `server/routes/mine.js`
- Create test script: `test/test-async-mine.js`

**Interfaces:**
- `startKeywordSearch(keyword, limit)` -> returns `{ jobId, runId, status: 'RUNNING' }`
- `checkMiningJob(jobId)` -> returns `{ status: 'RUNNING' | 'COMPLETED' | 'FAILED', imported: number }`

- [ ] **Step 1: Write integration test script `test/test-async-mine.js` verifying async start and status polling.**
- [ ] **Step 2: Update `server/services/apify.js` to map `apify/instagram-search-scraper` output fields (`username`, `fullName`, `biography`, `followersCount`, `externalUrl`, `latestPosts`, `videoViewCount`).**
- [ ] **Step 3: Update `server/routes/mine.js` with `POST /api/mine/start` and `GET /api/mine/status/:jobId`.**
- [ ] **Step 4: Run test script to verify async start and complete polling.**
- [ ] **Step 5: Commit changes with message `feat(backend): add async keyword search and job polling`.**

---

### Task 2: Frontend Mining Modal with Keyword Presets & Live Polling (`MineModal.jsx` & `api.js`)

**Files:**
- Modify: `client/src/lib/api.js`
- Modify: `client/src/constants/nichePresets.js`
- Modify: `client/src/components/MineModal.jsx`

**Interfaces:**
- `api.startMine(query, count)` -> calls `POST /api/mine/start`
- `api.getMineStatus(jobId)` -> calls `GET /api/mine/status/:jobId`

- [ ] **Step 1: Add `startMine` and `getMineStatus` methods in `client/src/lib/api.js`.**
- [ ] **Step 2: Update `client/src/constants/nichePresets.js` with realistic, high-converting keyword search terms (e.g. `"humor nordeste"`, `"sinuca brasil"`, `"futebol varzea"`, `"grau de rua"`, `"churrasco sertao"`).**
- [ ] **Step 3: Refactor `client/src/components/MineModal.jsx` to initiate the async job and poll status every 2.5s with a progress animation, auto-closing and refreshing on completion.**
- [ ] **Step 4: Verify build with `npm --prefix client run build`.**
- [ ] **Step 5: Commit changes with message `feat(client): add async keyword mining modal with live polling`.**

---

### Task 3: In-CRM SDR Filter & Audience Qualification (`FilterBar.jsx` & `InfluencerTable.jsx`)

**Files:**
- Modify: `client/src/components/FilterBar.jsx`
- Modify: `client/src/components/InfluencerTable.jsx`
- Modify: `client/src/App.jsx`

**Interfaces:**
- `filters.minFollowers`: `0` | `15000` | `50000` | `100000`
- `filters.hideAgencies`: boolean

- [ ] **Step 1: Add Audience Tier dropdown (`Todos`, `15k+ Recomendado`, `50k+`, `100k+`) and `Ocultar Agências` toggle in `FilterBar.jsx`.**
- [ ] **Step 2: Connect new filters in `client/src/App.jsx` to pass down and filter the dataset client-side and server-side.**
- [ ] **Step 3: Update `InfluencerTable.jsx` to display SDR visual badges (`15k+ Lead Potencial`, `Agência`, `Rifa`, `Competidor Detectado`).**
- [ ] **Step 4: Run Vite build and verify end-to-end.**
- [ ] **Step 5: Commit changes with message `feat(crm): add in-system SDR qualification and audience filters`.**

---

### Task 4: End-to-End Verification and Push to GitHub

**Files:**
- Entire repository

- [ ] **Step 1: Run comprehensive tests on local server and verify keyword search execution.**
- [ ] **Step 2: Build client assets and ensure 0 compilation errors.**
- [ ] **Step 3: Git push to `origin/main` for Vercel deployment.**
