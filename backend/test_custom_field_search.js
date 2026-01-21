import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    const fieldId = 12655372; // Custom Field "phone"
    const phoneNumbers = [
        '5567981720357',
        '+5567981720357',
        '67981720357'
    ];

    for (const phone of phoneNumbers) {
        try {
            console.log(`\nTrying: ${phone}`);
            const response = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findByCustomField`, {
                params: {
                    field_id: fieldId,
                    field_value: phone
                },
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data?.data?.id) {
                console.log(`✅ FOUND! ID: ${response.data.data.id}`);
                break;
            } else {
                console.log(`❌ Not found`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.response?.status || error.message}`);
        }
    }
}

test();
