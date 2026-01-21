import axios from 'axios';

const BACKEND = 'http://localhost:3001';
const EVENT_ID = 42;

async function run() {
    try {
        const login = await axios.post(`${BACKEND}/api/auth/login`, {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = login.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        const logsRes = await axios.get(`${BACKEND}/api/cart-abandonment/logs?event_id=${EVENT_ID}`, { headers });

        // Filter for diagnostics
        const interesting = logsRes.data.logs.filter(l =>
            l.status === 'skipped' ||
            l.status === 'warning' ||
            l.action_type === 'system_check' ||
            l.message.includes('Recovered') ||
            l.message.includes('Fallback')
        );

        console.log(`Found ${interesting.length} diagnostic logs.`);
        interesting.forEach(l => {
            console.log(`[${l.action_type}] ${l.status}`);
            console.log(`MSG: ${l.message}`);
            if (l.error_message) console.log(`ERR: ${l.error_message}`);
            console.log('---');
        });

    } catch (e) {
        console.error(e.message);
    }
}

run();
