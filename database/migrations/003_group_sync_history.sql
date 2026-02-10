-- Migration: Criar tabela group_sync_history
-- Descrição: Armazena histórico de sincronizações de grupos para exibir última atualização

CREATE TABLE IF NOT EXISTS group_sync_history (
    id SERIAL PRIMARY KEY,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
    campaigns_processed INTEGER DEFAULT 0,
    groups_processed INTEGER DEFAULT 0,
    leads_in_group INTEGER DEFAULT 0,
    leads_not_in_group INTEGER DEFAULT 0,
    leads_updated INTEGER DEFAULT 0,
    duration_seconds DECIMAL(10,2),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar última sincronização rapidamente
CREATE INDEX IF NOT EXISTS idx_sync_history_started ON group_sync_history(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_history_status ON group_sync_history(status);

-- Comentários
COMMENT ON TABLE group_sync_history IS 'Histórico de sincronizações de grupos do WhatsApp';
COMMENT ON COLUMN group_sync_history.status IS 'Status: running, completed, failed';
COMMENT ON COLUMN group_sync_history.duration_seconds IS 'Duração da sincronização em segundos';
