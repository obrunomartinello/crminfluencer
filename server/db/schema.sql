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
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS is_agency BOOLEAN DEFAULT FALSE;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS promotes_raffle BOOLEAN DEFAULT FALSE;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS promotes_shopee BOOLEAN DEFAULT FALSE;

-- Desabilitar RLS para uso operacional sem autenticação
ALTER TABLE public.influencers DISABLE ROW LEVEL SECURITY;

-- Conceder permissões totais
GRANT ALL ON TABLE public.influencers TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.influencers_id_seq TO anon, authenticated, service_role;
