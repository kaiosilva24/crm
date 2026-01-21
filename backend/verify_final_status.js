import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    const phone = "+5567981720357";
    const targetId = "183534299";

    console.log('--- 1. SEARCH BY PHONE ---');
    try {
        const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField`, {
            params: { phone: phone },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.data?.data) {
            console.log(`✅ FOUND ID: ${res.data.data.id}`);
            console.log(`   Name: ${res.data.data.first_name}`);
        } else {
            console.log('❌ Phone Search returned NULL');
        }
    } catch (e) { console.log('Err:', e.message); }

    console.log('\n--- 2. INSPECT 183534299 ---');
    try {
        const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/getInfo`, {
            params: { subscriber_id: targetId },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.data?.data) {
            console.log(`   ID: ${res.data.data.id}`);
            console.log(`   Phone: ${res.data.data.phone}`);
            console.log(`   Status: ${res.data.data.status}`);
        } else {
            console.log('❌ ID 183534299 not found (Deleted?)');
        }
    } catch (e) { // If 404, it's deleted/missing
        if (e.response && e.response.status === 404) console.log('❌ ID 183534299 is GONE (404)');
        else console.log('Err:', e.message);
    }
}

test();
