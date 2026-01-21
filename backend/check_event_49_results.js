import axios from 'axios';

const BACKEND = 'http://localhost:3001';

async function run() {
    try {
        await new Promise(resolve => setTimeout(resolve, 8000)); // Wait 8 seconds

        const login = await axios.post(`${BACKEND}/api/auth/login`, {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = login.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        const eventsRes = await axios.get(`${BACKEND}/api/cart-abandonment/events?limit=1`, { headers });
        const latestEvent = eventsRes.data.events[0];

        console.log(`\n📋 Event ${latestEvent.id}: ${latestEvent.contact_email}`);
        console.log(`Status: ${latestEvent.status}`);
        console.log(`Subscriber ID: ${latestEvent.manychat_subscriber_id || 'NULL'}\n`);

        const logsRes = await axios.get(`${BACKEND}/api/cart-abandonment/logs?event_id=${latestEvent.id}`, { headers });
        const logs = logsRes.data.logs.reverse();

        console.log(`Logs:\n`);
        logs.forEach((l, i) => {
            const status = l.status === 'success' ? '✅' : l.status === 'error' ? '❌' : '⚠️';
            console.log(`${status} [${l.action_type}] ${l.message}`);
        });

        // Check tags
        console.log('\n🏷️  Verificando tags...');
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
        console.log(hasTag1 ? '\n✅ Tag 1 aplicada!' : '\n❌ Tag 1 faltando');

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

run();
