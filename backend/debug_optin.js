import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- OPT-IN CHECK ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // ID for "Teste Full Cycle" (1603728032)
    let subscriberId = "1603728032";

    // Try without SMS opt-in
    try {
        console.log('Sending...');
        await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/updateSubscriber`, {
            subscriber_id: subscriberId,
            phone: "+5562983160896",
            // has_opt_in_sms: true, // COMMENTED OUT
            // has_opt_in_email: true
        }, { headers: { 'Authorization': `Bearer ${token}` } });
        console.log('✅ UPDATE NO-OPT: SUCCESS');
    } catch (e) {
        console.log('❌ UPDATE NO-OPT FAIL');
        if (e.response && e.response.data && e.response.data.details) {
            const d = e.response.data.details;
            // Extract plain messages
            const msgs = [];
            if (d.messages) {
                for (const k in d.messages) {
                    msgs.push(`${k}: ${d.messages[k]}`);
                }
            }
            console.log('ERR:', msgs.join(' | '));
        } else {
            console.log('ERR:', e.message);
        }
    }
}

test();
