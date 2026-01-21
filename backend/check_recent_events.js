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

        // Get latest events
        const eventsRes = await axios.get(`${BACKEND}/api/cart-abandonment/events?limit=3`, { headers });
        const events = eventsRes.data.events;

        console.log('\n📋 Últimos 3 eventos:\n');
        events.forEach(e => {
            console.log(`Event ${e.id}: ${e.contact_email}`);
            console.log(`  Status: ${e.status}`);
            console.log(`  Tag 1 enviada: ${e.first_message_sent ? 'SIM' : 'NÃO'}`);
            console.log(`  Tag 2 enviada: ${e.second_message_sent ? 'SIM' : 'NÃO'}`);
            console.log('');
        });

        // Check latest event logs
        if (events.length > 0) {
            const latestEvent = events[0];
            console.log(`\n🔍 Logs do Event ${latestEvent.id}:\n`);

            const logsRes = await axios.get(`${BACKEND}/api/cart-abandonment/logs?event_id=${latestEvent.id}`, { headers });
            const logs = logsRes.data.logs.reverse();

            logs.forEach(l => {
                const icon = l.status === 'success' ? '✅' : l.status === 'error' ? '❌' : '⚠️';
                console.log(`${icon} [${l.action_type}] ${l.message}`);
            });
        }

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

run();
