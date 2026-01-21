import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function listFields() {
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    const response = await axios.get(`${MANYCHAT_API_BASE}/fb/page/getCustomFields`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const fields = response.data.data;
    console.log('=== CUSTOM FIELDS ===');
    fields.forEach(f => {
        if (f.name.toLowerCase().includes('phone') || f.name.toLowerCase().includes('tel')) {
            console.log(`ID: ${f.id} | Name: "${f.name}" | Type: ${f.type}`);
        }
    });
}

listFields();
