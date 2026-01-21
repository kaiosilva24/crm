-- Migration: Create table to store group participants for display
-- This allows showing participants without needing active Baileys connection

CREATE TABLE IF NOT EXISTS group_participants (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES whatsapp_groups(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_group_participants_group_id ON group_participants(group_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_phone ON group_participants(phone);

COMMENT ON TABLE group_participants IS 'Cached participants from WhatsApp groups for display purposes';
