-- Migration: Adicionar coluna whatsapp_groups na tabela leads
-- Para armazenar em quais grupos do WhatsApp o lead está

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS whatsapp_groups TEXT;

COMMENT ON COLUMN leads.whatsapp_groups IS 'Lista de grupos do WhatsApp que o lead participa (separados por vírgula)';
