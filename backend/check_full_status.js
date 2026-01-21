import axios from 'axios';

const BACKEND = 'http://localhost:3001';

async function run() {
    try {
        const login = await axios.post(`${BACKEND}/api/auth/login`, {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = login.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        // Get latest event
        const eventsRes = await axios.get(`${BACKEND}/api/cart-abandonment/events?limit=1`, { headers });
        const latestEvent = eventsRes.data.events[0];

        console.log(`\n📋 Evento ${latestEvent.id}`);
        console.log(`Email: ${latestEvent.contact_email}`);
        console.log(`Status: ${latestEvent.status}\n`);

        // Get logs
        const logsRes = await axios.get(`${BACKEND}/api/cart-abandonment/logs?event_id=${latestEvent.id}`, { headers });
        const logs = logsRes.data.logs.reverse(); // Reverse to show chronological order

        console.log(`Logs (ordem cronológica):\n`);
        logs.forEach((l, i) => {
            console.log(`${i + 1}. [${l.action_type}] ${l.status}: ${l.message}`);
            if (l.error_message && l.error_message !== 'If you see this, code is updated') {
                console.log(`   ❌ ERROR: ${l.error_message}`);
            }
        });

        // Check tags on contact
        console.log('\n🏷️  Verificando tags no contato...');
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

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

run();
