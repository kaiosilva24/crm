-- Execute esta migration no Supabase SQL Editor
-- https://supabase.com/dashboard/project/_/sql

ALTER TABLE whatsapp_connections 
ADD COLUMN IF NOT EXISTS pairing_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS pairing_phone VARCHAR(20);

COMMENT ON COLUMN whatsapp_connections.pairing_code IS 'Código de pareamento de 8 dígitos para vincular WhatsApp';
COMMENT ON COLUMN whatsapp_connections.pairing_phone IS 'Número de telefone usado para gerar o pairing code';

-- Verificar que as colunas foram criadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_connections'
ORDER BY ordinal_position;
