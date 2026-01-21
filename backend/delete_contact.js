import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function deleteContact() {
    console.log('--- DELETE CONTACT 859832079 ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    const subscriberId = "859832079";

    try {
        console.log(`🗑️ Deleting subscriber ${subscriberId}...`);
        const response = await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/unsubscribe`, {
            subscriber_id: subscriberId
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.status === 'success') {
            console.log(`✅ Subscriber ${subscriberId} deleted successfully.`);
        } else {
            console.log(`⚠️ Response:`, response.data);
        }
    } catch (error) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
    }
}

deleteContact();
