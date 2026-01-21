import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- SEARCH ALL DIAGNOSTIC ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // Data from Teste Full Cycle
    const phone = "5562983160896";
    const email = "teste.1768799142367@hotmart.com";

    // 1. Search by Email (Correct API usage: ?email=...)
    console.log(`\n🔍 Searching by Email: ${email}`);
    try {
        const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField`, {
            params: { email: email },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.data?.data) {
            console.log(`✅ Found by Email: ${JSON.stringify(res.data.data)}`);
        } else {
            console.log('❌ Not found by Email');
        }
    } catch (e) {
        console.log(`❌ Email Search Error: ${e.response?.status}`);
    }

    // 2. Search by Phone variations (System Field)
    const phoneVars = [
        "5562983160896",
        "+5562983160896",
        "62983160896"
    ];

    for (const ph of phoneVars) {
        console.log(`\n🔍 Searching by Phone: ${ph}`);
        try {
            const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField`, {
                params: { phone: ph },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data?.data) { // Check if object or array
                console.log(`✅ Found by Phone [${ph}]: ${JSON.stringify(res.data.data)}`);
            } else {
                console.log(`❌ Not found by Phone [${ph}]`);
            }
        } catch (e) {
            console.log(`❌ Phone Search Error [${ph}]: ${e.response?.status}`);
        }
    }
}

test();
