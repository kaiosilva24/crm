-- Migration: Criar tabela para controle de in_group por campanha
-- Execute no SQL Editor do Supabase

-- Criar tabela de relacionamento lead-campanha-grupo
CREATE TABLE IF NOT EXISTS lead_campaign_groups (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    in_group BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lead_id, campaign_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lead_campaign_groups_lead ON lead_campaign_groups(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_campaign_groups_campaign ON lead_campaign_groups(campaign_id);
CREATE INDEX IF NOT EXISTS idx_lead_campaign_groups_in_group ON lead_campaign_groups(in_group);

-- Migrar dados existentes (copiar in_group atual para a nova tabela)
INSERT INTO lead_campaign_groups (lead_id, campaign_id, in_group)
SELECT id, campaign_id, in_group 
FROM leads 
WHERE campaign_id IS NOT NULL
ON CONFLICT (lead_id, campaign_id) DO NOTHING;

-- Comentários
COMMENT ON TABLE lead_campaign_groups IS 'Controle de status in_group por lead e campanha (isolado)';
COMMENT ON COLUMN lead_campaign_groups.in_group IS 'Se o lead está no grupo do WhatsApp desta campanha específica';
