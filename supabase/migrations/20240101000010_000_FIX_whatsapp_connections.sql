-- FIX: Create missing whatsapp_connections table
CREATE TABLE IF NOT EXISTS whatsapp_connections (
    id VARCHAR(255) PRIMARY KEY, -- connection_id like 'default'
    status VARCHAR(50) DEFAULT 'disconnected',
    qr_code TEXT,
    phone_number VARCHAR(50),
    -- pairing_code and pairing_phone will be added by 004 if not present here, 
    -- but good to have base structure. 
    -- 004 uses ALTER TABLE ADD COLUMN IF NOT EXISTS, so it is safe.
    last_connected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default connection if not exists
INSERT INTO whatsapp_connections (id, status)
VALUES ('default', 'disconnected')
ON CONFLICT (id) DO NOTHING;
