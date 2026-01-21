import axios from 'axios';

const WEBHOOK_URL = 'http://127.0.0.1:3001/api/cart-abandonment/webhook';

async function testWebhook() {
    console.log('🚀 Teste com Contato: 5562983160896\n');
    console.log('====================================\n');

    const payload = {
        contact_name: 'Teste Cliente',
        contact_phone: '5562983160896',
        contact_email: 'teste@example.com',
        product_name: 'Produto Teste',
        product_value: 97.00,
        checkout_url: 'https://example.com/checkout'
    };

    console.log('Enviando webhook...\n');

    try {
        const response = await axios.post(WEBHOOK_URL, payload);
        console.log('✅ Webhook aceito! Event ID:', response.data.event_id);
        console.log('\nAguarde:');
        console.log('   1. Tag "abandono_carrinho" deve ser aplicada imediatamente');
        console.log('   2. Tag "abandono_carrinho_2" deve aparecer após 1 minuto');
    } catch (error) {
        console.error('❌ Erro:', error.message);
        if (error.code) console.error('   Code:', error.code);
        if (error.address) console.error('   Address:', error.address);
        if (error.port) console.error('   Port:', error.port);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data));
        }
    }
}

testWebhook();
