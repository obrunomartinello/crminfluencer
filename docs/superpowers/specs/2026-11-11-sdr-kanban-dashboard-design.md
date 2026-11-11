# Design Spec: Scout CRM v3.0 — Painel SaaS, Dashboard SDR, Kanban Visual & Fila "Já Mandados"

**Data:** 2026-11-11  
**Status:** Rascunho para Revisão  
**Referência Visual:** Layout SaaS estilo ZapData (sidebar lateral com badges, grade de KPIs 4×2 limpa em tema claro padrão com opção escura, painéis analíticos inferiores) + Kanban visual por etapas do funil.

---

## 1. Problema & Objetivo

Atualmente a aba **Captação SDR** exibe todos os 99+ leads (novos, já abordados, em negociação, fechados e recusados) misturados em uma única tabela plana (`InfluencerTable.jsx`), com KPIs estáticos no topo e apenas um ícone discreto de olho (`Eye`) para abrir o perfil — cujo Drawer (`InfluencerDrawer.jsx`) só permite editar observações (`user_notes`) e `Ghost`, sem campos visíveis para editar WhatsApp, métricas de Stories, preço pedido ou marcar que uma mensagem já foi enviada.

**Objetivos principais:**
1. **Separar visualmente e operacionalmente** o que ainda **falta abordar** (`Novo`) do que **já foi mandado** (`Mensagem Enviada`, `Sem resposta`, `Em negociação`, `Fechou`, `Remarketing/Recusados`).
2. **Dar uma entrada gerencial clara ("Dashboard")** com grade 4×2 de cards clicáveis + badges + gráficos do funil de envios/conversão.
3. **Transformar o trabalho diário em "CRM Kanban"** intuitivo com faixa guiada `1 → 2 → 3`, cards autoexplicativos, alertas amarelos do que falta preencher e botões explícitos de próximo passo (`Mandar WhatsApp`, `Já Mandei Msg →`, `Preencher Ficha`).
4. **Criar o painel dedicado "Já Mandados"** para acompanhar abordagens enviadas, taxa de resposta, canal utilizado (`WhatsApp` ou `Instagram DM`), data do último contato e cobrar follow-up em 1 clique.
5. **Tornar editáveis dentro do `InfluencerDrawer`** todos os campos necessários da rotina SDR (`status`, `whatsapp`, `outreach_channel`, `story_views_avg`, `story_clicks_avg`, `story_asking_price`, `campaign_game`, `user_notes`, `is_ghost`).

---

## 2. Arquitetura de Navegação & Tema Visual

### 2.1 Tema Padrão (Estilo ZapData)
- O tema inicial passa a ser **`light`** (`--bg-app: #F5F5F7`, `--bg-surface: #FFFFFF`, `--bg-card: #FFFFFF`, `--border-color: #E5E5EA`, `--text-primary: #1D1D1F`) caso `localStorage.getItem('scout_theme')` ainda não exista, mantendo integralmente o botão de alternância Claro/Escuro (`.dark`).

### 2.2 Shell SaaS com Sidebar Lateral (`client/src/components/Sidebar.jsx`)
Substitui as abas horizontais do cabeçalho atual por uma barra lateral esquerda fixa (`w-60` no desktop, drawer/menu no mobile):

- **Topo da Sidebar:** Logotipo `Scout CRM` + resumo da operação (`Operação .bet.br • 4 jogos`).
- **Grupo 1 — Prospecção SDR:**
  - `Dashboard` (`tab: 'dashboard'`) — Visão geral e métricas do funil (página inicial).
  - `CRM Kanban` (`tab: 'kanban'`) — Quadro visual em colunas + alternador para lista; **badge** com total de leads na fila **`Para Abordar`**.
  - `Já Mandados` (`tab: 'sent'`) — Painel exclusivo de mensagens enviadas, follow-up e taxa de resposta; **badge** com total de leads já abordados aguardando/em andamento.
- **Grupo 2 — Operação & Financeiro (preservado):**
  - `Publicidades` (`tab: 'publicidades'`) — Controle financeiro e ROI.
  - `Metas` (`tab: 'metas'`) — Metas de depositantes.
  - `Planilhas` (`tab: 'importar'`) — Importação & Exportação.
