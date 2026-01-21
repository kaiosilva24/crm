import axios from 'axios';

const BACKEND = 'http://localhost:3001';

async function run() {
    try {
        console.log('🚀 Teste Simples - Apenas Webhook');
        console.log('==================================\n');

        const payload = {
            event: "PURCHASE_OUT_OF_SHOPPING_CART",
            data: {
                buyer: {
                    email: `teste.kaio.${Date.now()}@test.com`,
                    name: "Suporte Kaio",
                    checkout_phone: "5567981720357"
                },
                product: {
                    name: "Produto Teste Revalidação"
                }
            }
        };

        console.log('Enviando webhook...');
        const res = await axios.post(`${BACKEND}/api/cart-abandonment/webhook`, payload, {
            timeout: 10000
        });

        console.log(`✅ Webhook aceito! Event ID: ${res.data.event_id}`);
        console.log('\n⏱️  Aguarde 75 segundos e verifique manualmente no ManyChat:');
        console.log('   1. Tag "abandono_carrinho" deve aparecer imediatamente');
        console.log('   2. Tag "abandono_carrinho_2" deve aparecer após 1 minuto');
        console.log(`\nEvent ID para referência: ${res.data.event_id}`);

    } catch (e) {
        if (e.code === 'ECONNRESET' || e.code === 'ECONNREFUSED') {
            console.error('❌ Backend não está respondendo.');
            console.log('\nTente reiniciar o backend:');
            console.log('1. Ctrl+C no terminal do backend');
            console.log('2. npm run dev novamente');
        } else {
            console.error('❌ Erro:', e.message);
        }
    }
}

run();
