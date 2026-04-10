fetch('https://crm.discloud.app/api/webhook/gateway/looma', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        event: 'charge.succeeded',
        data: {
            customer: {
                name: 'Carla Ferreira (Teste Looma)',
                email: 'carla.ferreira@hotmail.com',
                phone: '31988776655'
            },
            product: {
                name: 'Mentoria Express'
            },
            amount: 497.00,
            net_amount: 420.00,
            currency: 'BRL',
            utm: {
                source: 'instagram',
                campaign: 'Remarketing_7D',
                medium: 'stories'
            }
        }
    })
}).then(r=>r.text()).then(console.log).catch(console.error);
