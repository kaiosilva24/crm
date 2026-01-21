import axios from 'axios';

const BACKEND = 'http://localhost:3001';

async function run() {
    try {
        console.log('🚀 TESTE COM DEBUG LOGS - Event 46');
        console.log('===================================\n');

        const payload = {
            event: "PURCHASE_OUT_OF_SHOPPING_CART",
            data: {
                buyer: {
                    email: "event46.debug@test.com",
                    name: "Debug WA",
                    phone: "5567981720357"
                },
                product: {
                    name: "Produto Event 46"
                }
            }
        };

        console.log('Enviando webhook...');
        const res = await axios.post(`${BACKEND}/api/cart-abandonment/webhook`, payload);
        console.log(`✅ Event ID: ${res.data.event_id}`);
        console.log('\n⚠️  OLHE O CONSOLE DO BACKEND AGORA!');
        console.log('Você verá logs detalhados do payload sendo enviado ao ManyChat.\n');

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

run();
