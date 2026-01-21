-- FIX: Create missing cart_abandonment_settings table with FULL SCHEMA
-- This ensures 'manychat_tag_name' exists for migration 012
CREATE TABLE IF NOT EXISTS cart_abandonment_settings (
    id SERIAL PRIMARY KEY,
    
    -- ManyChat
    manychat_api_token TEXT,
    manychat_flow_id_first TEXT,
    manychat_flow_id_second TEXT,
    manychat_webhook_url TEXT,
    manychat_tag_name TEXT DEFAULT 'abandono_carrinho', -- REQUIRED by 012
    
    -- Processing
    delay_minutes INTEGER DEFAULT 60,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    is_enabled BOOLEAN DEFAULT false,
    
    -- Aliases/Legacy support (if needed, but better to stick to 013 definition)
    enabled BOOLEAN DEFAULT false, -- Keeping for safety if used elsewhere, though 013 uses is_enabled
    message_template TEXT, -- From my previous fix, maybe unused? Keeping just in case.
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default record
INSERT INTO cart_abandonment_settings (id, is_enabled, delay_minutes, manychat_tag_name)
VALUES (1, false, 60, 'abandono_carrinho')
ON CONFLICT (id) DO NOTHING;
