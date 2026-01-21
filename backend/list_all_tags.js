import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function listTags() {
    console.log('Listing ALL Tags from ManyChat...\n');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    try {
        const response = await axios.get(`${MANYCHAT_API_BASE}/fb/page/getTags`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const tags = response.data.data;
        if (tags) {
            console.log(`Found ${tags.length} tags:`);
            tags.forEach(t => console.log(`- ID: ${t.id} | Name: "${t.name}"`));
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

listTags();
