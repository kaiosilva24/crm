import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function applyTag1() {
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    console.log('=== SETTINGS ===');
    console.log(`Tag 1: ${settings.manychat_tag_name}`);
    console.log(`Tag 2: ${settings.manychat_tag_name_2}\n`);

    const subscriberId = "859832079";
    const tag1Name = settings.manychat_tag_name || 'abandono_carrinho';

    // Get tag ID
    const tagsRes = await axios.get(`${MANYCHAT_API_BASE}/fb/page/getTags`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const tag1 = tagsRes.data.data.find(t => t.name === tag1Name);
    if (!tag1) {
        console.log(`❌ Tag "${tag1Name}" not found!`);
        return;
    }

    console.log(`Applying Tag 1 "${tag1Name}" (ID: ${tag1.id}) to ${subscriberId}...`);

    try {
        await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/addTag`, {
            subscriber_id: subscriberId,
            tag_id: tag1.id
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ Tag 1 applied successfully!\n');

        // Verify both tags
        const response = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/getInfo`, {
            params: { subscriber_id: subscriberId },
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Current tags:');
        response.data.data.tags.forEach(tag => console.log(`  - ${tag.name}`));

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

applyTag1();
