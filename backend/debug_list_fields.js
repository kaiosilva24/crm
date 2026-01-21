import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    try {
        const res = await axios.get(`${MANYCHAT_API_BASE}/fb/page/getCustomFields`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.data?.data) {
            console.log('--- FIELDS LIST ---');
            res.data.data.forEach(f => {
                // simple log to avoid truncation
                console.log(`${f.id}: ${f.name}`);
            });
        }
    } catch (e) {
        console.log('Err:', e.message);
    }
}
test();
