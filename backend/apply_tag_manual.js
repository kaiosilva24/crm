import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function applyTag() {
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    const subscriberId = "859832079";
    const tagId = 62911417; // abandono_carrinho tag

    console.log(`Applying tag ${tagId} to subscriber ${subscriberId}...`);

    try {
        await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/addTag`, {
            subscriber_id: subscriberId,
            tag_id: tagId
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ Tag applied successfully!');

        // Verify
        const response = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/getInfo`, {
            params: { subscriber_id: subscriberId },
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('\nCurrent tags:');
        response.data.data.tags.forEach(tag => console.log(`  - ${tag.name}`));

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

applyTag();
