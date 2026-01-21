import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- INSPECT & VALIDATE ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // 1. Inspect "Suporte Kaio" (Known Good)
    const knownGoodName = "Suporte Kaio";
    console.log(`\n🔍 Inspecting: ${knownGoodName}`);
    try {
        const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findByName?name=${encodeURIComponent(knownGoodName)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.data?.data && res.data.data.length > 0) {
            const data = res.data.data[0];
            console.log(`✅ FOUND Suporte Kaio:`);
            console.log(`   Phone: ${data.phone}`);
            console.log(`   ID: ${data.id}`);
        } else {
            console.log('❌ Suporte Kaio not found');
        }
    } catch (e) { console.log('Err:', e.message); }

    // 2. Validate Update on "Teste Full Cycle" (ID 1603728032)
    const targetId = "1603728032";

    // Test A: Random Valid Sao Paulo Number
    // +55 11 98888-8888
    const testA = "+5511988888888";
    console.log(`\n🧪 Testing Update with ${testA}...`);
    try {
        await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/updateSubscriber`, {
            subscriber_id: targetId,
            phone: testA,
            has_opt_in_sms: true,
            has_opt_in_email: true
        }, { headers: { 'Authorization': `Bearer ${token}` } });
        console.log('✅ Update A SUCCESS');
    } catch (e) {
        console.log(`❌ Update A FAIL: ${e.response?.data?.message}`);
        if (e.response?.data?.details) console.log(JSON.stringify(e.response.data.details));
    }

    // Test B: Original Number, NO PLUS
    // 5562983160896
    const testB = "5562983160896";
    console.log(`\n🧪 Testing Update with ${testB}...`);
    try {
        await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/updateSubscriber`, {
            subscriber_id: targetId,
            phone: testB,
            has_opt_in_sms: true,
            has_opt_in_email: true
        }, { headers: { 'Authorization': `Bearer ${token}` } });
        console.log('✅ Update B SUCCESS');
    } catch (e) {
        console.log(`❌ Update B FAIL: ${e.response?.data?.message}`);
    }
}

test();
