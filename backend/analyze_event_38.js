import axios from 'axios';

const BACKEND = 'http://localhost:3001';
// We just ran event 38
const EVENT_ID = 38;

async function run() {
    try {
        const login = await axios.post(`${BACKEND}/api/auth/login`, {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = login.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        console.log(`Getting logs for Event ${EVENT_ID}...`);
        const logsRes = await axios.get(`${BACKEND}/api/cart-abandonment/logs?event_id=${EVENT_ID}`, { headers });
        const logs = logsRes.data.logs;

        const fallbackLogs = logs.filter(l =>
            l.message?.includes('Search Name') ||
            l.message?.includes('Fallback exception') ||
            l.action_type === 'create_subscriber'
        );

        if (fallbackLogs.length === 0) {
            console.log('No fallback logs found. Did it skip catch block?');
            // Print all logs
            logs.forEach(l => console.log(`[${l.action_type}] ${l.status}: ${l.message}`));
        } else {
            fallbackLogs.forEach(l => {
                console.log(`[${l.action_type}] ${l.status}`);
                console.log(`MSG: ${l.message}`);
                console.log(`ERR: ${l.error_message || 'N/A'}`);
                console.log('---');
            });
        }

    } catch (e) {
        console.error(e.message);
    }
}

run();
