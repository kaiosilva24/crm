import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- FINAL DIAGNOSTIC ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // 1. Create Subscriber Test (modified to minimal payload)
    console.log('\n[1] Create Subscriber (Minimal)');
    try {
        await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/createSubscriber`, {
            first_name: "Debug",
            last_name: "Test",
            // phone: "+5567981720357", // Try WITHOUT phone first to see if it works
        }, { headers: { 'Authorization': `Bearer ${token}` } });
        console.log('SUCCESS (No Phone)');
    } catch (e) {
        console.log('FAIL (No Phone):', e.response?.data?.message);
    }

    // 2. Create With Phone
    console.log('\n[2] Create Subscriber (With Phone)');
    try {
        await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/createSubscriber`, {
            first_name: "Debug",
            last_name: "Test",
            phone: "+5567981720357",
            has_opt_in_sms: true,
            consent_phrase: "Debug"
        }, { headers: { 'Authorization': `Bearer ${token}` } });
        console.log('SUCCESS (With Phone)');
    } catch (e) {
        const msgs = e.response?.data?.details?.messages;
        const msg = msgs ? msgs[0] : e.response?.data?.message;
        console.log('FAIL (With Phone):', JSON.stringify(msg));
    }

    // 3. Find By Name
    console.log('\n[3] Find By Name "Debug WA"');
    try {
        const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findByName?name=Debug WA`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`Found: ${res.data?.data?.length} subscribers`);
        if (res.data?.data?.length > 0) {
            console.log(`ID: ${res.data.data[0].id}`);
        }
    } catch (e) {
        console.log('FAIL (Name):', e.message);
    }

    console.log('--- END ---');
}

test();
