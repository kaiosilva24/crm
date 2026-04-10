-- ============================================================
-- Migration: installment_plans
-- Rastreamento de planos de Parcelamento Inteligente (Hotmart)
-- is_historical = true  → migrado do CSV, não entra em métricas
-- is_historical = false → capturado ao vivo, entra em métricas
-- ============================================================

CREATE TABLE IF NOT EXISTS installment_plans (
    id                          SERIAL PRIMARY KEY,

    -- Vínculo com lead (pode ser null se lead não existe no CRM ainda)
    lead_uuid                   UUID REFERENCES leads(uuid) ON DELETE SET NULL,
    lead_email                  TEXT,
    lead_name                   TEXT,

    -- Produto / plataforma
    product_name                TEXT,
    platform                    TEXT DEFAULT 'hotmart',

    -- Valores financeiros por parcela
    -- gross = o que o COMPRADOR paga (Preço Total no CSV)
    -- net   = o que VOCÊ recebe (após taxas Hotmart + split co-produção)
    gross_installment_value     NUMERIC(10,2),
    net_installment_value       NUMERIC(10,2),
    currency                    TEXT DEFAULT 'BRL',
    has_coproduction            BOOLEAN DEFAULT FALSE,

    -- Progresso das parcelas
    total_installments          INTEGER NOT NULL,
    installments_paid           INTEGER DEFAULT 1,
    status                      TEXT DEFAULT 'active',
    -- status: 'active' | 'completed' | 'defaulted'

    -- Datas
    first_payment_at            TIMESTAMPTZ,
    last_payment_at             TIMESTAMPTZ,
    next_expected_at            TIMESTAMPTZ,   -- estimativa: last + 30 dias

    -- Controle histórico — CRÍTICO para não poluir métricas
    -- TRUE  = veio do CSV histórico → aparece no painel mas NÃO entra nos dashboards
    -- FALSE = capturado ao vivo via webhook → entra em todas as métricas
    is_historical               BOOLEAN DEFAULT FALSE,
    migration_source            TEXT,          -- 'csv_hotmart_abril_2026'
    metrics_start_date          TIMESTAMPTZ,   -- só conta em métricas após esta data

    -- Referência externa Hotmart
    hotmart_transaction         TEXT,

    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance nas queries
CREATE INDEX IF NOT EXISTS idx_installment_plans_lead_uuid  ON installment_plans(lead_uuid);
CREATE INDEX IF NOT EXISTS idx_installment_plans_email      ON installment_plans(lead_email);
CREATE INDEX IF NOT EXISTS idx_installment_plans_status     ON installment_plans(status);
CREATE INDEX IF NOT EXISTS idx_installment_plans_historical ON installment_plans(is_historical);
CREATE INDEX IF NOT EXISTS idx_installment_plans_next       ON installment_plans(next_expected_at);

-- Comentários de documentação
COMMENT ON TABLE installment_plans IS 'Planos de Parcelamento Inteligente Hotmart. is_historical=true para dados migrados do CSV (não entram em métricas de receita).';
COMMENT ON COLUMN installment_plans.gross_installment_value IS 'Valor bruto por parcela = o que o comprador paga (Preço Total no CSV da Hotmart)';
COMMENT ON COLUMN installment_plans.net_installment_value IS 'Valor líquido por parcela = o que o produtor recebe após taxas Hotmart e split de co-produção';
COMMENT ON COLUMN installment_plans.is_historical IS 'TRUE = migrado do CSV histórico. Aparece no painel de rastreamento mas NÃO entra nos dashboards de receita ao vivo.';
COMMENT ON COLUMN installment_plans.metrics_start_date IS 'Data a partir de quando este plano conta nas métricas. NULL = never (apenas histórico).';