- **Barra Superior do Conteúdo (`Header`):**
  - Título dinâmico + subtítulo explicativo da tela ativa.
  - `ApifyThermometer` (compacto), badge `DB Online` / `Modo Local/Cache`, toggle `Claro/Escuro`, botão `+ Novo Lead` e botão destaque `Minerar Criadores`.

---

## 3. Modelo de Dados & Backend (`server/db/store.js`, `server/routes/influencers.js`)

### 3.1 Novo Status Canônico e Campos de Abordagem
- Adicionado o status **`'Mensagem Enviada'`** em `PEDRO_STATUSES` e `VALID_STATUSES` para representar explicitamente o lead recém-abordado antes de virar `'Sem resposta'`, `'Em negociação'` ou `'Fechou'`.
- Novos campos opcionais por influenciador (retrocompatíveis com os 99 seeds existentes):
  - `outreach_channel`: `'whatsapp' | 'instagram' | null`
  - `contacted_at`: ISO timestamp do 1º contato realizado
  - `last_contact_at`: ISO timestamp do último contato/follow-up registrado
- **Auto-preenchimento inteligente no `store.updateInfluencer`:**
  - Quando `status` muda de `'Novo'` para qualquer status pós-abordagem (`'Mensagem Enviada'`, `'Sem resposta'`, `'Em negociação'`, `'Fechou'`, `'Não interessado'`, `'Recusado - métricas ruins'`, `'Recusado - Remarketing'`, `'Outro momento'`), se `contacted_at` ainda estiver vazio, grava automaticamente `contacted_at = now` e `last_contact_at = now`.
  - Se o operador voltar o lead para `'Novo'`, mantém histórico apenas se explicitamente mantido ou limpa conforme payload.
  - Se `outreach_channel` for enviado (`'whatsapp'` ou `'instagram'`), atualiza também `last_contact_at = now`.
- **`store.upsertInfluencer`:** ao atualizar um lead via nova mineração, preserva `outreach_channel`, `contacted_at` e `last_contact_at` existentes.

### 3.2 Expansão de `/api/influencers/stats` e `/api/influencers`
- `store.getStats()` passa a incluir também:
  - `toContactCount`: leads com `status === 'Novo'`
  - `sentWaitingCount`: leads com `status === 'Mensagem Enviada'` ou `status === 'Sem resposta'`
  - `sentTotalCount`: todos os leads com `status !== 'Novo'` (já abordados em qualquer etapa posterior)
  - `repliedCount`: leads em `'Em negociação'` ou `'Fechou'` ou `'Recusado - Remarketing'` ou `'Outro momento'` ou `'Não interessado'` (qualquer retorno pós-envio)
  - `responseRate`: percentual `(repliedCount / sentTotalCount) * 100` (arredondado em 1 casa, `0` quando `sentTotalCount === 0`)
  - `missingDataCount`: leads em `Novo` / `Em negociação` sem `whatsapp` ou sem `story_views_avg` preenchido
  - `channelCounts`: `{ whatsapp: N, instagram: N, unspecified: N }`
  - `publicidadesSummary`: resumo financeiro enxuto (`totalInvested`, `totalReturn`, `netProfit`, `overallRoi`) para alimentar a linha 2 do Dashboard sem duplicar lógica.
- `store.listInfluencers()` aceita filtro adicional:
  - `stage`: `'to_contact'` (`status === 'Novo'`), `'sent'` (`status !== 'Novo'`), ou `'all'` (padrão)
  - `channel`: `'whatsapp' | 'instagram'` (filtra por `outreach_channel`)
  - `limit`: suporta até `200` para carregar todas as colunas no modo Kanban sem perder cards.

---

## 4. Detalhamento das Novas Telas (Frontend)

### 4.1 Tela `Dashboard` (`client/src/components/DashboardView.jsx`)
Visual limpo estilo ZapData:
1. **Barra de Ação & Contexto no Topo:**
   - Pills rápidas: `Visão Geral SDR` | `Apenas Minerados` + botões rápidos: **`Ir para Fila Para Abordar (X)`**, **`Ver Já Mandados (Y)`**, **`Minerar Novos Leads`**.
