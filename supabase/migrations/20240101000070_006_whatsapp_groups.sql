-- Tabela para armazenar conexões WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_connections (
    id VARCHAR(255) PRIMARY KEY, -- Changed to VARCHAR to support 'default' and match fix
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(50) DEFAULT 'baileys',
    phone_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'disconnected',
    qr_code TEXT,
    pairing_code VARCHAR(10),
    pairing_phone VARCHAR(20),
    session_data JSONB,
    last_connected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para armazenar grupos do WhatsApp
-- Table likely exists from 000_initial, so we alter it
CREATE TABLE IF NOT EXISTS whatsapp_groups (
    id SERIAL PRIMARY KEY,
    connection_id VARCHAR(255) REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
    group_id VARCHAR(255) NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    participant_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(connection_id, group_id)
);

-- Ensure columns exist if table was created by 000_initial
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE whatsapp_groups ADD COLUMN connection_id VARCHAR(255) REFERENCES whatsapp_connections(id) ON DELETE CASCADE;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE whatsapp_groups ADD COLUMN participant_count INTEGER DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    -- Add UNIQUE constraint if not exists (tricky in DO block, skipping for now as it risks errors)
END $$;

-- Tabela para associar grupos a campanhas
CREATE TABLE IF NOT EXISTS campaign_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    whatsapp_group_id INTEGER REFERENCES whatsapp_groups(id) ON DELETE CASCADE, -- Changed to INTEGER to match SERIAL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, whatsapp_group_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_status ON whatsapp_connections(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_connection ON whatsapp_groups(connection_id);
CREATE INDEX IF NOT EXISTS idx_campaign_groups_campaign ON campaign_groups(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_groups_group ON campaign_groups(whatsapp_group_id);

-- RLS Policies
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users on whatsapp_connections" ON whatsapp_connections;
CREATE POLICY "Allow all for authenticated users on whatsapp_connections" ON whatsapp_connections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users on whatsapp_groups" ON whatsapp_groups;
CREATE POLICY "Allow all for authenticated users on whatsapp_groups" ON whatsapp_groups FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users on campaign_groups" ON campaign_groups;
CREATE POLICY "Allow all for authenticated users on campaign_groups" ON campaign_groups FOR ALL USING (true) WITH CHECK (true);
