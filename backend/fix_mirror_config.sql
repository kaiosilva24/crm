-- Correção da Configuração Mirror Buyers
-- Problema: Configuração está invertida

-- 1. Remover configuração incorreta da campanha "LP 06 JAN SUPER INTERESSADOS"
UPDATE campaigns 
SET mirror_sales_source_id = NULL,
    updated_at = NOW()
WHERE id = 10;

-- 2. Adicionar configuração correta na campanha "ALUNOS AVANÇADO"
UPDATE campaigns 
SET mirror_sales_source_id = 10,
    updated_at = NOW()
WHERE id = 7;

-- 3. Verificar resultado
SELECT 
    id,
    name,
    mirror_sales_source_id,
    (SELECT name FROM campaigns WHERE id = c.mirror_sales_source_id) as espelha_de
FROM campaigns c
WHERE id IN (7, 10)
ORDER BY id;
