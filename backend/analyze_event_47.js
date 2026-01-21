import axios from 'axios';
import fs from 'fs';

const BACKEND = 'http://localhost:3001';
const EVENT_ID = 47;

async function run() {
    try {
        const login = await axios.post(`${BACKEND}/api/auth/login`, {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = login.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        const logsRes = await axios.get(`${BACKEND}/api/cart-abandonment/logs?event_id=${EVENT_ID}`, { headers });
        const logs = logsRes.data.logs.reverse();

        console.log(`📋 Event ${EVENT_ID} Logs:\n`);
        logs.forEach((l, i) => {
            console.log(`${i + 1}. [${l.action_type}] ${l.status}: ${l.message}`);
            if (l.error_message && !l.error_message.includes('code is updated')) {
                console.log(`   ❌ ${l.error_message}`);
            }
        });

        const logText = logs.map(l => {
            let line = `[${l.action_type}] ${l.status}: ${l.message}`;
            if (l.error_message) line += `\n   ERROR: ${l.error_message}`;
            return line;
        }).join('\n\n');

        fs.writeFileSync('event_47_logs.txt', logText);
        console.log('\nLogs salvos em event_47_logs.txt');

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

run();
