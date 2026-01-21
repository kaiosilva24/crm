-- =====================================================
-- SQL COMPLETO PARA CART ABANDONMENT
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Tabela de Configurações do Abandono de Carrinho
CREATE TABLE IF NOT EXISTS cart_abandonment_settings (
    id SERIAL PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT false,
    manychat_api_token TEXT,
    manychat_tag_name TEXT,
    manychat_tag_name_2 TEXT,
    delay_minutes INTEGER DEFAULT 60,
    campaign_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO cart_abandonment_settings (id, is_enabled, delay_minutes)
VALUES (1, false, 60)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabela de Eventos de Abandono de Carrinho
CREATE TABLE IF NOT EXISTS cart_abandonment_events (
    id SERIAL PRIMARY KEY,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    product_name TEXT,
    product_value DECIMAL(10, 2),
    status TEXT DEFAULT 'pending', -- pending, completed, error
    error_message TEXT,
    in_campaign BOOLEAN DEFAULT NULL, -- NULL=não verificado, true=encontrado, false=não encontrado
    tag_applied_at TIMESTAMP WITH TIME ZONE,
    tag_2_applied_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cart_events_status ON cart_abandonment_events(status);
CREATE INDEX IF NOT EXISTS idx_cart_events_created_at ON cart_abandonment_events(created_at);
CREATE INDEX IF NOT EXISTS idx_cart_events_phone ON cart_abandonment_events(contact_phone);
CREATE INDEX IF NOT EXISTS idx_cart_events_email ON cart_abandonment_events(contact_email);

-- 3. Tabela de Logs do Abandono de Carrinho
CREATE TABLE IF NOT EXISTS cart_abandonment_logs (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES cart_abandonment_events(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- webhook_received, tag_applied, tag_2_applied, error, etc
    status TEXT NOT NULL, -- success, error
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para logs
CREATE INDEX IF NOT EXISTS idx_cart_logs_event_id ON cart_abandonment_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_cart_logs_created_at ON cart_abandonment_logs(created_at);

-- 4. Comentários nas colunas para documentação
COMMENT ON COLUMN cart_abandonment_events.in_campaign IS 'Indica se o contato foi encontrado na campanha configurada: NULL=não verificado, true=encontrado, false=não encontrado';
COMMENT ON COLUMN cart_abandonment_events.status IS 'Status do evento: pending=aguardando, completed=concluído, error=erro';
COMMENT ON COLUMN cart_abandonment_settings.delay_minutes IS 'Tempo de espera em minutos antes de aplicar a segunda tag';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name LIKE 'cart_abandonment%'
ORDER BY table_name;