2. **Grade 4×2 (8 Cards Clicáveis c/ Ícone + Badge de %/Status no Canto Direito):**
   - *Linha 1 — Fluxo de Captação:*
     1. **Falta Abordar (Novos)**: contagem `toContactCount` + badge `% da base` → clique abre **CRM Kanban** focado em `Para Abordar`.
     2. **Já Mandados (Aguardando)**: contagem `sentWaitingCount` + badge `Whats / DM` → clique abre **Já Mandados**.
     3. **Em Negociação**: contagem `negotiating` + badge `Em aberto` → clique abre **CRM Kanban**.
     4. **Parcerias Fechadas**: contagem `closed` + badge `{conversionRate}% conv.` → clique abre **Já Mandados / Fechados**.
   - *Linha 2 — Prontidão & Resultado:*
     5. **Prontos c/ WhatsApp**: contagem `whatsapps` + badge `% c/ contato`.
     6. **Qualificados (Ouro + Prata)**: contagem `qualified` + badge `Score ≥ 50`.
     7. **Investido em Publis**: `R$` total investido (clique abre `Publicidades`).
     8. **Retorno / Lucro**: `R$` retorno líquido + badge `ROI %` (clique abre `Publicidades`).
3. **Painéis Inferiores (2 Colunas):**
   - *Esquerda — Funil de Captação & Envios:* barras horizontais proporcionais para `Para Abordar (Novo)`, `Msg Enviada / Sem Resposta`, `Em Negociação`, `Fechou` e `Remarketing / Recusados` com contagem e `%`.
   - *Direita — Guia Rápido "O Que Fazer Agora":* mostra os 3 próximos passos práticos para o operador com contadores ao vivo (ex.: *"1. Há X leads Ouro com WhatsApp esperando 1º contato → Abrir Fila"*, *"2. Há Y leads em Msg Enviada aguardando follow-up → Abrir Já Mandados"*, *"3. Z leads em negociação precisam preencher Stories/Valor → Revisar"*).

### 4.2 Tela `CRM Kanban` (`client/src/components/KanbanBoard.jsx` + alternador Lista)
1. **Guia Visual Passo-a-Passo Fixo no Topo (colapsável):**
   `1. Escolha um lead em Para Abordar` → `2. Mande o script no WhatsApp ou Direct` → `3. Clique em "Já Mandei Msg" (ou arraste o card)` → `4. Abra o card e preencha Views & Preço quando responder`.
2. **Barra de Filtros + Alternador `Kanban | Lista`:**
   - Busca por `@ / nome / nicho / termo`, filtro `15k+`, `Só Minerados`, `Ocultar Agências`, botão de gaveta `Remarketing / Recusados (N)` e switch **Visual Kanban** vs **Tabela Clássica** (`InfluencerTable`).
3. **4 Colunas Visuais do Kanban (Desktop lado a lado / Mobile abas de coluna):**
   - Coluna 1: **`🎯 Para Abordar`** (`status === 'Novo'`)
   - Coluna 2: **`📤 Msg Enviada`** (`status === 'Mensagem Enviada' || status === 'Sem resposta'`)
   - Coluna 3: **`💬 Em Negociação`** (`status === 'Em negociação'`)
   - Coluna 4: **`✅ Fechou`** (`status === 'Fechou'`)
   - *(Mais coluna/gaveta opcional `♻️ Remarketing / Recusados` visível via toggle no topo para manter o quadro focado nas 4 colunas produtivas.)*
4. **Anatomia Clara de Cada Card do Kanban:**
   - **Topo:** Avatar, Nome, `@username` (abre Instagram em nova aba), Badge de Score (`💎 OURO`, `🥈 PRATA`...), Badge `15k+`.
   - **Alertas do que falta preencher:** pílulas âmbar/discretas quando faltar `WhatsApp` ou `Views Stories` ou `Preço` (apenas quando relevante para a coluna).
   - **Corpo:** Seguidores, Views Reels/Stories, Badge do Canal (`WhatsApp` / `DM`) e Data do envio quando já contatado.
   - **Botões Explícitos de Ação (sem advinhação de clique):**
     - Botão primário contextual por coluna:
       - Na coluna `Para Abordar`: **`Já Mandei Msg →`** (popover rápido de 2 botões: `Via WhatsApp` | `Via Direct IG`, que atualiza `status: 'Mensagem Enviada'`, `outreach_channel`, `contacted_at` imediatamente) + botão verde **`WhatsApp`** (quando houver telefone).
       - Na coluna `Msg Enviada`: **`Respondeu →`** (move p/ `Em negociação`) ou **`Sem resposta`** / **`Follow-up`**.
       - Na coluna `Em Negociação`: **`Fechou ✅`** (move p/ `Fechou`) + **`Remarketing`**.
       - Na coluna `Fechou`: **`Lançar Publi 💰`** (abre `CreatePublicidadeModal` já preenchido!).
     - Botão explícito **`Preencher Ficha`** (abre o `InfluencerDrawer` com foco nos campos editáveis).
   - Também suporta **arrastar e soltar (HTML5 Drag & Drop)** nativo entre colunas para atualizar status sem bibliotecas externas pesadas.

