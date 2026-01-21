import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- CLASH V2 ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // ID for "Teste Full Cycle"
    let subscriberId = "1603728032";

    // 1. Modified
    try {
        await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/updateSubscriber`, {
            subscriber_id: subscriberId,
            phone: "+5562983160895",
            has_opt_in_sms: true,
            has_opt_in_email: true
        }, { headers: { 'Authorization': `Bearer ${token}` } });
        console.log('[1] MODIFIED: OK');
    } catch (e) {
        console.log('[1] MODIFIED FAIL:', e.response?.data?.message);
        if (e.response?.data?.details) console.log('    DETAILS:', JSON.stringify(e.response.data.details));
    }

    // 2. Original
    try {
        await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/updateSubscriber`, {
            subscriber_id: subscriberId,
            phone: "+5562983160896",
            has_opt_in_sms: true,
            has_opt_in_email: true
        }, { headers: { 'Authorization': `Bearer ${token}` } });
        console.log('[2] ORIGINAL: OK');
    } catch (e) {
        console.log('[2] ORIGINAL FAIL:', e.response?.data?.message);
        if (e.response?.data?.details) console.log('    DETAILS:', JSON.stringify(e.response.data.details));
    }
}

test();
