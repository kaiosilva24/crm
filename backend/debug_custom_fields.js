import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- CUSTOM FIELDS INSPECT ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // 1. Get Fields Definitions
    try {
        const res = await axios.get(`${MANYCHAT_API_BASE}/fb/page/getCustomFields`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.data?.data) {
            console.log('Possible Phone Fields:');
            res.data.data.forEach(f => {
                if (f.name.toLowerCase().includes('phone') || f.name.toLowerCase().includes('what') || f.name.toLowerCase().includes('cel')) {
                    console.log(` - [${f.id}] ${f.name} (${f.type})`);
                }
            });
        }
    } catch (e) {
        console.log('Err getting fields:', e.message);
    }

    // 2. Check Subscriber 183534299
    try {
        const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/getInfo`, {
            params: { subscriber_id: "183534299" },
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.data?.data?.custom_fields) {
            console.log('\nSubscriber Values:');
            res.data.data.custom_fields.forEach(cf => {
                console.log(` - ID ${cf.id}: ${cf.value}`);
            });
        }
    } catch (e) { console.log('Err getting sub:', e.message); }
}

test();
