import axios from 'axios';
import fs from 'fs';

const BACKEND = 'http://localhost:3001';
const EVENT_ID = 41;

async function run() {
    try {
        const login = await axios.post(`${BACKEND}/api/auth/login`, {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = login.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Check Settings
        const res = await axios.get(`${BACKEND}/api/cart-abandonment/settings`, { headers });
        const tagName = res.data.settings.manychat_tag_name;
        fs.writeFileSync('setting_value.txt', `Tag Name: "${tagName}"\nLength: ${tagName.length}`);

        // 2. Check Logs
        const logsRes = await axios.get(`${BACKEND}/api/cart-abandonment/logs?event_id=${EVENT_ID}`, { headers });
        const logLines = logsRes.data.logs.map(l => {
            let line = `[${l.action_type}] ${l.status}: ${l.message}`;
            if (l.error_message) line += ` | ERR: ${l.error_message}`;
            return line;
        }).join('\n');
        fs.writeFileSync('logs_event_41.txt', logLines);

        console.log('Files written.');

    } catch (e) {
        console.error(e.message);
    }
}
run();
