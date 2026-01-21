import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- CROSS CHECK ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // 1. Get Suporte Kaio Phone
    let kaioPhone = null;
    try {
        const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findByName?name=${encodeURIComponent("Suporte Kaio")}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.data?.data?.length > 0) {
            kaioPhone = res.data.data[0].phone;
            console.log(`✅ Suporte Kaio Phone: '${kaioPhone}'`);
        }
    } catch (e) { }

    if (!kaioPhone) {
        console.log('❌ Could not find Suporte Kaio phone');
        return;
    }

    // 2. Try to Update usage Kaio's Phone
    // This SHOULD fail with "Duplicate" if it works correctly.
    const targetId = "1603728032"; // Teste Full Cycle
    console.log(`\n🧪 Updating ID ${targetId} with '${kaioPhone}'...`);
    try {
        await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/updateSubscriber`, {
            subscriber_id: targetId,
            phone: kaioPhone, // Using EXISTING number
            has_opt_in_sms: true,
            has_opt_in_email: true,
            consent_phrase: "Debug Cross"
        }, { headers: { 'Authorization': `Bearer ${token}` } });
        console.log('✅ UPDATE SUCCESS (Unexpected - merged?)');
    } catch (e) {
        console.log(`❌ UPDATE FAIL: ${e.response?.data?.message}`);
        if (e.response?.data?.details) console.log(JSON.stringify(e.response.data.details));
    }
}

test();
