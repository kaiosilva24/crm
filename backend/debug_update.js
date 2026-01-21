import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- UPDATE DIAGNOSTIC ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // The ID for "Teste Full Cycle" from screenshot/logs could be 1603728032 (based on screenshot)
    // Let's verify finding by name first

    let subscriberId = null;

    try {
        const name = "Teste Full Cycle";
        const url = `${MANYCHAT_API_BASE}/fb/subscriber/findByName?name=${encodeURIComponent(name)}`;
        const res = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.data?.data?.length > 0) {
            subscriberId = res.data.data[0].id;
            console.log(`FOUND ID: ${subscriberId}`);
        } else {
            console.log('NOT FOUND BY NAME');
        }
    } catch (e) { console.log('Search Error', e.message); }

    if (subscriberId) {
        console.log(`Attempting update for ${subscriberId}...`);
        try {
            const payload = {
                subscriber_id: subscriberId,
                phone: "5562983160896",
                has_opt_in_sms: true,
                has_opt_in_email: true,
                consent_phrase: "Debug Update"
            };
            await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/updateSubscriber`, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('UPDATE SUCCESS');
        } catch (e) {
            console.log('UPDATE FAIL:', e.response?.status);
            console.log('MSG:', JSON.stringify(e.response?.data));
            if (e.response?.data?.details) console.log('DETAILS:', JSON.stringify(e.response.data.details));
        }
    }
}

test();
