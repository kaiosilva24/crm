import axios from 'axios';
const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';
const BASE = 'https://api.manychat.com';

async function run() {
    try {
        console.log('Checking /fb/page/getInfo...');
        const res = await axios.get(`${BASE}/fb/page/getInfo`, {
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
        });
        console.log('Page Info:', JSON.stringify(res.data));
    } catch (e) {
        console.log('Error:', e.message);
        if (e.response) console.log('Response:', e.response.status, e.response.data);
    }
}
run();
