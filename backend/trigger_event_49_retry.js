import axios from 'axios';

const BACKEND = 'http://localhost:3001';

async function run() {
    try {
        console.log('🚀 TESTE FINAL COM RETRY LOGIC - Event 49');
        console.log('==========================================\n');

        const payload = {
            event: "PURCHASE_OUT_OF_SHOPPING_CART",
            data: {
                buyer: {
                    email: "event49.final.retry@test.com",
                    name: "Debug WA",
                    phone: "5567981720357"
                },
                product: {
                    name: "Produto Event 49 Final"
                }
            }
        };

        console.log('Enviando webhook...');
        const res = await axios.post(`${BACKEND}/api/cart-abandonment/webhook`, payload);
        console.log(`✅ Event ID: ${res.data.event_id}`);
        console.log('\n⚠️  Código atualizado com:');
        console.log('- Retry logic (3 tentativas)');
        console.log('- Conversão explícita de subscriber_id para string');
        console.log('- Delay de 1s entre tentativas\n');

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

run();
