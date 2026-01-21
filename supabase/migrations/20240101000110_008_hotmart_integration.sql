-- Migration: Hotmart Integration
-- Creates tables for Hotmart webhook configuration and activity logging

-- Hotmart settings table (singleton)
CREATE TABLE IF NOT EXISTS hotmart_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    webhook_secret TEXT,
    default_campaign_id INTEGER REFERENCES campaigns(id),
    enable_auto_import BOOLEAN DEFAULT false,
    enable_distribution BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    CHECK (id = 1)
);

-- Webhook activity log
CREATE TABLE IF NOT EXISTS hotmart_webhook_logs (
    id SERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success', 'error', 'duplicate'
    error_message TEXT,
    lead_uuid TEXT,
    buyer_email TEXT,
    buyer_name TEXT,
    product_name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_hotmart_logs_created_at ON hotmart_webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hotmart_logs_status ON hotmart_webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_hotmart_logs_buyer_email ON hotmart_webhook_logs(buyer_email);
