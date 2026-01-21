import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function check() {
    console.log('--- CHECK SYSTEM PHONE FIELD ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    const subscriberId = "859832079";

    try {
        const response = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/getInfo`, {
            params: { subscriber_id: subscriberId },
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data?.data) {
            const sub = response.data.data;
            console.log(`\nID: ${sub.id}`);
            console.log(`Name: ${sub.first_name} ${sub.last_name}`);
            console.log(`\n=== SYSTEM FIELDS ===`);
            console.log(`Phone (System): ${sub.phone || 'EMPTY'}`);
            console.log(`WhatsApp Phone: ${sub.whatsapp_phone || 'EMPTY'}`);
            console.log(`Email: ${sub.email || 'EMPTY'}`);
        }
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

check();
