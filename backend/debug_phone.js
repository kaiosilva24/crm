import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- PHONE CHECK ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // Test exact formats
    const phonesToTest = [
        "5562983160896",
        "+5562983160896"
    ];
    for (const ph of phonesToTest) {
        try {
            const url = `${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField?field_name=phone&field_value=${encodeURIComponent(ph)}`;
            const res = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } });
            console.log(`[${ph}] FOUND ID: ${res.data?.data?.id}`);
        } catch (e) {
            console.log(`[${ph}] FAIL: ${e.response?.status}`);
        }
    }
}

test();
