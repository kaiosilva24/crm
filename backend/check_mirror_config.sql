-- Verificar configuração de espelhamento das campanhas
SELECT 
    id,
    name,
    mirror_campaign_id,
    is_active
FROM campaigns 
ORDER BY id;
