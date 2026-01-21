import axios from 'axios';

const BACKEND = 'http://localhost:3001';

async function run() {
    try {
        console.log('Aguardando você remover a TAG 1 do contato...');
        console.log('Pressione ENTER quando estiver pronto.');

        // Wait for user input
        await new Promise(resolve => {
            process.stdin.once('data', () => resolve());
        });

        console.log('\n🚀 TESTE FOCADO NA TAG 2 - Event 50');
        console.log('===================================\n');

        const payload = {
            event: "PURCHASE_OUT_OF_SHOPPING_CART",
            data: {
                buyer: {
                    email: "event50.tag2.test@hotmart.com",
                    name: "Debug WA",
                    phone: "5567981720357"
                },
                product: {
                    name: "Produto Event 50"
                }
            }
        };

        console.log('Enviando webhook...');
        const res = await axios.post(`${BACKEND}/api/cart-abandonment/webhook`, payload);
        const eventId = res.data.event_id;
        console.log(`✅ Event ID: ${eventId}`);
        console.log('\n⏱️  Aguardando 75 segundos para o fluxo completo...\n');

        await new Promise(resolve => setTimeout(resolve, 75000));

        console.log('📊 Verificando resultado...\n');

        // Check tags
        const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';
        const SUBSCRIBER_ID = '1299346751';
        const url = `https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=${SUBSCRIBER_ID}`;

        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const tags = response.data.data.tags.map(t => t.name);
        console.log('Tags ativas:', tags.join(', '));

        const hasTag1 = tags.includes('abandono_carrinho');
        const hasTag2 = tags.includes('abandono_carrinho_2');

        console.log('\n📋 Resultado:');
        console.log(hasTag1 ? '✅ Tag 1 aplicada' : '⚠️  Tag 1 não aplicada');
        console.log(hasTag2 ? '✅ Tag 2 aplicada' : '❌ Tag 2 NÃO aplicada');

        if (hasTag2) {
            console.log('\n🎉 SUCESSO! Tag 2 funcionando!');
        } else {
            console.log('\n⚠️  Tag 2 falhou. Verificando logs...');

            const login = await axios.post(`${BACKEND}/api/auth/login`, {
                email: 'admin@crm.com',
                password: 'admin123'
            });
            const token = login.data.token;
            const headers = { 'Authorization': `Bearer ${token}` };

            const logsRes = await axios.get(`${BACKEND}/api/cart-abandonment/logs?event_id=${eventId}`, { headers });
            const logs = logsRes.data.logs.reverse();

            console.log('\nLogs do evento:\n');
            logs.forEach(l => {
                if (l.action_type === 'second_message') {
                    console.log(`[${l.action_type}] ${l.status}: ${l.message}`);
                    if (l.error_message) console.log(`ERROR: ${l.error_message}`);
                }
            });
        }

    } catch (e) {
        console.error('Erro:', e.message);
    } finally {
        process.exit();
    }
}

run();
