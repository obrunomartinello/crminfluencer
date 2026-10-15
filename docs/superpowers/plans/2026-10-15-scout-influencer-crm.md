# Scout Influencer CRM v1.0 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack influencer CRM with Apify-powered mining, Linktree scraping, automatic scoring, and a dark-mode React dashboard with WhatsApp pitch dispatch.

**Architecture:** Monorepo with `client/` (React 19 + Vite + Tailwind) and `server/` (Express) running concurrently. Backend exposes a REST API on port 3001; Vite proxies `/api/*` in dev. Supabase PostgreSQL is the only data store; Apify client is the external scraping dependency.

**Tech Stack:** React 19, Vite 5, Tailwind CSS v3, Lucide React, Inter font, Express 4, `@supabase/supabase-js`, `apify-client`, `axios`, `cheerio`, `concurrently`

**Spec:** `docs/superpowers/specs/2026-10-15-scout-influencer-crm-design.md`

## Global Constraints

- Node.js ≥ 20
- All env vars sourced from `.env` via `dotenv` — never hardcoded
- `APIFY_TOKEN` is optional; absence triggers mock data path, never crashes
- Supabase RLS disabled for `influencers` table; GRANT ALL to anon/authenticated/service_role
- Score penalizes bots first (engagement_rate < 2% with followers > 10k → score=10, LIXO), then applies additive rules
- Dark mode always on (class `dark` on `<html>`), font Inter, Apple-style design tokens
- All API responses: `{ data, error }` envelope; HTTP 4xx/5xx on failure
- Commit after every task

## Review Focus

1. **Apify actor field mapping** — different actors return different field names; the mapper must handle missing fields gracefully (null-coalesce everything), otherwise scoring breaks silently.
2. **Regex phone extraction on Linktree** — Brazilian numbers with/without +55, spaces, and dashes must all normalize to `5511999998888` format; a bug here loses WhatsApp leads silently.
3. **Upsert conflict on username** — `POST /api/mine` must use Supabase `upsert` with `onConflict: 'username'` to avoid duplicate key errors on re-mining the same hashtag.
4. **Score edge case: 0 followers** — `followers_count = 0` causes division-by-zero in engagement_rate calculation; guard against it.
5. **WhatsApp URL encoding** — the pitch message passed to `wa.me` must be fully `encodeURIComponent`-encoded; unencoded newlines or special chars break the link silently.

---

### Task 1: Project Scaffold & Root Config

**Files:**
- Create: `package.json` (root)
- Create: `.env.example`
- Create: `.gitignore`
- Create: `server/package.json`
- Create: `client/` (Vite scaffold via `npm create vite@latest`)

**Interfaces:**
- Produces: `npm run dev` starts both server and client concurrently

