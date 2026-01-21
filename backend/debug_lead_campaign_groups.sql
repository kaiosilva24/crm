-- Debug query para verificar se lead_campaign_groups está funcionando
-- Execute no Supabase SQL Editor

-- 1. Verificar dados na tabela lead_campaign_groups
SELECT 
    COUNT(*) as total_registros,
    COUNT(DISTINCT lead_id) as leads_unicos,
    COUNT(DISTINCT campaign_id) as campanhas,
    SUM(CASE WHEN in_group = true THEN 1 ELSE 0 END) as no_grupo,
    SUM(CASE WHEN in_group = false THEN 1 ELSE 0 END) as fora_grupo
FROM lead_campaign_groups;

-- 2. Ver alguns exemplos de dados
SELECT 
    lcg.lead_id,
    l.first_name,
    lcg.campaign_id,
    c.name as campaign_name,
    lcg.in_group,
    l.in_group as in_group_global
FROM lead_campaign_groups lcg
JOIN leads l ON l.id = lcg.lead_id
JOIN campaigns c ON c.id = lcg.campaign_id
LIMIT 20;

-- 3. Verificar se há leads sem registro em lead_campaign_groups
SELECT 
    COUNT(*) as leads_sem_registro
FROM leads l
LEFT JOIN lead_campaign_groups lcg ON lcg.lead_id = l.id AND lcg.campaign_id = l.campaign_id
WHERE l.campaign_id IS NOT NULL
  AND lcg.id IS NULL;
