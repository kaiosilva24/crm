-- Criar evento de teste com erro (compatível com schema atual)
-- A tabela tem product_name mas não product_value

INSERT INTO cart_abandonment_events (
    uuid,
    contact_name,
    contact_phone,
    contact_email,
    product_name,
    status,
    error_message,
    in_campaign,
    created_at,
    event_type,
    payload
) VALUES (
    gen_random_uuid(), -- Gerar UUID
    'Teste Erro Campanha',
    '5511999998888',
    'teste.erro@example.com',
    'Produto Teste',
    'error',
    'Simulando falha no ManyChat (Tag não encontrada)',
    NULL,
    NOW(),
    'CART_ABANDONMENT',
    '{}'::jsonb
);

-- Verificar se foi criado
SELECT * FROM cart_abandonment_events ORDER BY created_at DESC LIMIT 1;
