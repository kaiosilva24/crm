-- Verificar últimos leads do GreatPages
SELECT 
    id,
    first_name,
    email,
    phone,
    campaign_id,
    seller_id,
    source,
    created_at
FROM leads
WHERE source = 'greatpages'
ORDER BY created_at DESC
LIMIT 10;
