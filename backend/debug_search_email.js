import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- EMAIL SEARCH ONLY ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    const email = "teste.1768799142367@hotmart.com";

    try {
        console.log(`Searching email: ${email}`);
        const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField`, {
            params: { email: email },
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.data?.data) {
            console.log(`✅ FOUND: ${JSON.stringify(res.data.data)}`);
            if (res.data.data.id) {
                console.log(`🆔 ID: ${res.data.data.id}`);
            }
        } else {
            console.log('❌ NOT FOUND');
        }
    } catch (e) {
        console.log(`❌ ERROR: ${e.response?.status} - ${JSON.stringify(e.response?.data)}`);
    }
}

test();
