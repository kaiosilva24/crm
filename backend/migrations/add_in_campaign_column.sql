-- Adicionar coluna in_campaign à tabela cart_abandonment_events
-- Esta coluna armazena se o contato foi encontrado na campanha configurada

ALTER TABLE cart_abandonment_events 
ADD COLUMN IF NOT EXISTS in_campaign BOOLEAN DEFAULT NULL;

-- NULL = ainda não verificado
-- true = encontrado na campanha
-- false = não encontrado na campanha

COMMENT ON COLUMN cart_abandonment_events.in_campaign IS 'Indica se o contato foi encontrado na campanha configurada: NULL=não verificado, true=encontrado, false=não encontrado';
