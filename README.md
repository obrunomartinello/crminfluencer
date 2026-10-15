# 🎯 Scout Influencer CRM v1.0

Plataforma operacional de ponta a ponta para **mineração automática**, **auditoria anti-bot em Reels**, **leitura inteligente de bio (Linktree/Beacons)**, **cálculo de Lead Score (0–100)** e **esteira de abordagem comercial via WhatsApp em 1 clique** para influenciadores no mercado de afiliação e parcerias regulamentadas (**`.bet.br`**).

---

## ⚡ 1. Guia de Início Rápido (3 Passos)

### Passo 1: Banco de Dados no Supabase (Gratuito)
1. Crie sua conta em [supabase.com](https://supabase.com) e inicie um novo projeto.
2. Acesse o menu **SQL Editor**, cole o conteúdo de [`server/db/schema.sql`](file:///c:/Users/Bruno%20Martinello/.gemini/antigravity/scratch/pedrocrm/server/db/schema.sql) e clique em **Run**.
3. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**.

### Passo 2: Token do Apify (Opcional)
1. Crie uma conta gratuita em [apify.com](https://apify.com).
2. Em **Settings → Integrations → API Tokens**, copie seu token.
> *Nota: Se você não tiver o token do Apify agora, o CRM funciona imediatamente com dados mock realistas para testes e validação!*

### Passo 3: Configurar e Rodar
1. No arquivo `.env` na raiz do projeto, preencha suas chaves:
   ```env
   SUPABASE_URL=https://sua-url-do-supabase.supabase.co
   SUPABASE_ANON_KEY=sua-chave-anonima-publica
   APIFY_TOKEN=seu-token-apify-opcional
   APIFY_ACTOR_ID=apify/instagram-hashtag-scraper
   PORT=3001
   ```
2. Inicie a aplicação com um único comando na raiz:
   ```bash
   npm run dev
   ```
3. Acesse no navegador: **`http://localhost:5173`** (o backend roda em paralelo na porta `3001`).

---

## 🏗️ 2. Stack Tecnológica

* **Frontend:** React 19, Vite 5, Tailwind CSS, Lucide Icons, Tipografia Inter, Design System Dark Mode inspirado na Apple.
* **Backend:** Node.js (v20+), Express 4.
* **Banco de Dados:** Supabase (PostgreSQL relacional) com fallback resiliente para modo de desenvolvimento.
* **Enriquecimento & Scraping:** `apify-client`, `cheerio` e `axios` para varredura de agregadores de link (Linktree, Beacons, Bio.site).

---

## 🧮 3. Motor de Triagem & Lead Score (0 a 100)

Quando novos perfis são minerados ou adicionados, o sistema audita automaticamente:

1. **Auditoria Anti-Bot (Filtro de Fantasmas):**
   * Calcula: `avg_reels_views` = média das visualizações dos últimos Reels.
   * `engagement_rate = (avg_reels_views / followers_count) * 100`.
   * **Penalidade:** Se `followers_count > 10.000` e `engagement_rate < 2%`, o perfil é penalizado e classificado imediatamente como **🗑️ LIXO (Score: 10)**.

2. **Inspeção de Link da Bio (Linktree / Beacons):**
   * Faz requisição HTTP no link externo e procura:
     * **WhatsApp Comercial:** Padrões `wa.me/`, `api.whatsapp.com/send` ou regex de telefones brasileiros `(DDD) 9XXXX-XXXX`.
     * **Detecção de Concorrência:** Varre menções a casas de apostas (Blaze, Betano, Estrela Bet, Superbet, Novibet, Cassino, .bet.br, etc.).

3. **Cálculo de Pontos:**
   * **+30 pontos:** Faixa ideal de conversão (10k a 120k seguidores).
   * **+35 pontos:** Engajamento alto em Reels (Taxa de Views ≥ 15%).
   * **+20 pontos:** WhatsApp comercial detectado diretamente.
   * **+15 pontos:** Audiência virgem (sem concorrente promovido na bio).

4. **Classificação Comercial:**
   * 💎 **OURO** (75 a 100 pontos): Prioridade máxima, audiência real e contato direto.
   * 🥈 **PRATA** (50 a 74 pontos): Bom engajamento, mas requer contato indireto ou disputa com concorrente.
   * 🥉 **BRONZE** (30 a 49 pontos): Perfil mediano.
   * 🗑️ **LIXO** (Abaixo de 30 pontos): Desqualificado / baixa conversão.

---

## 🚀 4. Interface e Funcionalidades

* **Dashboard de KPIs:** Total minerado, perfis qualificados (Ouro + Prata), WhatsApps capturados, negociações ativas e parcerias fechadas.
* **Barra de Controle & Filtros:** Busca instantânea por `@username` ou nome com debounce, filtro por Status do Pipeline e filtro por Classificação.
* **Modal de Mineração Apify:** Disparo de varredura por hashtag (ex: `#futebol`, `#apostas`, `#cassino`) com seleção de quantidade.
* **Planilha Inteligente de Leads:** Tabela com badges coloridos de engajamento, status da bio (Virgem ou Concorrente) e alteração rápida de status inline.
* **Gaveta Lateral de Detalhes (Drawer):**
  * Ficha completa com foto de perfil e métricas de auditoria.
  * Histórico de anotações comerciais (salvo automaticamente ao digitar).
  * **Gerador de Pitch Duplo:**
    * **Para Perfil Virgem:** Pitch apresentando monetização com marca 100% regulamentada `.bet.br`.
    * **Para Perfil com Concorrente:** Pitch comparativo agressivo propondo aumento de comissão (CPA + RevShare).
  * **Disparo WhatsApp em 1 Clique:** Monta a URL oficial `wa.me/55...` com a mensagem encodada e abre a conversa na hora.

---

## 🔌 5. Rotas da API (Backend Express)

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/health` | Status de saúde do servidor |
| `GET` | `/api/influencers/stats` | Contadores agregados para os KPI Cards |
| `GET` | `/api/influencers` | Lista de criadores com filtros e paginação |
| `POST` | `/api/influencers` | Cadastro manual de influenciador |
| `PUT` | `/api/influencers/:id` | Atualiza status, notas ou dados do criador |
| `DELETE` | `/api/influencers/:id` | Remove influenciador |
| `POST` | `/api/mine` | Dispara varredura no Apify e salva no banco |
| `POST` | `/api/inspect-link` | Utilitário para raspar Linktree/Beacons |

---

## 🔮 6. Roadmap & Próximos Passos
* Integração do **Robô SDR com Playbook do Pedro**: afunilamento baseado em regras comportamentais avançadas, detecção de padrões de nicho e pré-qualificação automatizada.
* Métricas de taxa de resposta e conversão de WhatsApp.
* Mineração estendida para TikTok.
