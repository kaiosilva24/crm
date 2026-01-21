import axios from 'axios';

const BACKEND = 'http://localhost:3001';

async function run() {
    try {
        console.log('🚀 TESTE FINAL - Event 45');
        console.log('=========================\n');

        const payload = {
            event: "PURCHASE_OUT_OF_SHOPPING_CART",
            data: {
                buyer: {
                    email: "event45.test@hotmart.com",
                    name: "Debug WA",
                    phone: "5567981720357"
                },
                product: {
                    name: "Produto Event 45"
                }
            }
        };

        console.log('Enviando webhook...');
        const res = await axios.post(`${BACKEND}/api/cart-abandonment/webhook`, payload);
        console.log(`✅ Event ID: ${res.data.event_id}`);
        console.log('\n⚠️  MONITORE O CONSOLE DO BACKEND para ver os logs em tempo real!');
        console.log('Aguarde 75 segundos...\n');

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

run();
