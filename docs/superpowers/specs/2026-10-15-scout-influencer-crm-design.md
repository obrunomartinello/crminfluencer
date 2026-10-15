# Scout Influencer CRM v1.0 — Design Spec

**Date:** 2026-10-15  
**Status:** Approved  
**Author:** Antigravity (co-design com Bruno/Pedro)

---

## 1. Visão do Produto

Uma plataforma operacional para mineração, triagem matemática e qualificação de influenciadores do Instagram para o mercado de afiliação .bet.br. O sistema resolve o gargalo da prospecção manual, automatizando:

1. **Varredura** via Apify (por hashtag/nicho)
2. **Enriquecimento** via scraping do link na bio (Linktree, Beacons, Bio.site)
3. **Scoring automático** (0–100) com classificação OURO/PRATA/BRONZE/LIXO
4. **CRM visual** para gerenciar pipeline comercial com disparo de pitch por WhatsApp

**Versão futura (fora do escopo v1):** Robô SDR com playbook do Pedro, monitoramento de conversões, taxa de resposta e padrões de perfil.

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, Vite 5, Tailwind CSS v3, Lucide React, fonte Inter |
| Backend | Node.js 20+, Express 4 |
| Banco | Supabase (PostgreSQL) via `@supabase/supabase-js` |
| Scraping | `apify-client`, `axios`, `cheerio` |
| Dev runner | `concurrently` (root `npm run dev` sobe ambos) |

**Design:** estilo Apple — dark mode padrão, superfícies em cinza-escuro (`#1C1C1E`, `#2C2C2E`), acentos em azul (`#0A84FF`), tipografia Inter, bordas suaves, cards com vidro fosco sutil.

---

## 3. Estrutura de Arquivos

```
pedrocrm/
├── package.json                  # root — scripts: dev, build, start
├── .env.example
├── .gitignore
│
├── server/
│   ├── index.js                  # Express entry, middlewares, monta rotas
│   ├── db/
│   │   └── supabase.js           # cliente Supabase singleton
│   ├── routes/
│   │   ├── influencers.js        # GET/POST/PUT/DELETE /api/influencers
│   │   ├── mine.js               # POST /api/mine
│   │   └── inspect.js            # POST /api/inspect-link
│   └── services/
│       ├── scoring.js            # calculateScore(influencer) → {score, classification}
│       ├── linktree.js           # inspectLink(url) → {whatsapp, hasCompetitor, competitorName}
│       └── apify.js              # runMiningActor(query, count) → influencer[]
│
├── client/
│   ├── index.html
│   ├── vite.config.js            # proxy /api → localhost:3001
│   └── src/
│       ├── main.jsx
│       ├── App.jsx               # SPA root, estado global, roteamento entre views
│       ├── lib/
│       │   └── api.js            # funções fetch para cada endpoint do backend
│       └── components/
│           ├── KPICards.jsx      # 5 cards de métricas
│           ├── FilterBar.jsx     # busca + filtros + botão Minerar
│           ├── InfluencerTable.jsx  # tabela paginada com badges
│           ├── InfluencerDrawer.jsx # gaveta lateral com ficha + pitch + WhatsApp
│           └── MineModal.jsx     # modal de mineração (hashtag + quantidade)
│
└── docs/
    └── superpowers/
        ├── specs/
        └── plans/
```

---

## 4. Banco de Dados (Supabase PostgreSQL)

### Tabela `influencers`

```sql
CREATE TABLE IF NOT EXISTS public.influencers (
  id                BIGSERIAL PRIMARY KEY,
  username          VARCHAR(100) UNIQUE NOT NULL,
  full_name         VARCHAR(255),
  profile_pic_url   TEXT,
  bio               TEXT,
  external_url      TEXT,
  followers_count   INTEGER DEFAULT 0,
  following_count   INTEGER DEFAULT 0,
  posts_count       INTEGER DEFAULT 0,
  avg_reels_views   INTEGER DEFAULT 0,
  engagement_rate   NUMERIC(5,2) DEFAULT 0,
  whatsapp          VARCHAR(30),
  email             VARCHAR(255),
  has_competitor    BOOLEAN DEFAULT FALSE,
  competitor_name   VARCHAR(100),
  niche             VARCHAR(50) DEFAULT 'Geral',
  score             INTEGER DEFAULT 0,
  classification    VARCHAR(20) DEFAULT 'BRONZE',
  status            VARCHAR(30) DEFAULT 'Novo',
  user_notes        TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.influencers DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.influencers TO anon, authenticated, service_role;
```