### 4.3 Painel Exclusivo `📤 Já Mandados` (`client/src/components/SentLeadsView.jsx`)
Tela dedicada apenas a leads que já saíram do status `Novo`:
1. **4 Mini-Cards no Topo:**
   - **Total Já Mandados** (`sentTotalCount`)
   - **Aguardando Resposta** (`Mensagem Enviada` + `Sem resposta`)
   - **Responderam / Taxa %** (`repliedCount` + `responseRate%`)
   - **Remarketing / Retomar** (`Recusado - Remarketing` + `Outro momento`)
2. **Filtros Rápidos por Etapa & Canal:**
   - Chips clicáveis: `Todos Enviados` | `Msg Enviada / Sem resposta` | `Em negociação` | `Fechou` | `Remarketing` + filtro `WhatsApp` / `Instagram DM`.
3. **Tabela de Follow-up Clara:**
   - Colunas: **Influenciador**, **Canal & Data do Envio** (`WhatsApp` ou `Instagram DM` + tempo desde `contacted_at`), **Etapa Atual** (seletor rápido), **Métricas & Observações**, e **Ações Explícitas** (`Cobrar no WhatsApp`, `Registrar Novo Contato`, `Abrir Ficha`).

### 4.4 Drawer Completo & Editável (`client/src/components/InfluencerDrawer.jsx`)
Mantém as 4 abas existentes (`Resumo & Preenchimento`, `Publicidades`, `Metas`, `Scripts do Pedro`) e corrige a principal lacuna atual:
- Na aba **`Resumo & Preenchimento`**:
  - **Barra de Mudança Rápida de Etapa & Canal:** seletor visual de `Status`, escolha rápida do canal (`WhatsApp` / `Instagram DM`) e botão **`Marcar como Mensagem Enviada`** se ainda estiver em `Novo`.
  - **Formulário Explícito "O que Preencher deste Lead" (com botão único `Salvar Dados do Lead`):**
    - **WhatsApp** (input editável + formatação BR + botão testar/abrir link direto)
    - **Jogo Alvo** (`Block Win`, `Bubble Win`, `Cust Win`, `Count Masters`)
    - **Média Views Stories** (número)
    - **Média Cliques Stories** (número)
    - **Valor Pedido (R$)** (número)
    - **Bio capturada** (visualização resumida para contextualizar antes de abordar)
    - **Observações & Histórico da Negociação** (textarea)

---

## 5. Riscos, Compatibilidade e Plano de Testes

- **Compatibilidade retroativa:** Nenhuma rota ou teste v1/v2 existente (`test-async-mine.js`, `test-async-routes.js`, `test-filters-store.js`, `test-pedro-normalizer.js`, `test-v2-routes.js`, `test-search-v2.js`, `test-quota-keepalive.js`) deve quebrar. O `GET /api/influencers` mantém resposta `{ data, total, page, totalPages }`.
- **Sincronização localStorage (`scout_mined_cache_v2`):** Leads recém-minerados continuam entrando como `'Novo'` e aparecem imediatamente no topo da coluna **`Para Abordar`** do Kanban e no card **`Falta Abordar`** do Dashboard.
- **Testes automatizados (TDD):** Criar suite `test/test-v3-sdr-workflow.js` cobrindo:
  1. Aceitação do novo status `'Mensagem Enviada'` em `PUT /api/influencers/:id`.
  2. Gravação automática de `contacted_at` e `last_contact_at` e preservação no `upsertInfluencer`.
  3. Filtros `stage=to_contact` (`Novo`) vs `stage=sent` (`!== 'Novo'`) e `channel` em `listInfluencers`.
  4. Novos contadores de funil e `responseRate` em `GET /api/influencers/stats`.
  5. Build de produção Vite (`npm --prefix client run build`) sem erros de compilação.
