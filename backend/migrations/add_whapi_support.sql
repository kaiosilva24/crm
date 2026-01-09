-- Migration: Adicionar tabela de configurações do Whapi.Cloud
-- Este script permite escolher entre Baileys ou Whapi.Cloud

-- Criar tabela de configurações do Whapi.Cloud
CREATE TABLE IF NOT EXISTS whapi_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_token TEXT NOT NULL,
    channel_id TEXT,  -- ID do canal/conexão no Whapi.Cloud
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna para indicar qual provider está sendo usado em cada conexão WhatsApp
ALTER TABLE whatsapp_connections 
ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'baileys' CHECK (provider IN ('baileys', 'whapi'));

-- Adicionar comentário explicativo
COMMENT ON COLUMN whatsapp_connections.provider IS 'Provider de WhatsApp: baileys (local) ou whapi (Whapi.Cloud API)';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whapi_settings_active ON whapi_settings(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_provider ON whatsapp_connections(provider);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_whapi_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER whapi_settings_updated_at_trigger
    BEFORE UPDATE ON whapi_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_whapi_settings_updated_at();
