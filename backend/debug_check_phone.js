import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- CHECK PHONE OWNER ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // The phone the user is cleaning up
    const phone = "5567981720357";
    // +55 format for safety
    const phonePlus = "+5567981720357";

    console.log(`Checking owner of: ${phone} / ${phonePlus}`);

    try {
        const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField`, {
            params: { phone: phone }, // Check raw
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.data?.data) {
            const sub = res.data.data;
            console.log(`\nFound by RAW phone:`);
            console.log(`ID: ${sub.id}`);
            console.log(`Name: ${sub.first_name} ${sub.last_name}`);
            console.log(`Link: https://manychat.com/fb/subscriber/${sub.id}`);
        } else {
            console.log('\nRAW phone returned nothing.');
        }

        // Check Plus
        const res2 = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField`, {
            params: { phone: phonePlus },
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res2.data?.data) {
            const sub = res2.data.data;
            console.log(`\nFound by +PHONE:`);
            console.log(`ID: ${sub.id}`);
            console.log(`Name: ${sub.first_name} ${sub.last_name}`);
        }

    } catch (e) {
        console.log(`❌ ERROR: ${e.message}`);
    }
}

test();
