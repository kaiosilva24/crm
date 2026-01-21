import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function updateContact() {
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    const subscriberId = "859832079";
    const phone = "+5567981720357";

    console.log(`Updating contact ${subscriberId} with System Phone: ${phone}`);

    try {
        const response = await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/updateSubscriber`, {
            subscriber_id: subscriberId,
            phone: phone,
            has_opt_in_sms: true,
            consent_phrase: "Cart Abandonment Update"
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Contact updated successfully!');

        // Verify
        const verifyResponse = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/getInfo`, {
            params: { subscriber_id: subscriberId },
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const sub = verifyResponse.data.data;
        console.log('\nVerification:');
        console.log(`Phone (System): ${sub.phone || 'EMPTY'}`);
        console.log(`WhatsApp: ${sub.whatsapp_phone || 'EMPTY'}`);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

updateContact();
