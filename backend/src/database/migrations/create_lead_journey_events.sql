-- Migration: Criar tabela de eventos da jornada do lead
-- Execute no banco PostgreSQL (Oracle Cloud)

CREATE TABLE IF NOT EXISTS lead_journey_events (
    id SERIAL PRIMARY KEY,
    -- Chave de busca cross-lead: unifica trajetória pelo telefone mesmo entre campanhas diferentes
    lead_phone TEXT,
    lead_email TEXT,
    -- Referência ao registro de lead (SET NULL se o lead for deletado)
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    -- Tipo e label do evento
    event_type TEXT NOT NULL,
    -- Tipos válidos: entry, re_entry, seller_assigned, status_change, campaign_change, sale, note
    event_label TEXT,
    -- Snapshot de dados no momento do evento (evita perda por updates posteriores)
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    campaign_name TEXT,
    seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    seller_name TEXT,
    status_id INTEGER REFERENCES lead_statuses(id) ON DELETE SET NULL,
    status_name TEXT,
    -- Dados de UTM (rastreamento de mídia paga: Meta Ads, Google Ads, etc.)
    utm_source   TEXT,   -- ex: "facebook", "google"
    utm_medium   TEXT,   -- ex: "cpc", "paid"
    utm_campaign TEXT,   -- ex: "LP11ABRIL26-Campanha" (nome da campanha no Meta)
    utm_content  TEXT,   -- ex: "Anuncio-Video-1" (anúncio específico)
    utm_term     TEXT,   -- ex: "Conjunto-01" (conjunto de anúncios / ad set)
    -- Dados extras em JSON (payload original do webhook, etc.)
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance de busca
CREATE INDEX IF NOT EXISTS idx_journey_phone   ON lead_journey_events(lead_phone);
CREATE INDEX IF NOT EXISTS idx_journey_email   ON lead_journey_events(lead_email);
CREATE INDEX IF NOT EXISTS idx_journey_lead_id ON lead_journey_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_journey_type    ON lead_journey_events(event_type);
CREATE INDEX IF NOT EXISTS idx_journey_created ON lead_journey_events(created_at DESC);

-- Comentários de documentação
COMMENT ON TABLE lead_journey_events IS 'Rastreia toda a trajetória/jornada de cada lead no CRM';
COMMENT ON COLUMN lead_journey_events.lead_phone IS 'Chave principal de busca cross-lead — unifica trajetória pelo telefone';
COMMENT ON COLUMN lead_journey_events.event_type IS 'Tipos: entry, re_entry, seller_assigned, status_change, campaign_change, sale, note';
COMMENT ON COLUMN lead_journey_events.utm_campaign IS 'Nome da campanha no Meta Ads / Google Ads';
COMMENT ON COLUMN lead_journey_events.utm_content  IS 'Identificador do anúncio específico';
COMMENT ON COLUMN lead_journey_events.utm_term     IS 'Conjunto de anúncios (ad set)';
