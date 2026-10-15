-- Scout Influencer CRM v1.0 — Schema SQL
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
  classification    VARCHAR(20) DEFAULT 'BRONZE',
  status            VARCHAR(30) DEFAULT 'Novo',
  user_notes        TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Desabilitar RLS para uso interno sem autenticação
ALTER TABLE public.influencers DISABLE ROW LEVEL SECURITY;

-- Garantir acesso total
GRANT ALL ON TABLE public.influencers TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.influencers_id_seq TO anon, authenticated, service_role;
