# Lead Management & Search Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Scout CRM into a complete operational lead management hub with manual registration, financial tracking (Paid vs. Returned ROI), enhanced table columns, and lightweight, non-blocking Apify search ingestion.

**Architecture:** Extend the Supabase PostgreSQL schema with financial tracking fields (`paid_amount`, `revenue_generated`), optimize backend mining to decouple scraping from serial link inspection (avoiding Vercel timeouts and preserving all leads for SDR evaluation in-app), build a manual lead creation modal (`CreateLeadModal.jsx`), and upgrade `InfluencerTable.jsx` with financial ROI metrics and operational notes.

**Tech Stack:** React 19, Vite 5, Tailwind CSS, Lucide React, Express 5, Supabase PostgreSQL, Apify Client.

---

## Global Constraints

- Preserve Apple-inspired Dark and Light mode design system.
- Never discard leads at the API gateway; calculate scores and tags in-memory so the SDR can filter visually inside the CRM.
- Keep Vite client build passing with 0 errors.
- Support both snake_case and camelCase fields in API responses.

---

### Task 1: Database Schema Expansion (Supabase)

**Files:**
- Modify: `server/db/schema.sql`
- Script: `server/db/store.js`

- [ ] **Step 1: Update schema.sql with financial tracking columns**
  - Add `paid_amount NUMERIC(10,2) DEFAULT 0`
  - Add `revenue_generated NUMERIC(10,2) DEFAULT 0`
  - Add `last_campaign_date DATE`

- [ ] **Step 2: Apply migration to Supabase PostgreSQL table via node script**
  - Run SQL alter table statements to ensure columns exist in `public.influencers`.

- [ ] **Step 3: Verify Supabase insert with new fields**
  - Test inserting a lead with `paid_amount` and `revenue_generated` and reading it back.

---

### Task 2: Backend Search Optimization & Resilient Ingestion

**Files:**
- Modify: `server/routes/mine.js`
- Modify: `server/services/apify.js`
- Modify: `server/db/store.js`

- [ ] **Step 1: Remove blocking serial Linktree inspection from `/api/mine`**
  - Do not run 20 sequential HTTP scrapes inside the mining request.
  - Ingest the basic profile and lookalike data directly in seconds.

- [ ] **Step 2: Ensure all mined profiles are stored in Supabase with tags and score**
  - Ensure `calculateScore` scores all leads without dropping them.

- [ ] **Step 3: Test mining endpoint locally**
  - Verify `/api/mine` returns in < 8s without timeout.

---

### Task 3: Manual Lead Registration Modal (`CreateLeadModal.jsx`)

**Files:**
- Create: `client/src/components/CreateLeadModal.jsx`
- Modify: `client/src/components/FilterBar.jsx`
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Build `CreateLeadModal.jsx`**
  - Inputs for: `@username`, `full_name`, `followers_count`, `whatsapp`, `story_views_avg`, `paid_amount`, `revenue_generated`, `user_notes`, `status`.
  - Auto-calculates net profit/ROI in real time (`revenue_generated - paid_amount`).

- [ ] **Step 2: Add "+ Adicionar Criador" button to `FilterBar.jsx`**
  - Connect to open the modal.

- [ ] **Step 3: Wire submission in `App.jsx` with `api.createInfluencer`**
  - Refresh stats and table on save.

---

### Task 4: Upgraded Table Columns (`InfluencerTable.jsx`)

**Files:**
- Modify: `client/src/components/InfluencerTable.jsx`

- [ ] **Step 1: Add Financeiro do Pedro column**
  - Display `Pago: R$ ...`
  - Display `Voltou: R$ ...`
  - Display Lucro Real badge (green for profit, red for loss).

- [ ] **Step 2: Add Metrics & Observações columns**
  - Display Stories Views & Estimated clicks.
  - Display preview of user notes.

- [ ] **Step 3: Test interactive editing and responsive layout**

---

### Task 5: Build Verification & Push to GitHub / Vercel

- [ ] **Step 1: Run Vite production build (`npm run build`)**
- [ ] **Step 2: Commit all changes**
- [ ] **Step 3: Push to `main` branch on GitHub**
