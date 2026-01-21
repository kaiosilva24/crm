import axios from 'axios';

const BACKEND = 'http://localhost:3001';

async function run() {
    try {
        console.log('🚀 TESTE DEBUG COMPLETO - Event 48');
        console.log('====================================\n');

        const payload = {
            event: "PURCHASE_OUT_OF_SHOPPING_CART",
            data: {
                buyer: {
                    email: "event48.debug@test.com",
                    name: "Debug WA",
                    phone: "5567981720357"
                },
                product: {
                    name: "Produto Event 48"
                }
            }
        };

        console.log('Enviando webhook...');
        const res = await axios.post(`${BACKEND}/api/cart-abandonment/webhook`, payload);
        console.log(`✅ Event ID: ${res.data.event_id}`);
        console.log('\n⚠️  OLHE O CONSOLE DO BACKEND!');
        console.log('Procure por: "🔍 DEBUG BEFORE TAG"');
        console.log('Isso mostrará o subscriberId sendo passado.\n');

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

run();
