import axios from 'axios';

const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';
const BASE = 'https://api.manychat.com';
const phone = '+5567981720357'; // With +

async function run() {
    console.log(`Checking ${phone}...`);
    try {
        const res = await axios.get(`${BASE}/fb/subscriber/findBySystemField?field_name=phone&field_value=%2B5567981720357`, {
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
        });
        console.log('Result:', JSON.stringify(res.data));
    } catch (e) {
        process.stdout.write(JSON.stringify(e.response?.data || { message: e.message }));
    }
}

run();
