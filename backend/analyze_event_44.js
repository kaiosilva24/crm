import axios from 'axios';
import fs from 'fs';

const BACKEND = 'http://localhost:3001';
const EVENT_ID = 44; // From test output

async function run() {
    try {
        const login = await axios.post(`${BACKEND}/api/auth/login`, {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = login.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        const logsRes = await axios.get(`${BACKEND}/api/cart-abandonment/logs?event_id=${EVENT_ID}`, { headers });
        const logs = logsRes.data.logs;

        console.log(`📋 Logs do Event ${EVENT_ID}:\n`);
        logs.forEach(l => {
            console.log(`[${l.action_type}] ${l.status}: ${l.message}`);
            if (l.error_message) console.log(`   ERROR: ${l.error_message}`);
            console.log('');
        });

        // Save to file
        const logText = logs.map(l => {
            let line = `[${l.action_type}] ${l.status}: ${l.message}`;
            if (l.error_message) line += `\n   ERROR: ${l.error_message}`;
            return line;
        }).join('\n\n');

        fs.writeFileSync('event_44_logs.txt', logText);
        console.log('Logs salvos em event_44_logs.txt');

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

run();
