-- Adicionar coluna provider para suportar múltiplos providers (baileys/whapi)
ALTER TABLE whatsapp_connections 
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'baileys';

-- Adicionar colunas para suporte a Pairing Code (Redirect+)
ALTER TABLE whatsapp_connections 
ADD COLUMN IF NOT EXISTS pairing_code VARCHAR(10);

ALTER TABLE whatsapp_connections 
ADD COLUMN IF NOT EXISTS pairing_phone VARCHAR(20);

-- Atualizar comentários para status
COMMENT ON COLUMN whatsapp_connections.status IS 'Status: disconnected, connecting, waiting_pairing, connected';
COMMENT ON COLUMN whatsapp_connections.provider IS 'Provider: baileys (local) ou whapi (cloud API)';
COMMENT ON COLUMN whatsapp_connections.pairing_code IS 'Código de pareamento para método Redirect+';
COMMENT ON COLUMN whatsapp_connections.pairing_phone IS 'Número de telefone usado para gerar o código de pareamento';
