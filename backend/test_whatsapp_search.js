import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- TEST WHATSAPP SEARCH ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // The number we know is associated with ID 859832079 (WhatsApp only)
    const phone = "5567981720357";
    const formats = [phone, `+${phone}`];

    for (const ph of formats) {
        try {
            console.log(`Checking whatsapp_phone: ${ph}`);
            const response = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField`, {
                params: {
                    whatsapp_phone: ph
                },
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data?.data) {
                console.log('Response Data:', JSON.stringify(response.data.data, null, 2));
                const resData = response.data.data;
                if (Array.isArray(resData)) console.log(`Found ${resData.length} matches`);
                else console.log('Found 1 match');
            } else {
                console.log('No data found');
            }
        } catch (error) {
            console.log(`Error: ${error.response?.status || error.message}`);
            if (error.response?.data) console.log(JSON.stringify(error.response.data));
        }
    }
}

test();
