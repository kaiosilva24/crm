import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- FIND FORMATS ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    const formats = [
        "5562983160896",
        "+5562983160896",
        "62983160896",
        "+55 62 98316 0896",
        "+55 62 98316-0896",
        "+556298316-0896",
        "55 62 983160896"
    ];

    for (const ph of formats) {
        try {
            // Search URL
            const url = `${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField?field_name=phone&field_value=${encodeURIComponent(ph)}`;
            const res = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.data?.data?.id) {
                console.log(`FOUND [${ph}]: ID ${res.data.data.id} Name: ${res.data.data.first_name}`);
            } else {
                console.log(`[${ph}] Not found (empty)`);
            }
        } catch (e) {
            console.log(`[${ph}] Error: ${e.response?.status}`);
        }
    }
}

test();
