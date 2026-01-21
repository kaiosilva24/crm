-- Migration: Add round_robin_enabled to api_settings
-- Execute no SQL Editor do Supabase

ALTER TABLE api_settings 
ADD COLUMN IF NOT EXISTS round_robin_enabled BOOLEAN DEFAULT true;

-- Comentário explicativo
COMMENT ON COLUMN api_settings.round_robin_enabled IS 'Ativa ou desativa a distribuição automática Round-Robin de leads para vendedores';
