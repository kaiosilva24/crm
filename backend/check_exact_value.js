import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function check() {
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    const subscriberId = "859832079";

    const response = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/getInfo`, {
        params: { subscriber_id: subscriberId },
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const sub = response.data.data;
    console.log('=== CUSTOM FIELDS ===');
    if (sub.custom_fields) {
        sub.custom_fields.forEach(f => {
            if (f.name.toLowerCase().includes('phone')) {
                console.log(`Field: "${f.name}" (ID: ${f.id})`);
                console.log(`Value: "${f.value}"`);
                console.log(`Type: ${f.type}`);
            }
        });
    }
}

check();
