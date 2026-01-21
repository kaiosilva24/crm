import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- INSPECT ID 355829655 ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    const targetId = "355829655";

    try {
        const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/getInfo`, {
            params: { subscriber_id: targetId },
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.data?.data) {
            const sub = res.data.data;
            console.log(`ID: ${sub.id}`);
            console.log(`Name: ${sub.first_name} ${sub.last_name}`);
            console.log(`Phone: ${sub.phone}`);
            console.log(`Status: ${sub.status}`);
            console.log(`Link: https://manychat.com/fb/subscriber/${sub.id}`);
        } else {
            console.log('❌ ID not found');
        }

        console.log('\n--- CHECKING ORIGINAL 183534299 ---');
        const res2 = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/getInfo`, {
            params: { subscriber_id: "183534299" },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res2.data?.data) {
            const sub = res2.data.data;
            console.log(`ID: ${sub.id}`);
            console.log(`Name: ${sub.first_name} ${sub.last_name}`);
            console.log(`Phone: ${sub.phone}`);
        } else {
            console.log('❌ Original ID not found');
        }

    } catch (e) {
        console.log(`❌ ERROR: ${e.message}`);
    }
}

test();
