import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function getTags() {
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    const response = await axios.get(`${MANYCHAT_API_BASE}/fb/page/getTags`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('=== AVAILABLE TAGS ===\n');
    response.data.data.forEach(tag => {
        if (tag.name.toLowerCase().includes('abandon') || tag.name.toLowerCase().includes('carrinho')) {
            console.log(`✅ ID: ${tag.id} | Name: "${tag.name}"`);
        }
    });
}

getTags();
