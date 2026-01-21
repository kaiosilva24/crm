import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- FIND ERROR DIAGNOSTIC ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // Test known good number vs problematic number
    // Debug WA: 5567981720357 (Worked)
    // Full Cycle: 5562983160896 (Failed)

    const cases = [
        "5567981720357",
        "5562983160896",
        "+5562983160896"
    ];

    for (const ph of cases) {
        try {
            console.log(`Searching ${ph}...`);
            const url = `${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField?field_name=phone&field_value=${encodeURIComponent(ph)}`;
            const res = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } });
            console.log(`✅ [${ph}] Status: ${res.status}`);
            console.log(`   Data: ${JSON.stringify(res.data)}`);
        } catch (e) {
            console.log(`❌ [${ph}] Status: ${e.response?.status}`);
            console.log(`   Msg: ${JSON.stringify(e.response?.data)}`);
        }
    }
}

test();
