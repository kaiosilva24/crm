-- SQL para criar tabelas do Hotmart no Supabase
-- Execute este SQL no painel do Supabase (SQL Editor)

-- 1. Criar tabela de configurações
CREATE TABLE IF NOT EXISTS public.hotmart_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    webhook_secret TEXT,
    default_campaign_id INTEGER,
    enable_auto_import BOOLEAN DEFAULT false,
    enable_distribution BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row_hotmart CHECK (id = 1)
);

-- 2. Criar tabela de logs de webhooks
CREATE TABLE IF NOT EXISTS public.hotmart_webhook_logs (
    id SERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    lead_uuid TEXT,
    buyer_email TEXT,
    buyer_name TEXT,
    product_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_hotmart_logs_created_at ON public.hotmart_webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hotmart_logs_status ON public.hotmart_webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_hotmart_logs_buyer_email ON public.hotmart_webhook_logs(buyer_email);

-- 4. Inserir configuração padrão
INSERT INTO public.hotmart_settings (id, enable_auto_import, enable_distribution)
VALUES (1, true, false)
ON CONFLICT (id) DO NOTHING;

-- 5. Verificar se foi criado
SELECT * FROM public.hotmart_settings;
