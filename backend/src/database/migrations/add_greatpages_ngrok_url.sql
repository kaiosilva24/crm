-- Migration: Add GreatPages ngrok URL to api_settings
-- Execute no SQL Editor do Supabase

ALTER TABLE api_settings 
ADD COLUMN IF NOT EXISTS greatpages_ngrok_url TEXT;

-- Comentário explicativo
COMMENT ON COLUMN api_settings.greatpages_ngrok_url IS 'URL do ngrok para testes do GreatPages em ambiente local';
