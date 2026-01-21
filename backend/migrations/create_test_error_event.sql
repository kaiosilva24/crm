-- Criar evento de teste com erro (versão simplificada)

INSERT INTO cart_abandonment_events (
    contact_name,
    contact_phone,
    contact_email,
    status,
    error_message,
    in_campaign,
    created_at
) VALUES (
    'Teste Erro Campanha',
    '5511999998888',
    'teste.erro@example.com',
    'error',
    'Simulando falha no ManyChat (Tag não encontrada)',
    NULL, -- Pendente - ainda não verificado
    NOW()
);

-- Verificar se foi criado
SELECT * FROM cart_abandonment_events ORDER BY created_at DESC LIMIT 1;