### Valores permitidos (validados no backend)

- `classification`: `OURO` | `PRATA` | `BRONZE` | `LIXO`
- `status`: `Novo` | `Qualificado` | `Abordado` | `Negociando` | `Fechado` | `Desqualificado`

---

## 5. Motor de Scoring (`scoring.js`)

Função pura: recebe objeto de influenciador, retorna `{ score: number, classification: string }`.

### Regras (aplicadas em sequência)

| Critério | Pontos | Condição |
|----------|--------|----------|
| Faixa ideal de seguidores | +30 | `followers_count >= 10_000 && followers_count <= 120_000` |
| Engajamento alto (Reels) | +35 | `engagement_rate >= 15` |
| WhatsApp encontrado | +20 | `whatsapp` não nulo/vazio |
| Audiência virgem (sem concorrente) | +15 | `has_competitor === false` |
| Penalidade bot (seguidores fantasma) | Score → 10, classification → LIXO | `followers_count > 10_000 && engagement_rate < 2` |

A penalidade bot é aplicada **antes** dos demais critérios e encerra o cálculo.

### Classificação final

| Score | Classificação |
|-------|--------------|
| 75–100 | OURO |
| 50–74 | PRATA |
| 30–49 | BRONZE |
| < 30 | LIXO |

---

## 6. Serviço de Inspeção de Link (`linktree.js`)

`inspectLink(url: string) → Promise<{ whatsapp: string|null, hasCompetitor: boolean, competitorName: string|null }>`

### Extração de WhatsApp

Varrer o HTML da URL buscando:
- Links com `wa.me/` ou `api.whatsapp.com/send`
- Padrão de número BR: `(\+?55\s?)?\(?[1-9]{2}\)?\s?9[0-9]{4}[-\s]?[0-9]{4}`

Normalizar o número para formato numérico puro (ex: `5511999998888`) para montar a URL `wa.me/`.

### Detecção de Concorrentes

Lista de termos: `blaze`, `betano`, `estrela bet`, `superbet`, `novibet`, `bet365`, `sportingbet`, `parimatch`, `betnacional`, `PixBet`, `realsbet`, `vai de bet`, `galera bet`, `cassino`, `.bet.br`

Varrer o texto de todos os links e botões da página. Se encontrar um match, retornar `hasCompetitor: true` e `competitorName` com o primeiro termo encontrado.

### Tratamento de erros

Se a requisição falhar (timeout 8s, erro HTTP), retornar `{ whatsapp: null, hasCompetitor: false, competitorName: null }` — nunca lançar erro para cima.

---

## 7. Serviço Apify (`apify.js`)

`runMiningActor(query: string, count: number) → Promise<influencer[]>`

- Usa `ApifyClient` com token de `process.env.APIFY_TOKEN`
- Actor ID: `process.env.APIFY_ACTOR_ID` (padrão sugerido: `apify/instagram-hashtag-scraper`)
- Input padrão: `{ hashtags: [query], resultsLimit: count }`
- Mapear os campos retornados para o schema `influencers` (username, full_name, profile_pic_url, bio, external_url, followers_count, following_count, posts_count, avg_reels_views calculado a partir dos últimos Reels retornados)

### Fallback (sem token)

Se `APIFY_TOKEN` não estiver definido, retornar um array de 5 influenciadores mock realistas para permitir desenvolvimento sem conta Apify.

---

## 8. Rotas do Backend

### `GET /api/influencers`

Query params opcionais: `search`, `status`, `classification`, `page` (padrão 1), `limit` (padrão 20).  
Retorna: `{ data: influencer[], total: number, page: number, totalPages: number }`.

### `POST /api/influencers`

Body: campos do influenciador (username obrigatório).  
Ação: calcular score → inserir → retornar o registro criado.

### `PUT /api/influencers/:id`

Body: campos a atualizar (parcial).  
Se `status` ou `classification` forem atualizados, validar contra os valores permitidos.  
Retorna o registro atualizado.

### `DELETE /api/influencers/:id`

Remove o registro. Retorna `{ success: true }`.

### `POST /api/mine`

Body: `{ query: string, count: number }`.  
Fluxo: `apify.runMiningActor(query, count)` → para cada perfil: `linktree.inspectLink(external_url)` → `scoring.calculateScore(enriched)` → upsert no Supabase (conflict on `username`).  
Retorna: `{ imported: number, skipped: number }`.

