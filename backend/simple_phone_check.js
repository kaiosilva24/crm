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
    console.log('Phone:', sub.phone);
    console.log('WhatsApp:', sub.whatsapp_phone);
}

check();
