import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- STRICT FIELD INSPECT ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    try {
        const res = await axios.get(`${MANYCHAT_API_BASE}/fb/page/getCustomFields`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.data?.data) {
            const f = res.data.data.find(field => field.id === 13968648);
            if (f) {
                console.log(`ID: ${f.id}`);
                console.log(`Name: ${f.name}`);
                console.log(`Type: ${f.type}`);
                console.log(`Desc: ${f.description}`);
            } else {
                console.log('Field 13968648 NOT FOUND in account list.');
            }
        }
    } catch (e) {
        console.log('Err:', e.message);
    }
}

test();
