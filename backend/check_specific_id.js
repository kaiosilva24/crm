import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function checkSpecificId() {
    const subId = "587919399";
    console.log(`Checking tags for Subscriber ID: ${subId}...\n`);

    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    try {
        const response = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/getInfo`, {
            params: { subscriber_id: subId },
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const sub = response.data.data;
        console.log(`Name: ${sub.first_name} ${sub.last_name}`);
        console.log(`Phone: ${sub.phone || 'EMPTY'}`);
        console.log(`WhatsApp: ${sub.whatsapp_phone || 'EMPTY'}`);
        console.log(`\nTags:`);
        if (sub.tags && sub.tags.length > 0) {
            sub.tags.forEach(tag => console.log(`  - [${tag.id}] ${tag.name}`));
        } else {
            console.log('  (No tags)');
        }
    } catch (error) {
        console.error('Error fetching subscriber info:', error.response?.data || error.message);
    }
}

checkSpecificId();
