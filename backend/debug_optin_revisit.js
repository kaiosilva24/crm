import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- OPT-IN REVISIT ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // Teste Full Cycle ID: 1603728032 (from logs)
    const subscriberId = "1603728032";

    // Try update WITHOUT SMS opt-in
    try {
        console.log('Attempting update with has_opt_in_sms: FALSE');
        const res = await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/updateSubscriber`, {
            subscriber_id: subscriberId,
            phone: "+5562983160896",
            has_opt_in_sms: false, // Explicitly false!
            has_opt_in_email: true,
            consent_phrase: "Debug Revisit"
        }, { headers: { 'Authorization': `Bearer ${token}` } });
        console.log('✅ UPDATE NO-SMS: SUCCESS');
        console.log(JSON.stringify(res.data));
    } catch (e) {
        console.log('❌ UPDATE NO-SMS FAIL');
        if (e.response && e.response.data) {
            console.log('ERR:', JSON.stringify(e.response.data));
        } else {
            console.log('ERR:', e.message);
        }
    }
}

test();
