import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- FINAL FIX CHECK ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // Teste Full Cycle phone: 5562983160896
    const formats = [
        "5562983160896",
        "+5562983160896",
        "62983160896"
    ];

    for (const ph of formats) {
        try {
            console.log(`Searching params={phone: '${ph}'}...`);
            const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField`, {
                params: { phone: ph },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`✅ Result: ${JSON.stringify(res.data)}`);
        } catch (e) {
            console.log(`❌ Fail: ${e.response?.status}`);
            if (e.response?.data) console.log(JSON.stringify(e.response.data));
        }
    }
}

test();
