import axios from 'axios';

const BACKEND = 'http://localhost:3001';
const EVENT_ID = 50; // Do teste anterior

async function run() {
    try {
        console.log(`📋 Verificando Event ${EVENT_ID}...\n`);

        const login = await axios.post(`${BACKEND}/api/auth/login`, {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = login.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        const logsRes = await axios.get(`${BACKEND}/api/cart-abandonment/logs?event_id=${EVENT_ID}`, { headers });
        const logs = logsRes.data.logs.reverse();

        console.log('Logs do evento:\n');
        logs.forEach((l, i) => {
            const icon = l.status === 'success' ? '✅' : l.status === 'error' ? '❌' : '⚠️';
            console.log(`${i + 1}. ${icon} [${l.action_type}] ${l.message}`);
            if (l.error_message && !l.error_message.includes('code is updated')) {
                console.log(`   ERROR: ${l.error_message.substring(0, 150)}`);
            }
        });

        // Check tags on contact
        console.log('\n🏷️  Verificando tags no ManyChat...');
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
        console.log('Tags ativas:', tags.length > 0 ? tags.join(', ') : 'NENHUMA');

        const hasTag1 = tags.includes('abandono_carrinho');
        const hasTag2 = tags.includes('abandono_carrinho_2');

        console.log('\n📊 Resultado:');
        console.log(hasTag1 ? '✅ Tag 1 aplicada' : '❌ Tag 1 faltando');
        console.log(hasTag2 ? '✅ Tag 2 aplicada' : '❌ Tag 2 faltando');

        if (hasTag1 && hasTag2) {
            console.log('\n🎉 SUCESSO! Ambas as tags funcionando!');
        }

    } catch (e) {
        console.error('Erro:', e.message);
        if (e.code === 'ECONNREFUSED') {
            console.log('\n⚠️  Backend offline. Aguarde reiniciar e tente novamente.');
        }
    }
}

run();
