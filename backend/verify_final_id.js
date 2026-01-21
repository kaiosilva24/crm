import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- FINAL ID CHECK ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // +55 format matches what the system uses
    const phone = "+5567981720357";

    try {
        const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField`, {
            params: { phone: phone },
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.data?.data) {
            const sub = res.data.data;
            console.log(`✅ ID: ${sub.id}`);
            console.log(`👤 Name: ${sub.first_name} ${sub.last_name}`);
        } else {
            console.log('❌ Phone not found via API');
        }

    } catch (e) {
        console.log(`❌ ERROR: ${e.message}`);
    }
}

test();
