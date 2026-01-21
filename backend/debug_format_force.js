import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- FORMAT FORCE ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    const targetId = "1603728032"; // Teste Full Cycle
    // Explicit format: +55 62 98316-0896
    const formatted = "+55 62 98316-0896";

    console.log(`\n🧪 Updating ID ${targetId} with '${formatted}'...`);
    try {
        await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/updateSubscriber`, {
            subscriber_id: targetId,
            phone: formatted,
            has_opt_in_sms: true,
            has_opt_in_email: true,
            consent_phrase: "Debug Format"
        }, { headers: { 'Authorization': `Bearer ${token}` } });
        console.log('✅ UPDATE SUCCESS');
    } catch (e) {
        console.log(`❌ UPDATE FAIL: ${e.response?.data?.message}`);
        if (e.response?.data?.details) console.log(JSON.stringify(e.response.data.details));
    }
}

test();
