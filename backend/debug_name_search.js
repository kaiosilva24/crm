import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- NAME SEARCH DIAGNOSTIC ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    const name = "Suporte Kaio";
    console.log(`Searching name: "${name}"`);

    try {
        const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findByName`, {
            params: { name: name },
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.data?.data) {
            console.log(`Found ${res.data.data.length} matches:`);
            res.data.data.forEach(sub => {
                console.log(` - ID: ${sub.id} | Name: ${sub.first_name} ${sub.last_name} | Phone: ${sub.phone}`);
            });
        } else {
            console.log('❌ NOT FOUND by Name');
        }
    } catch (e) {
        console.log(`❌ ERROR: ${e.response?.status}`);
    }
}

test();
