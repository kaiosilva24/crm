import axios from 'axios';
import fs from 'fs';

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
        const logLines = logsRes.data.logs.map(l => {
            let line = `[${l.action_type}] ${l.status}: ${l.message}`;
            if (l.error_message) line += `\nERROR DETAIL: ${l.error_message}`;
            return line;
        }).join('\n\n');

        fs.writeFileSync('event_42_full.txt', logLines);
        console.log('Logs saved to event_42_full.txt');
        console.log('\n--- PREVIEW ---');
        console.log(logLines);

    } catch (e) {
        console.error(e.message);
    }
}
run();
