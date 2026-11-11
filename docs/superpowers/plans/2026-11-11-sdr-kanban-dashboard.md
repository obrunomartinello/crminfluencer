# Scout CRM v3.0 (SaaS Dashboard, CRM Kanban & Já Mandados) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reestruturar a experiência principal do Scout CRM em uma arquitetura SaaS inspirada no layout ZapData, separando claramente **Dashboard**, **CRM Kanban** (com guia passo-a-passo e alertas do que falta preencher), **Já Mandados** (painel e métricas de follow-up) e formulário editável completo no **InfluencerDrawer**, mantendo 100% do financeiro e minerador atuais funcionando.

**Architecture:** O backend Express (`server/db/store.js`, `server/routes/influencers.js`) ganha o status canônico `'Mensagem Enviada'`, rastreamento de canal/data de abordagem (`outreach_channel`, `contacted_at`, `last_contact_at`), filtro `stage` (`to_contact | sent | all`) e métricas de funil em `GET /api/influencers/stats`. O frontend React (`client/src/App.jsx`) adota navegação por sidebar lateral (`Sidebar.jsx`) e tema claro padrão estilo ZapData, renderizando `DashboardView`, `KanbanBoard` (com alternador para `InfluencerTable`), `SentLeadsView` e um `InfluencerDrawer` com todos os campos SDR editáveis.

**Tech Stack:** Node.js, Express 5, React 19, Vite 8, Tailwind CSS 3, Lucide Icons, Native Node `assert` tests, `oxlint`.

