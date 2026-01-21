import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- CROSS HARDCODED ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // Suporte Kaio Phone (Hardcoded)
    const kaioPhone = "+5567981720357";
    const targetId = "1603728032"; // Teste Full Cycle

    console.log(`\n🧪 Updating ID ${targetId} with '${kaioPhone}'...`);
    try {
        await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/updateSubscriber`, {
            subscriber_id: targetId,
            phone: kaioPhone,
            has_opt_in_sms: true,
            has_opt_in_email: true,
            consent_phrase: "Debug Cross Hard"
        }, { headers: { 'Authorization': `Bearer ${token}` } });
        console.log('✅ UPDATE SUCCESS (Merged?)');
    } catch (e) {
        console.log(`❌ UPDATE FAIL: ${e.response?.data?.message}`);
        if (e.response?.data?.details) console.log(JSON.stringify(e.response.data.details));
    }
}

test();
