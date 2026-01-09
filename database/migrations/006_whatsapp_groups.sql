-- Tabela para armazenar conexões WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(50) DEFAULT 'baileys', -- baileys (local) ou whapi (API)
    phone_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'disconnected', -- disconnected, connecting, waiting_pairing, connected
    qr_code TEXT,
    pairing_code VARCHAR(10), -- Código de pareamento (Redirect+)
    pairing_phone VARCHAR(20), -- Número usado para pairing code
    session_data JSONB,
    last_connected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela para armazenar grupos do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
    group_id VARCHAR(255) NOT NULL, -- ID do grupo no WhatsApp
    group_name VARCHAR(255) NOT NULL,
    participant_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(connection_id, group_id)
);

-- Tabela para associar grupos a campanhas
CREATE TABLE IF NOT EXISTS campaign_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    whatsapp_group_id UUID REFERENCES whatsapp_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(campaign_id, whatsapp_group_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_status ON whatsapp_connections(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_connection ON whatsapp_groups(connection_id);
CREATE INDEX IF NOT EXISTS idx_campaign_groups_campaign ON campaign_groups(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_groups_group ON campaign_groups(whatsapp_group_id);

-- RLS Policies
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_groups ENABLE ROW LEVEL SECURITY;

-- Políticas: permitir acesso a usuários autenticados (controle de admin será feito no backend)
DROP POLICY IF EXISTS "Allow all for authenticated users on whatsapp_connections" ON whatsapp_connections;
CREATE POLICY "Allow all for authenticated users on whatsapp_connections" ON whatsapp_connections
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users on whatsapp_groups" ON whatsapp_groups;
CREATE POLICY "Allow all for authenticated users on whatsapp_groups" ON whatsapp_groups
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users on campaign_groups" ON campaign_groups;
CREATE POLICY "Allow all for authenticated users on campaign_groups" ON campaign_groups
    FOR ALL USING (true) WITH CHECK (true);
