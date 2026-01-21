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

        // Get latest 3 events
        const eventsRes = await axios.get(`${BACKEND}/api/cart-abandonment/events?limit=3`, { headers });
        const events = eventsRes.data.events;

        console.log('\n📋 Últimos eventos:\n');
        events.forEach(e => {
            console.log(`Event ${e.id}: ${e.contact_email} - Status: ${e.status}`);
        });

        if (events.length === 0) {
            console.log('❌ Nenhum evento encontrado!');
            console.log('Backend pode estar com problema.');
            return;
        }

        const latestEvent = events[0];
        console.log(`\n🔍 Analisando Event ${latestEvent.id}:`);
        console.log(`Email: ${latestEvent.contact_email}`);
        console.log(`Status: ${latestEvent.status}`);
        console.log(`Subscriber ID: ${latestEvent.manychat_subscriber_id || 'NULL'}`);

        // Get logs
        const logsRes = await axios.get(`${BACKEND}/api/cart-abandonment/logs?event_id=${latestEvent.id}`, { headers });
        const logs = logsRes.data.logs.reverse();

        console.log(`\nLogs (${logs.length} total):\n`);
        logs.forEach((l, i) => {
            console.log(`${i + 1}. [${l.action_type}] ${l.status}: ${l.message}`);
            if (l.error_message && !l.error_message.includes('code is updated')) {
                const errorPreview = l.error_message.length > 100
                    ? l.error_message.substring(0, 100) + '...'
                    : l.error_message;
                console.log(`   ❌ ${errorPreview}`);
            }
        });

    } catch (e) {
        console.error('❌ Erro:', e.message);
        if (e.code === 'ECONNREFUSED') {
            console.log('\n⚠️  Backend não está respondendo!');
            console.log('Verifique se o servidor está rodando.');
        }
    }
}

run();
