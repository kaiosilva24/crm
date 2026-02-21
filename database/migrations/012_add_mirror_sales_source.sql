-- Adiciona coluna para espelhar compradores de outra campanha
-- Permite que uma campanha consulte vendas de outra campanha para atualizar seus leads
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS mirror_sales_source_id INTEGER REFERENCES campaigns(id);
