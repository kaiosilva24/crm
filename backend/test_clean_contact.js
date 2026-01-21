import axios from 'axios';

// Using IPv4 loopback to avoid localhost issues
const WEBHOOK_URL = 'http://127.0.0.1:3001/api/cart-abandonment/webhook';

async function testWebhook() {
    console.log('🚀 Teste com Contato Limpo: 5567981720357\n');
    console.log('====================================\n');

    // Payload simulating Hotmart webhook
    // Payload simulating Hotmart webhook (Nested structure required)
    const payload = {
        id: "evt_test_123",
        event: "PURCHASE_OUT_OF_SHOPPING_CART",
        data: {
            buyer: {
                name: 'Teste Novo Kaio',
                checkout_phone: '5567981720357',
                email: 'kaio.teste@example.com'
            },
            product: {
                id: 12345,
                name: 'Produto Teste',
            },
            purchase: {
                transaction: 'HP000000000001',
                price: { value: 97.00 }
            }
        },
        checkout_url: 'https://example.com/checkout'
    };

    console.log('Enviando webhook...\n');

    try {
        const response = await axios.post(WEBHOOK_URL, payload);
        console.log('✅ Webhook aceito! Event ID:', response.data.event_id);
        console.log('\nAguarde:');
        console.log('   1. O sistema deve CRIAR um novo contato (ID Novo)');
        console.log('   2. Tag "abandono_carrinho" deve ser aplicada imediatamente');
        console.log('   3. Tag "abandono_carrinho_2" deve aparecer após 1 minuto');
    } catch (error) {
        console.error('❌ Erro:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data));
        }
    }
}

testWebhook();