- [ ] **Step 1: Write `.env.example`**

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
APIFY_TOKEN=
APIFY_ACTOR_ID=apify/instagram-hashtag-scraper
PORT=3001
```

- [ ] **Step 2: Write root `package.json`**

```json
{
  "name": "pedrocrm",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "node server/index.js",
    "client": "npm --prefix client run dev",
    "build": "npm --prefix client run build",
    "start": "node server/index.js"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

- [ ] **Step 3: Write `.gitignore`**

Include: `node_modules/`, `client/node_modules/`, `.env`, `dist/`, `client/dist/`

- [ ] **Step 4: Scaffold Vite React client**

Run: `npm create vite@latest client -- --template react` inside `pedrocrm/`

- [ ] **Step 5: Install client dependencies**

Run inside `client/`: `npm install`
Then add: `npm install -D tailwindcss@3 postcss autoprefixer`
And: `npm install lucide-react`

- [ ] **Step 6: Configure Tailwind**

Run inside `client/`: `npx tailwindcss init -p`

`client/tailwind.config.js`:
```js
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { inter: ['Inter', 'sans-serif'] },
      colors: {
        apple: {
          bg: '#000000',
          surface: '#1C1C1E',
          card: '#2C2C2E',
          border: 'rgba(255,255,255,0.08)',
          blue: '#0A84FF',
          green: '#30D158',
          red: '#FF453A',
          yellow: '#FFD60A',
          text: '#FFFFFF',
          muted: 'rgba(255,255,255,0.55)',
        }
      }
    }
  },
  plugins: []
}
```

- [ ] **Step 7: Add Inter font + Tailwind directives to `client/src/index.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

html { font-family: 'Inter', sans-serif; }
```

- [ ] **Step 8: Configure Vite proxy in `client/vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:3001' }
  }
})
```

- [ ] **Step 9: Set dark class on `<html>` in `client/index.html`**

Add `class="dark"` to `<html>` tag.

- [ ] **Step 10: Install server dependencies**

Create `server/package.json`:
```json
{ "name": "pedrocrm-server", "private": true, "type": "commonjs" }
```
Run inside `server/`: `npm install express dotenv @supabase/supabase-js apify-client axios cheerio cors`

- [ ] **Step 11: Verify scaffold**

Run `npm install` at root. Confirm no errors. Do NOT start servers yet.

- [ ] **Step 12: Commit**

```bash
git add .
git commit -m "chore: project scaffold, Vite client, Tailwind, env config"
```

---

### Task 2: Supabase Client + Database Schema

**Files:**
- Create: `server/db/supabase.js`
- Create: `server/db/schema.sql` (reference file, paste into Supabase SQL Editor)

**Interfaces:**
- Produces: `supabase` — singleton Supabase client, default export from `server/db/supabase.js`

- [ ] **Step 1: Write `server/db/supabase.js`**

```js
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

module.exports = supabase
```

- [ ] **Step 2: Write `server/db/schema.sql`**

Full CREATE TABLE statement from spec Section 4, including DISABLE ROW LEVEL SECURITY and GRANT ALL.

- [ ] **Step 3: Verify client instantiation**

Create scratch script `server/db/test-connection.js`:
```js
const sb = require('./supabase')
sb.from('influencers').select('count').then(console.log).catch(console.error)
```
Run: `node server/db/test-connection.js` (requires `.env` with real Supabase creds)
Expected: `{ data: [{ count: '0' }], error: null }` or similar
Then delete the scratch script.

- [ ] **Step 4: Commit**

```bash
git add server/db/
git commit -m "feat: Supabase client singleton and schema SQL"
```

---

### Task 3: Scoring Service

**Files:**
- Create: `server/services/scoring.js`

**Interfaces:**
- Consumes: influencer object with `followers_count: number`, `engagement_rate: number`, `whatsapp: string|null`, `has_competitor: boolean`
- Produces: `calculateScore(influencer) → { score: number, classification: 'OURO'|'PRATA'|'BRONZE'|'LIXO' }`

- [ ] **Step 1: Write `server/services/scoring.js`**

Implement `calculateScore(inf)`:
1. Guard: if `inf.followers_count <= 0`, treat `engagement_rate = 0`
2. Bot check: if `inf.followers_count > 10_000 && inf.engagement_rate < 2` → return `{ score: 10, classification: 'LIXO' }`
3. Initialize `score = 0`
4. `if followers_count >= 10_000 && followers_count <= 120_000` → `score += 30`
5. `if engagement_rate >= 15` → `score += 35`
6. `if whatsapp` → `score += 20`
7. `if !has_competitor` → `score += 15`
8. Classification: `score >= 75` → OURO; `>= 50` → PRATA; `>= 30` → BRONZE; else LIXO
9. Return `{ score, classification }`

- [ ] **Step 2: Manually verify key cases**

Write inline assertions at bottom of file behind `if (require.main === module)`:
- `{ followers_count: 50000, engagement_rate: 20, whatsapp: '5511999', has_competitor: false }` → score 100, OURO
- `{ followers_count: 50000, engagement_rate: 0.5, whatsapp: null, has_competitor: true }` → score 10, LIXO (bot penalty)
- `{ followers_count: 5000, engagement_rate: 10, whatsapp: null, has_competitor: true }` → score 0, LIXO
- `{ followers_count: 0, engagement_rate: 0, whatsapp: null, has_competitor: false }` → no crash, score 15, BRONZE

Run: `node server/services/scoring.js`
Expected: no assertion failures

- [ ] **Step 3: Commit**

```bash
git add server/services/scoring.js
git commit -m "feat: scoring service with bot-penalty and classification logic"
```

---

### Task 4: Linktree Inspection Service

**Files:**
- Create: `server/services/linktree.js`

**Interfaces:**
- Consumes: `url: string`
- Produces: `inspectLink(url) → Promise<{ whatsapp: string|null, hasCompetitor: boolean, competitorName: string|null }>`

- [ ] **Step 1: Write `server/services/linktree.js`**

Competitor list: `blaze`, `betano`, `estrela bet`, `superbet`, `novibet`, `bet365`, `sportingbet`, `parimatch`, `betnacional`, `pixbet`, `realsbet`, `vai de bet`, `galera bet`, `cassino`, `.bet.br`

WhatsApp patterns to match:
- `wa.me/` or `api.whatsapp.com/send` in hrefs
- Brazilian phone regex: `(?:\+?55\s?)?\(?([1-9]{2})\)?\s?(9[0-9]{4})[-\s]?([0-9]{4})`

Normalize extracted phone to pure digits `55XXXXXXXXXXX`. Use axios with 8s timeout. Cheerio to parse. Catch all errors silently.

- [ ] **Step 2: Manual smoke test**

Add `if (require.main === module)` block calling `inspectLink('https://linktr.ee/test')` and logging result.
Run: `node server/services/linktree.js`
Expected: no crash, result object logged.
Remove test block after verification.

- [ ] **Step 3: Commit**

```bash
git add server/services/linktree.js
git commit -m "feat: linktree inspection service — WhatsApp + competitor detection"
```

---

### Task 5: Apify Mining Service

**Files:**
- Create: `server/services/apify.js`

**Interfaces:**
- Consumes: `query: string, count: number`
- Produces: `runMiningActor(query, count) → Promise<influencer[]>` where each influencer has schema fields

- [ ] **Step 1: Write mock data constant**

5 realistic mock influencers covering all classification buckets (OURO, PRATA, BRONZE, LIXO, LIXO-bot), with varied followers, engagement, some with whatsapp, some with has_competitor.

- [ ] **Step 2: Write field mapper `mapActorResult(item)`**

Maps Apify actor output to influencer schema. Null-coalesce every field.
`avg_reels_views`: compute from `latestReels` array if present, else 0.
`engagement_rate`: `followers > 0 ? Math.round((avgViews / followers) * 10000) / 100 : 0`

- [ ] **Step 3: Write `runMiningActor(query, count)`**

If `!process.env.APIFY_TOKEN`, warn to console and return `MOCK_INFLUENCERS.slice(0, count)`.
Else: `ApifyClient({ token })` → `actor(actorId).call({ hashtags: [query], resultsLimit: count })` → `dataset(run.defaultDatasetId).listItems()` → `items.map(mapActorResult).filter(i => i.username)`

- [ ] **Step 4: Verify mock path**

Call function without APIFY_TOKEN, log output.
Expected: 5 mock objects, no crash.

- [ ] **Step 5: Commit**

```bash
git add server/services/apify.js
git commit -m "feat: Apify mining service with mock fallback"
```

---

### Task 6: Express Server + All API Routes

**Files:**
- Create: `server/index.js`
- Create: `server/routes/influencers.js`
- Create: `server/routes/mine.js`
- Create: `server/routes/inspect.js`

**Interfaces:**
- Consumes: `supabase` (Task 2), `calculateScore` (Task 3), `inspectLink` (Task 4), `runMiningActor` (Task 5)
- Produces: REST API on port 3001

- [ ] **Step 1: Write `server/index.js`**

Setup Express with cors, json body parser, mount routes at `/api/influencers`, `/api/mine`, `/api/inspect-link`. Listen on `process.env.PORT || 3001`.

- [ ] **Step 2: Write `server/routes/influencers.js`**

`GET /` — query params: `search`, `status`, `classification`, `page=1`, `limit=20`.
Build Supabase query with `.ilike`, `.eq`, `.range`, `.order('score', { ascending: false })`.
Return `{ data, total, page, totalPages, error: null }`.

`GET /stats` — query all rows (select classification, status, whatsapp only), compute 5 KPI counts, return `{ total, qualified, whatsapps, negotiating, closed }`. Mount BEFORE `/:id`.

`POST /` — validate username; calculateScore; upsert; return record.

`PUT /:id` — validate status/classification if provided; update; return record.

`DELETE /:id` — delete; return `{ success: true }`.

- [ ] **Step 3: Write `server/routes/mine.js`**

`POST /` — validate query and count (1–100).
`runMiningActor(query, count)` → for each: `inspectLink(external_url)` → merge → `calculateScore(enriched)` → upsert with `onConflict: 'username'`.
Return `{ imported: n, skipped: 0 }`.

- [ ] **Step 4: Write `server/routes/inspect.js`**

`POST /` — validate url; `inspectLink(url)`; return result.

- [ ] **Step 5: Smoke test API**

Run `node server/index.js`.
```bash
curl -X POST http://localhost:3001/api/mine -H "Content-Type: application/json" -d "{\"query\":\"futebol\",\"count\":5}"
```
Expected: `{ imported: 5, skipped: 0 }` (mock path)

```bash
curl http://localhost:3001/api/influencers
```
Expected: `{ data: [...], total: 5, page: 1, totalPages: 1 }`

```bash
curl http://localhost:3001/api/influencers/stats
```
Expected: `{ total: 5, qualified: N, whatsapps: N, negotiating: N, closed: N }`

- [ ] **Step 6: Commit**

```bash
git add server/
git commit -m "feat: Express server with all API routes — influencers, mine, inspect-link, stats"
```

---

### Task 7: API Client + App Shell (React)

**Files:**
- Create: `client/src/lib/api.js`
- Modify: `client/src/App.jsx`
- Modify: `client/src/main.jsx`

**Interfaces:**
- Produces: `api.getInfluencers(filters)`, `api.getStats()`, `api.createInfluencer(data)`, `api.updateInfluencer(id, data)`, `api.deleteInfluencer(id)`, `api.mine(query, count)`, `api.inspectLink(url)`
- Produces: `App` component with state: `influencers[]`, `total`, `page`, `filters`, `loading`, `selectedInfluencer`, `stats`, `mineModalOpen`

- [ ] **Step 1: Write `client/src/lib/api.js`**

One function per endpoint. All return `response.json()`. `getInfluencers` builds URLSearchParams from filters object.

- [ ] **Step 2: Write `client/src/App.jsx` shell**

State variables listed above. `useEffect` on filters/page → `api.getInfluencers` → set state. Separate `useEffect` for stats. Dark background layout container. Import and render placeholder `<div>` for each component slot.

- [ ] **Step 3: Verify app loads**

Run `npm run dev` (root). Open `http://localhost:5173`.
Expected: dark background (#000), no console errors, page title "Scout CRM".

- [ ] **Step 4: Commit**

```bash
git add client/src/
git commit -m "feat: React app shell and API client"
```

---

### Task 8: KPICards Component

**Files:**
- Create: `client/src/components/KPICards.jsx`

**Interfaces:**
- Consumes: `stats: { total, qualified, whatsapps, negotiating, closed }`
- Produces: `<KPICards stats={stats} />` — 5 metric cards

- [ ] **Step 1: Write `KPICards.jsx`**

5 cards in a responsive grid (`grid-cols-2 lg:grid-cols-5`). Each: `bg-apple-card rounded-2xl p-5 border border-apple-border`. Lucide icons: Users, Star, Phone, TrendingUp, CheckCircle2. Large bold number, label in muted text below.

- [ ] **Step 2: Wire into `App.jsx`**

Pass `stats` prop. Verify 5 cards render.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/KPICards.jsx
git commit -m "feat: KPICards dashboard metrics component"
```

---

### Task 9: FilterBar + MineModal Components

**Files:**
- Create: `client/src/components/FilterBar.jsx`
- Create: `client/src/components/MineModal.jsx`

**Interfaces:**
- `FilterBar` consumes: `filters`, `onFilterChange(key, value)`, `onMineClick()`
- `MineModal` consumes: `open`, `onClose()`, `onMine(query, count) → Promise<{ imported, skipped }>`

- [ ] **Step 1: Write `FilterBar.jsx`**

Row: text input (debounce 300ms with `useRef` for timeout), two `<select>` dropdowns (Status options: Todos/Novo/Qualificado/Abordado/Negociando/Fechado/Desqualificado; Classificação: Todas/OURO/PRATA/BRONZE/LIXO), button "⚡ Minerar" styled `bg-apple-blue text-white rounded-xl px-4 py-2`.

- [ ] **Step 2: Write `MineModal.jsx`**

Overlay `fixed inset-0 bg-black/60 backdrop-blur-sm z-50`. Card `bg-apple-surface rounded-2xl p-6 w-[400px]`. Input for hashtag, number input 10–100 (default 25). Submit button. On submit: show spinner (`animate-spin` on Lucide Loader2), await `onMine`, then show result `"✅ {imported} perfis importados"` for 3s, then close.

- [ ] **Step 3: Wire into `App.jsx`**

`onMine` = `async (q, c) => { const r = await api.mine(q, c); await refreshInfluencers(); await refreshStats(); return r; }`

- [ ] **Step 4: Commit**

```bash
git add client/src/components/FilterBar.jsx client/src/components/MineModal.jsx
git commit -m "feat: FilterBar with debounce and MineModal for Apify mining"
```

---

### Task 10: InfluencerTable Component

**Files:**
- Create: `client/src/components/InfluencerTable.jsx`

**Interfaces:**
- Consumes: `influencers[]`, `total`, `page`, `totalPages`, `onPageChange(n)`, `onSelectInfluencer(inf)`, `onStatusChange(id, status)`
- Produces: paginated table with all 9 columns, inline status select, row click opens drawer

- [ ] **Step 1: Write `InfluencerTable.jsx`**

Table with `bg-apple-surface` header row. Columns:

1. **Avatar** — `<img src={profile_pic_url} className="w-9 h-9 rounded-full object-cover">` with fallback initials div if no URL
2. **@Username** — `<a href="https://instagram.com/{username}" target="_blank">` in apple-blue
3. **Seguidores** — `Intl.NumberFormat('pt-BR').format(n)`
4. **Avg Views** — same formatter
5. **Engajamento** — badge `rounded-full px-2 py-0.5 text-xs font-medium`: green if ≥15%, yellow 5-14%, red <5%
6. **WhatsApp** — Phone icon (apple-green) if present, `—` if not
7. **Bio Status** — badge: `"🌱 Virgem"` (green) or `"⚔️ {competitorName}"` (red)
8. **Score** — number + classification badge: OURO=`bg-yellow-500/20 text-yellow-300`, PRATA=`bg-gray-400/20 text-gray-300`, BRONZE=`bg-orange-700/20 text-orange-400`, LIXO=`bg-red-900/20 text-red-400`
9. **Status** — `<select>` inline, `onChange` → `onStatusChange(id, value)`. Styled dark.

Pagination: `flex justify-center gap-1 mt-4`. Buttons with `bg-apple-blue` for current page.

- [ ] **Step 2: Wire into `App.jsx`**

`onStatusChange` optimistically updates local state then calls `api.updateInfluencer(id, { status })`.
Row click or eye icon → `setSelectedInfluencer(inf)`.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/InfluencerTable.jsx
git commit -m "feat: InfluencerTable with badges, pagination, and inline status change"
```

---

### Task 11: InfluencerDrawer Component

**Files:**
- Create: `client/src/components/InfluencerDrawer.jsx`

**Interfaces:**
- Consumes: `influencer: object|null`, `onClose()`, `onUpdate(id, data)`
- Produces: slide-in drawer at `w-[480px]` from the right

- [ ] **Step 1: Write pitch generator (pure function inside file)**

```js
function generatePitch(inf) {
  const name = inf.full_name || inf.username
  const followers = Intl.NumberFormat('pt-BR').format(inf.followers_count)
  if (inf.has_competitor) {
    return `Olá ${name}! Vi que você já trabalha com apostas — incrível!\n\nTemos um programa CPA/RevShare que supera o que você ganha hoje. Podemos te mostrar os números reais?\n\nQualquer dúvida, é só chamar! 🚀`
  }
  return `Olá ${name}! Sua audiência de ${followers} seguidores tem um potencial enorme de monetização.\n\nTrabalhamos com uma marca 100% regulamentada .bet.br e pagamos CPA ou RevShare. Sem exclusividade, sem burocracia.\n\nQuer saber mais? 💎`
}
```

- [ ] **Step 2: Write `InfluencerDrawer.jsx`**

Container: `fixed inset-y-0 right-0 w-[480px] bg-apple-surface border-l border-apple-border shadow-2xl overflow-y-auto transition-transform duration-300 z-40`. When `influencer` is null: `translate-x-full`; else `translate-x-0`.

Sections (top to bottom, padded 24px):
1. Header: profile pic 64px circle + name + @username + Instagram link + X close button (top-right)
2. Score row: large score number + classification badge
3. Metrics 2x3 grid: Seguidores / Following / Posts / Avg Views / Engajamento / Bio Status
4. Bio text (if present)
5. Notas: `<textarea className="w-full bg-apple-card rounded-xl p-3 text-sm resize-none h-24">`, `onBlur` → `onUpdate(id, { user_notes: value })`
6. Pitch section: label + readonly `<textarea>` with generated pitch + copy button (uses `navigator.clipboard.writeText(pitch)`, show "Copiado!" briefly)
7. WhatsApp button (only if whatsapp set): `<a>` with `href="https://wa.me/${inf.whatsapp}?text=${encodeURIComponent(pitch)}"` target `_blank`, styled green

- [ ] **Step 3: Wire into `App.jsx`**

`onUpdate(id, data)` calls `api.updateInfluencer(id, data)` and updates `influencers` list in place.
`onClose` → `setSelectedInfluencer(null)`.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/InfluencerDrawer.jsx
git commit -m "feat: InfluencerDrawer with pitch generator and WhatsApp dispatch"
```

---

### Task 12: Visual Polish Pass

**Files:**
- Modify: `client/src/App.jsx` (layout, header, spacing)
- Modify: any component needing visual fixes

- [ ] **Step 1: Add app header**

`<header className="border-b border-apple-border px-8 py-4 flex items-center justify-between">` with logo text "Scout CRM" and tagline "Mineração Inteligente de Influenciadores".

- [ ] **Step 2: Full visual QA checklist**

- [ ] Dark mode everywhere — no white backgrounds
- [ ] Inter font rendering on all text
- [ ] All badges correct colors
- [ ] Drawer slide animation works (translate transitions)
- [ ] WhatsApp URL format: `wa.me/55XXXXXXXXXXX?text=...`
- [ ] Pitch `encodeURIComponent` tested with newlines and accented chars
- [ ] MineModal spinner and success message
- [ ] Pagination navigates and highlights active page
- [ ] Notes textarea saves on blur (check network tab for PUT call)
- [ ] Status dropdown change fires PUT call
- [ ] Mobile/tablet breakpoints: table scrolls horizontally on small screens (`overflow-x-auto`)

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat: Scout Influencer CRM v1.0 complete — visual polish and QA pass"
```

---

### Task 13: README & Setup Instructions

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

Sections:
1. **O que é** — 2 linhas sobre o CRM
2. **Pré-requisitos** — Node 20+, conta Supabase, token Apify (opcional)
3. **Setup do banco** — copiar `server/db/schema.sql` no SQL Editor do Supabase e executar
4. **Configuração** — copiar `.env.example` → `.env`, preencher SUPABASE_URL, SUPABASE_ANON_KEY, opcionalmente APIFY_TOKEN e APIFY_ACTOR_ID
5. **Instalação**:
   ```bash
   npm install          # root
   npm install --prefix client    # frontend
   npm install --prefix server    # backend
   ```
6. **Rodar**: `npm run dev` — abre `http://localhost:5173`
7. **Sem Apify** — funciona com 5 perfis mock; com token real, usar hashtags: `apostas`, `futebol`, `cassino`
8. **Rotas da API** — tabela com os 6 endpoints

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README with setup instructions"
```
