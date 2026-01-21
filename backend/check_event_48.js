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

        const eventsRes = await axios.get(`${BACKEND}/api/cart-abandonment/events?limit=1`, { headers });
        const latestEvent = eventsRes.data.events[0];

        console.log(`\n📋 Event ${latestEvent.id}`);
        console.log(`Email: ${latestEvent.contact_email}`);
        console.log(`Status: ${latestEvent.status}`);
        console.log(`Subscriber ID: ${latestEvent.manychat_subscriber_id || 'NULL'}\n`);

        const logsRes = await axios.get(`${BACKEND}/api/cart-abandonment/logs?event_id=${latestEvent.id}`, { headers });
        const logs = logsRes.data.logs.reverse();

        console.log(`Logs:\n`);
        logs.forEach((l, i) => {
            console.log(`${i + 1}. [${l.action_type}] ${l.status}: ${l.message}`);
            if (l.error_message && !l.error_message.includes('code is updated')) {
                console.log(`   ❌ ${l.error_message}`);
            }
        });

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

run();
