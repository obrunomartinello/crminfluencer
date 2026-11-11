-- Scout Influencer CRM v1.0 — Schema SQL Completo + Atualizações do Playbook do Pedro
-- Cole este script no SQL Editor do Supabase e execute.

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
  classification    VARCHAR(20) DEFAULT 'BRONZE', -- OURO, PRATA, BRONZE, LIXO
  status            VARCHAR(30) DEFAULT 'Novo', -- Novo, Qualificado, Abordado, Negociando, Fechado, Desqualificado
  user_notes        TEXT,
  -- Métricas do Playbook do Pedro (Calculadora de ROI de Stories)
  story_views_avg   INTEGER DEFAULT 0,
  story_clicks_avg  INTEGER DEFAULT 0,
  story_asking_price NUMERIC(10,2) DEFAULT 0,
  estimated_revenue NUMERIC(10,2) DEFAULT 0,
  roi_verdict       VARCHAR(30),
  -- Métricas Financeiras e Operacionais do Pedro
  paid_amount       NUMERIC(10,2) DEFAULT 0,
  revenue_generated NUMERIC(10,2) DEFAULT 0,
  last_campaign_date DATE,
  -- Filtros Anti-Lixo do Pedro
  is_agency         BOOLEAN DEFAULT FALSE,
  promotes_raffle   BOOLEAN DEFAULT FALSE,
  promotes_shopee   BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Se a tabela já foi criada anteriormente, adicione as novas colunas com segurança:
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS story_views_avg INTEGER DEFAULT 0;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS story_clicks_avg INTEGER DEFAULT 0;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS story_asking_price NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS estimated_revenue NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS roi_verdict VARCHAR(30);
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS revenue_generated NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS last_campaign_date DATE;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS is_agency BOOLEAN DEFAULT FALSE;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS promotes_raffle BOOLEAN DEFAULT FALSE;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS promotes_shopee BOOLEAN DEFAULT FALSE;

-- Colunas v2/v3 de Fluxo SDR, Rastreamento de Mineração e Campanhas
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS outreach_channel VARCHAR(30);
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS last_mined_at TIMESTAMPTZ;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS source_query TEXT;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS is_ghost BOOLEAN DEFAULT FALSE;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS campaign_game VARCHAR(60);

-- Tabela v2: Controle Financeiro de Publicidades
CREATE TABLE IF NOT EXISTS public.publicidades (
  id BIGSERIAL PRIMARY KEY,
  influencer_username TEXT NOT NULL,
  influencer_name TEXT,
  whatsapp TEXT,
  game VARCHAR(60),
  invested_amount NUMERIC(12,2) DEFAULT 0,
  return_amount NUMERIC(12,2),
  referral_name TEXT,
  referral_commission NUMERIC(12,2) DEFAULT 0,
  total_cost NUMERIC(12,2) DEFAULT 0,
  roi NUMERIC(10,4),
  start_date DATE,
  end_date DATE,
  closure_type VARCHAR(40) DEFAULT 'Fixo',
  target_depositors INTEGER,
  delivery_status VARCHAR(40) DEFAULT 'Agendada',
  payment_status VARCHAR(40) DEFAULT 'Pendente',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela v2: Metas de Depositantes (FTDs)
CREATE TABLE IF NOT EXISTS public.metas (
  id BIGSERIAL PRIMARY KEY,
  ad_id BIGINT,
  influencer_username TEXT NOT NULL,
  influencer_name TEXT,
  whatsapp TEXT,
  game VARCHAR(60),
  invested_amount NUMERIC(12,2) DEFAULT 0,
  target_depositors INTEGER DEFAULT 0,
  reached_depositors INTEGER DEFAULT 0,
  remaining_depositors INTEGER DEFAULT 0,
  progress_pct NUMERIC(10,4) DEFAULT 0,
  cpa NUMERIC(12,2),
  status VARCHAR(40) DEFAULT 'Em andamento',
  last_updated DATE,
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices operacionais
CREATE INDEX IF NOT EXISTS idx_influencers_status ON public.influencers(status);
CREATE INDEX IF NOT EXISTS idx_influencers_last_mined ON public.influencers(last_mined_at DESC);
CREATE INDEX IF NOT EXISTS idx_publicidades_username ON public.publicidades(influencer_username);
CREATE INDEX IF NOT EXISTS idx_metas_username ON public.metas(influencer_username);

-- Desabilitar RLS para uso operacional sem autenticação
ALTER TABLE public.influencers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.publicidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas DISABLE ROW LEVEL SECURITY;

-- Conceder permissões totais
GRANT ALL ON TABLE public.influencers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.publicidades TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.metas TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.influencers_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.publicidades_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.metas_id_seq TO anon, authenticated, service_role;
