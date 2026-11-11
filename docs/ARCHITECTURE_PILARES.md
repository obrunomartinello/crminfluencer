# 🏗️ Arquitetura em Pilares — Jackpot CRM (Operação Pedro `.bet.br`)

Este documento organiza **todo o código** em **5 Pilares claros** (Frontend + Backend + Banco de Dados), para que qualquer pedido por áudio, ajuste visual ou investigação de bug aponte exatamente para os arquivos daquele pilar.

---

## 🗄️ PILAR 1 — Banco de Dados & Persistência Supabase
> *"Os leads não salvaram, sumiram depois de reiniciar, deu erro de coluna no banco, ou quero checar as tabelas."*

- **Responsabilidade:** Conexão com Supabase (`@supabase/supabase-js`), hidratação na inicialização do servidor, persistência real (create/update/upsert/delete), fallback híbrido para colunas/tabelas ainda não migradas e cálculo dos placares do CRM.
- **Arquivos:**
  - `server/db/supabase.js` — Instancia o cliente Supabase via `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
  - `server/db/store.js` — Store central com hidratação automática (`ensureInitialized`), sincronização no Supabase (`persistInfluencerToSupabase`, `deleteInfluencerFromSupabase`, `publicidades`, `metas`), estatísticas (`getStats`) e filtro `stage=mined`.
  - `server/db/schema.sql` — Script SQL idempotente para criar/atualizar `influencers`, `publicidades`, `metas`, índices e permissões.
  - `server/routes/influencers.js` — Endpoints REST (`/api/influencers`, `/stats`, `/batch-sync`, `/profile/:username`).

---

## 🔍 PILAR 2 — Motor de Busca, Apify & Score SDR
> *"A busca está repetindo os mesmos criadores, deu erro na Apify, quero ver quanto falta de cota gratuita ou ajustar a nota OURO/PRATA."*

- **Responsabilidade:** Varredura em 2 fases na Apify (`instagram-search-scraper` modo `hybrid` + `instagram-profile-scraper`), rotação anti-repetição, extração de WhatsApp na bio/link, cálculo de Score e termômetro da cota mensal ($5 Free Tier).
- **Arquivos:**
  - `server/services/apify.js` — Integração Apify (`buildSearchInput`, `extractCreatorsFromSearchItems`, `getQuotaStatus` com cache de 60s).
  - `server/services/scoring.js` — Classificação (`OURO`, `PRATA`, `BRONZE`, etc.) e detecção de agência/rifa/Shopee.
  - `server/services/whatsapp.js` — Extrator de telefone/link wa.me/WhatsApp.
  - `server/routes/mine.js` — Job stateless assíncrono (`/api/mine/start`, `/api/mine/status/:jobId`, `/api/mine/quota`).
  - `server/routes/inspect.js` — Extração manual de link/bio.
  - `client/src/components/MineModal.jsx` — Roleta/modal de mineração, presets por nicho e resultados.
  - `client/src/components/ApifyThermometer.jsx` — Termômetro visual dos créditos restantes na Apify.

---

## 🎯 PILAR 3 — Funil SDR: Aba Minerados, CRM Kanban, Já Mandados & Ficha
> *"Quero mudar os cards do Kanban, arrumar a aba Minerados por data, mexer nos scripts de abordagem ou nos botões da Ficha."*

- **Responsabilidade:** Fluxo diário de prospecção do Pedro: lista datada/numerada dos leads minerados com rastro de movimentação, quadro Kanban + Lista filtrável, painel exclusivo de mensagens já enviadas e Ficha completa do influenciador.
- **Arquivos:**
  - `client/src/components/MinedLeadsView.jsx` — Aba `💎 Minerados` agrupada por data (`Hoje`, `Ontem`, `Esta Semana`, `Semana Passada`, `Anteriores`), numerada (`#1`, `#2`...) e com rastro (`Estava em Minerados → Foi p/...`).
  - `client/src/components/KanbanBoard.jsx` — Quadro Kanban (`Para Abordar`, `Msg Enviada`, `Em Negociação`, `Fechou`, `Remarketing`).
  - `client/src/components/SentLeadsView.jsx` — Aba `🚀 Já Mandados` focada em WhatsApp/Direct + follow-up.
  - `client/src/components/InfluencerDrawer.jsx` — Drawer lateral ("Ficha") com abas **Dados SDR**, **Publicidades**, **Metas** e **Scripts de Abordagem**.
  - `client/src/components/InfluencerTable.jsx` & `FilterBar.jsx` — Visualização em tabela e filtros rápidos.
  - `client/src/components/CreateLeadModal.jsx` — Modal `+ Novo Lead` (cadastro manual).
  - `client/src/constants/nichePresets.js` — Lista oficial `PEDRO_STATUSES` e presets de nichos.

---

## 💰 PILAR 4 — Financeiro: Publicidades & Metas de Depositantes
> *"O botão de editar publicidade bugou, o cálculo de ROI/CPA precisa mudar, ou as metas de depositantes (FTDs) não estão batendo."*

- **Responsabilidade:** Controle de contratos, jogos (`Block Win`, `Bubble Win`, `Cust Win`, `Count Masters`), investimento, comissão de indicação, retorno/ROI e barra de progresso das metas de depositantes.
- **Arquivos:**
  - `server/routes/publicidades.js` & `server/routes/metas.js` — Endpoints REST financeiros (`/api/publicidades`, `/api/metas`, `/increment`).
  - `client/src/components/PublicidadesView.jsx` — Tabela financeira, filtros por jogo/pagamento/entrega e totalizadores.
  - `client/src/components/CreatePublicidadeModal.jsx` — Modal de criação e edição de publicidades.
  - `client/src/components/MetasView.jsx` — Painel de metas combinadas (depositantes alcançados vs meta).
  - `client/src/components/AddDepositantesModal.jsx` — Modal para somar depositantes (`+1`, `+5`, etc.).

---

## 🛡️ PILAR 5 — Infraestrutura, Keepalive Supabase, Planilhas & Visual Jackpot
> *"O Supabase dormiu de novo, quero mudar a logo/cores/emojis, importar planilha Excel ou alterar o Dashboard."*

- **Responsabilidade:** Servidor Express, proxy Vercel + Cron diário anti-hibernação do Supabase (`/api/health` e `/api/cron/keepalive`), importação/exportação das planilhas do Pedro e casca visual **Jackpot CRM** (tema, logo, favicon, Dashboard, navegação).
- **Arquivos:**
  - `server/index.js` & `vercel.json` — Servidor Express + regras de roteamento e cron keepalive.
  - `server/services/importer.js` & `server/routes/import.js` — Seed histórico das planilhas do Pedro + normalizadores e preview/exportação CSV.
  - `client/src/App.jsx` & `client/src/lib/api.js` — Shell principal, cabeçalho, controle de abas/títulos e cliente HTTP `/api`.
  - `client/src/components/Sidebar.jsx` — Menu lateral com badges em tempo real e mini placar da mesa.
  - `client/src/components/DashboardView.jsx` — Dashboard principal estilo Casa VIP com atalhos.
  - `client/src/components/ImportView.jsx` — Tela de backup/importação/restauração da planilha do Pedro.
  - `client/src/components/BrandLogo.jsx` & `client/public/favicon.svg` & `client/src/index.css` — Logomarca, favicon e tema/animações Jackpot.
