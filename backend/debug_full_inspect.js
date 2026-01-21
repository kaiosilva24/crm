import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- FULL JSON INSPECT ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // Suporte Kaio ID
    const targetId = "183534299";

    try {
        const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/getInfo`, {
            params: { subscriber_id: targetId },
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.data?.data) {
            console.log(JSON.stringify(res.data.data, null, 2));
        } else {
            console.log('❌ ID not found');
        }

    } catch (e) {
        console.log(`❌ ERROR: ${e.message}`);
    }
}

test();
