import axios from 'axios';

const BACKEND = 'http://localhost:3001';
const EVENT_ID = 41;

async function run() {
    try {
        console.log('Logging in...');
        const login = await axios.post(`${BACKEND}/api/auth/login`, {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = login.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        console.log(`Getting logs for Event ${EVENT_ID}...`);
        const logsRes = await axios.get(`${BACKEND}/api/cart-abandonment/logs?event_id=${EVENT_ID}`, { headers });

        const logs = logsRes.data.logs;
        const tagLog = logs.find(l => l.action_type === 'first_message');

        if (logs.length > 0) {
            logs.forEach(l => {
                console.log(`[${l.action_type}] ${l.status}: ${l.message}`);
                if (l.error_message) console.log(`ERR: ${l.error_message}`);
            });
        } else {
            console.log('No logs found.');
        }

    } catch (e) {
        console.error('Script Error:', e.message);
        if (e.response) console.log('Response:', JSON.stringify(e.response.data));
    }
}

run();