**Spec:** [2026-11-11-sdr-kanban-dashboard-design.md](file:///c:/Users/Bruno%20Martinello/.gemini/antigravity/scratch/pedrocrm/docs/superpowers/specs/2026-11-11-sdr-kanban-dashboard-design.md)

## Global Constraints
- Tema padrão inicial quando `localStorage.getItem('scout_theme')` estiver vazio passa a ser `'light'` (`--bg-app: #F5F5F7`, `--bg-card: #FFFFFF`, `--text-primary: #1D1D1F`), preservando toggle Claro/Escuro (`.dark`).
- Status canônicos incluem obrigatoriamente `'Mensagem Enviada'` ao lado dos status existentes do Pedro (`'Novo'`, `'Sem resposta'`, `'Em negociação'`, `'Fechou'`, `'Não interessado'`, `'Recusado - métricas ruins'`, `'Recusado - Remarketing'`, `'Outro momento'`).
- Todos os testes existentes (`test-async-mine.js`, `test-async-routes.js`, `test-filters-store.js`, `test-pedro-normalizer.js`, `test-v2-routes.js`, `test-search-v2.js`, `test-quota-keepalive.js`) devem continuar passando com saída `0`.
- Não fazer `git push` automático antes do usuário validar visualmente no `localhost`.

## Review Focus
- Alterar o status de `'Novo'` para `'Mensagem Enviada'` ou `'Sem resposta'` via tabela/Kanban/Drawer deve preencher `contacted_at` e `last_contact_at` automaticamente sem sobrescrever `contacted_at` em atualizações futuras.
- Re-minerar um influenciador já contatado (`upsertInfluencer` / `batch-sync`) não pode apagar `outreach_channel`, `contacted_at` nem `last_contact_at`.
- Mover um lead para `'Novo'` deve removê-lo da contagem/filtro `stage=sent` ("Já Mandados") e colocá-lo em `stage=to_contact` ("Para Abordar").
- Em uma base onde `sentTotalCount === 0`, `getStats()` deve retornar `responseRate: 0` (nunca `NaN` ou divisão por zero).
- Salvar no `InfluencerDrawer` com campos numéricos vazios (`story_views_avg`, `story_clicks_avg`, `story_asking_price`) ou WhatsApp editado deve persistir `0` ou `null` corretamente sem `NaN` no payload.

---

### Task 1: Backend SDR Pipeline (`outreach_channel`, `contacted_at`, `stage`, `Mensagem Enviada` & Funnel Stats)

**Files:**
- Modify: `server/routes/influencers.js:5-61`
- Modify: `server/db/store.js:97-290`
- Test: `test/test-v3-sdr-workflow.js`

**Interfaces:**
- Produces:
  - `store.getStats()` returns `{ ..., toContactCount, sentWaitingCount, sentTotalCount, repliedCount, responseRate, missingDataCount, channelCounts, publicidadesSummary }`
  - `store.listInfluencers({ ..., stage, channel, limit })` supports `stage: 'to_contact' | 'sent' | 'all'` and `channel: 'whatsapp' | 'instagram'`
  - `store.updateInfluencer(id, body)` auto-populates `contacted_at` and `last_contact_at` when transitioning out of `'Novo'` or setting `outreach_channel`
  - `PUT /api/influencers/:id` accepts `'Mensagem Enviada'`

- [ ] **Step 1: Write the failing test in `test/test-v3-sdr-workflow.js`**

Test covering: `'Mensagem Enviada'` accepted by `PUT /api/influencers/:id`, `contacted_at` & `last_contact_at` auto-timestamping, preservation on re-`upsertInfluencer`, `stage=to_contact` vs `stage=sent` filtering, `channel=whatsapp` filtering, `responseRate` math & zero-division guard, and editable SDR fields (`whatsapp`, `story_views_avg`, `story_clicks_avg`, `story_asking_price`, `campaign_game`).

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/test-v3-sdr-workflow.js`
Expected: FAIL (`PUT /api/influencers/:id` rejects `'Mensagem Enviada'` with 400 or missing `sentTotalCount` / `stage` filter).

- [ ] **Step 3: Implement backend pipeline changes in `server/routes/influencers.js` and `server/db/store.js`**

- Add `'Mensagem Enviada'` to `VALID_STATUSES` in `server/routes/influencers.js` and forward `stage` and `channel` from `req.query` in `GET /api/influencers`.
- Update `getStats()`, `listInfluencers()`, `updateInfluencer()`, and `upsertInfluencer()` in `server/db/store.js` cleanly.

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/test-v3-sdr-workflow.js`
Expected: `🎉 ALL V3.0 SDR WORKFLOW TESTS PASSED!`

- [ ] **Step 5: Commit**

```bash
git add server/routes/influencers.js server/db/store.js test/test-v3-sdr-workflow.js
git commit -m "feat: add SDR outreach pipeline stages, channel tracking, and funnel stats API"
```

---

### Task 2: Frontend Constants & API Client (`PEDRO_STATUSES` & `api.getInfluencers`)

**Files:**
- Modify: `client/src/constants/nichePresets.js:3-12`
- Modify: `client/src/lib/api.js:35-60`

**Interfaces:**
- Consumes: `GET /api/influencers?stage=...&channel=...`, `PUT /api/influencers/:id`
- Produces: `PEDRO_STATUSES` including `'Mensagem Enviada'`, `api.getInfluencers({ ..., stage, channel })`

- [ ] **Step 1: Update `PEDRO_STATUSES` in `client/src/constants/nichePresets.js` and query builder in `client/src/lib/api.js`**

Insert `'Mensagem Enviada'` right after `'Novo'` in `PEDRO_STATUSES`. Add `stage` and `channel` query parameter forwarding inside `api.getInfluencers`.

- [ ] **Step 2: Verify syntax with oxlint**

Run: `npm --prefix client run lint`
Expected: exit `0`.

- [ ] **Step 3: Commit**

```bash
git add client/src/constants/nichePresets.js client/src/lib/api.js
git commit -m "feat: expose Mensagem Enviada status and stage/channel filters in frontend API"
```

---

### Task 3: Editable SDR Drawer (`InfluencerDrawer.jsx`)

**Files:**
- Modify: `client/src/components/InfluencerDrawer.jsx:24-385`

**Interfaces:**
- Consumes: `onUpdate(id, body)`
- Produces: Complete editable SDR form inside `'Resumo & Preenchimento'` tab (`status`, `outreach_channel`, `whatsapp`, `campaign_game`, `story_views_avg`, `story_clicks_avg`, `story_asking_price`, `user_notes`, `is_ghost`) + 1-click **"Marcar como Mensagem Enviada"** quick bar + bio snippet preview.

- [ ] **Step 1: Add full SDR state synchronization and edit form inside `InfluencerDrawer.jsx`**

Initialize form state on `influencer` change (`whatsapp`, `status`, `outreachChannel`, `campaignGame`, `storyViews`, `storyClicks`, `askingPrice`, `notes`, `isGhost`). Normalize empty/numeric fields safely (`parseInt(...) || 0`, `parseFloat(...) || 0`). Add 1-click action buttons (`Via WhatsApp` / `Via Direct IG`) and unified **`Salvar Ficha Completa`** button with feedback banner.

- [ ] **Step 2: Verify lint & compile**

Run: `npm --prefix client run lint ; if ($LASTEXITCODE -eq 0) { npm --prefix client run build }`
Expected: exit `0`.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/InfluencerDrawer.jsx
git commit -m "feat: make all SDR metrics, WhatsApp, channel, and status editable in InfluencerDrawer"
```

---

### Task 4: ZapData-Style Dashboard (`DashboardView.jsx`)

**Files:**
- Create: `client/src/components/DashboardView.jsx`

**Interfaces:**
- Consumes: `stats` (`getStats()`), `onNavigateTab(tabId, optionalFilterPreset)`, `onMineClick()`
- Produces: 8 clickable KPI cards in clean 4×2 grid (`Falta Abordar`, `Já Mandados`, `Em Negociação`, `Parcerias Fechadas`, `Prontos c/ WhatsApp`, `Qualificados`, `Investido em Publis`, `Retorno / Lucro`) + bottom 2-column panels (**Funil de Captação & Envios** + **O Que Fazer Agora — Guia Rápido**).

- [ ] **Step 1: Create `client/src/components/DashboardView.jsx`**

Render top filter/action pills (`Visão Geral SDR`, `Ir para Fila Para Abordar`, `Ver Já Mandados`, `Minerar Criadores`), 4×2 clean white/surface cards with top-left icon and top-right trend/context badge, horizontal funnel bars, and live action checklist linking directly into `'kanban'` or `'sent'`.

- [ ] **Step 2: Verify lint**

Run: `npm --prefix client run lint`
Expected: exit `0`.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/DashboardView.jsx
git commit -m "feat: add ZapData-inspired SDR DashboardView with 4x2 KPI cards and funnel charts"
```

---

### Task 5: Visual CRM Kanban & Toggleable Table (`KanbanBoard.jsx`, `InfluencerTable.jsx`, `FilterBar.jsx`)

**Files:**
- Create: `client/src/components/KanbanBoard.jsx`
- Modify: `client/src/components/InfluencerTable.jsx:90-112, 412-430`

**Interfaces:**
- Consumes: `influencers`, `loading`, `onSelectInfluencer`, `onMarkSent(influencer, channel)`, `onStatusChange(id, nextStatus)`, `onCreatePublicidadeForInfluencer(influencer)`
- Produces: 4-column interactive Kanban (`Para Abordar` [`Novo`], `Msg Enviada` [`Mensagem Enviada`, `Sem resposta`], `Em Negociação` [`Em negociação`], `Fechou` [`Fechou`]) + optional drawer/column for `Remarketing / Recusados`, step-by-step operator guide (`1 → 2 → 3`), missing-data alert pills (`⚠ Falta WhatsApp`, `⚠ Falta Views`, `⚠ Falta Preço`), HTML5 drag-and-drop, 1-click channel selector (`WhatsApp` vs `Direct IG`) on **`Já Mandei Msg →`**, and clear **`Preencher Ficha`** button.
- Update `InfluencerTable.jsx` to highlight `'Mensagem Enviada'` badge color and replace tiny `Eye` button with an explicit **`Abrir Ficha`** button.

- [ ] **Step 1: Create `client/src/components/KanbanBoard.jsx` and enhance `InfluencerTable.jsx` badges/button**

Ensure mobile friendliness (column selector pills on small screens, scrollable 4-column grid on desktop).

- [ ] **Step 2: Verify lint & build**

Run: `npm --prefix client run lint ; if ($LASTEXITCODE -eq 0) { npm --prefix client run build }`
Expected: exit `0`.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/KanbanBoard.jsx client/src/components/InfluencerTable.jsx
git commit -m "feat: build visual SDR KanbanBoard with guided workflow and explicit card actions"
```

---

### Task 6: Painel Exclusivo "Já Mandados" (`SentLeadsView.jsx`) & SaaS Sidebar Shell (`Sidebar.jsx`, `App.jsx`)

**Files:**
- Create: `client/src/components/SentLeadsView.jsx`
- Create: `client/src/components/Sidebar.jsx`
- Modify: `client/src/App.jsx`

**Interfaces:**
- Consumes: `stats`, `api.getInfluencers`, `api.updateInfluencer`, `ApifyThermometer`
- Produces: Dedicated `'Já Mandados'` view (4 summary mini-cards + stage/channel filters + table with `contacted_at`, `outreach_channel`, status switcher, `Cobrar Whats`, `Abrir Ficha`), fixed left SaaS `Sidebar.jsx` with live badges (`Para Abordar`, `Já Mandados`), light theme default (`'light'`), Kanban/Lista switcher inside `CRM Kanban`, and complete integration in `App.jsx`.

- [ ] **Step 1: Create `client/src/components/SentLeadsView.jsx` and `client/src/components/Sidebar.jsx`**

- [ ] **Step 2: Reorganize `client/src/App.jsx` into SaaS Sidebar + Header + View Switcher (`dashboard` | `kanban` | `sent` | `publicidades` | `metas` | `importar`)**

Ensure `limit: 200` is used when loading `kanban` so all columns show real leads accurately, keep `scout_mined_cache_v2` hydration, `ApifyThermometer`, `DB Online` badge, and refresh stats + list on every status/channel update or mining completion.

- [ ] **Step 3: Full Verification (All 8 Backend Tests + Oxlint + Production Build) & Start Localhost**

Run all backend tests including `test/test-v3-sdr-workflow.js`, `npm --prefix client run lint`, and `npm --prefix client run build`. Commit final UI work locally (WITHOUT pushing to git!). Launch `npm run dev` in background (`IsDaemon: true`) and curl `http://127.0.0.1:3001/api/health` + `http://127.0.0.1:5173` to confirm localhost is up and healthy for user review.