### `POST /api/inspect-link`

Body: `{ url: string }`.  
Retorna: `{ whatsapp, hasCompetitor, competitorName }`.

---

## 9. Interface do CRM

### Design System

- Fonte: Inter (Google Fonts)
- Paleta dark:
  - Background primário: `#000000` / `#1C1C1E`
  - Superfície card: `#2C2C2E`
  - Borda sutil: `rgba(255,255,255,0.08)`
  - Azul primário: `#0A84FF`
  - Verde sucesso: `#30D158`
  - Vermelho erro: `#FF453A`
  - Amarelo aviso: `#FFD60A`
  - Texto primário: `#FFFFFF`
  - Texto secundário: `rgba(255,255,255,0.55)`

### KPICards (5 cards)

1. Total Minerados
2. Qualificados (OURO + PRATA)
3. WhatsApps Capturados
4. Abordados / Em Negociação
5. Parcerias Fechadas

Calculados no frontend a partir da lista completa; chamada extra `GET /api/influencers?limit=9999` para aggregation, ou endpoint dedicado (a definir na implementação).

### FilterBar

- Input de busca (debounce 300ms) por username ou nome
- Select de Status (todos + 6 valores)
- Select de Classificação (todas + 4 valores)
- Botão "⚡ Minerar" → abre MineModal

### InfluencerTable

Colunas: Avatar | @Username | Seguidores | Avg Views | Engajamento (badge) | WhatsApp | Bio Status | Score (badge) | Ações (editar status, abrir drawer)

Paginação no rodapé: anterior / número / próximo.

Badges de engajamento:
- ≥ 15%: verde
- 5%–14%: amarelo
- < 5%: vermelho

Badges de classificação:
- OURO: dourado `#FFD60A`
- PRATA: cinza claro
- BRONZE: `#CD7F32`
- LIXO: vermelho apagado

### InfluencerDrawer (gaveta lateral)

Slide-in da direita, largura 480px.  
Seções:
1. Header: foto + nome + @username + link Instagram
2. Métricas: seguidores, following, posts, avg views, engagement, score
3. Bio e Link externo
4. Notas (textarea editável, salva com PUT /api/influencers/:id no blur)
5. Gerador de Pitch:
   - **Virgem** (`has_competitor === false`): pitch convidando para monetizar com marca 100% regulamentada, CPA/RevShare
   - **Com concorrente** (`has_competitor === true`): pitch comparativo propondo aumento de comissão
   - Botão "📋 Copiar" para área de transferência
6. Botão "💬 Abrir WhatsApp" → `https://wa.me/55{whatsapp}?text={pitchEncodado}` (nova aba)

### MineModal

- Input "Hashtag ou Nicho" (ex: `apostas`, `futebolaovivo`)
- Slider ou input numérico "Quantidade" (10–100, padrão 25)
- Botão "Iniciar Varredura" → POST /api/mine → mostra spinner + resultado (`X novos perfis importados`)

---

## 10. Configuração e Dev Experience

### `.env.example`

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
APIFY_TOKEN=your-apify-token-optional
APIFY_ACTOR_ID=apify/instagram-hashtag-scraper
PORT=3001
```

### `package.json` root

```json
{
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "node server/index.js",
    "client": "npm run dev --prefix client",
    "build": "npm run build --prefix client",
    "start": "node server/index.js"
  }
}
```

### Vite Proxy (`client/vite.config.js`)

```js
server: {
  proxy: {
    '/api': 'http://localhost:3001'
  }
}
```

---

## 11. Fora do Escopo (v1)

- Autenticação de usuário
- Robô SDR / playbook de pre-qualificação
- Monitoramento de conversões e taxa de resposta
- Suporte a TikTok
- Notificações / webhooks
- Multi-tenancy

---

## 12. Critérios de Sucesso (v1)

- [ ] `npm install && npm run dev` sobe frontend e backend sem erros
- [ ] SQL do schema pode ser colado no Supabase SQL Editor e executado sem erros
- [ ] Com token Apify configurado, `POST /api/mine` importa perfis reais
- [ ] Sem token, mock data popula o CRM para demonstração
- [ ] Score e classificação são calculados corretamente para todos os casos do algoritmo
- [ ] Drawer abre, notas são salvas, pitch é gerado e botão WhatsApp monta URL correta
