import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function testAlternativeSearch() {
    console.log('=== TESTING ALTERNATIVE SEARCH METHODS ===\n');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    const whatsappPhone = "+5567981720357";

    // Method 1: Try findBySystemField with whatsapp_id parameter
    console.log('Method 1: findBySystemField with whatsapp_id');
    try {
        const response = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField`, {
            params: {
                whatsapp_id: whatsappPhone
            },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ SUCCESS!');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log(`❌ ${error.response?.status || error.message}`);
    }

    // Method 2: Try with wa_id parameter
    console.log('\nMethod 2: findBySystemField with wa_id');
    try {
        const response = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField`, {
            params: {
                wa_id: whatsappPhone
            },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ SUCCESS!');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log(`❌ ${error.response?.status || error.message}`);
    }

    // Method 3: List all available endpoints
    console.log('\nMethod 3: Testing getInfo with known ID');
    try {
        const response = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/getInfo`, {
            params: {
                subscriber_id: "859832079"
            },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Contact found!');
        const sub = response.data.data;
        console.log(`WhatsApp Phone: ${sub.whatsapp_phone}`);
        console.log(`wa_id field: ${sub.wa_id || 'N/A'}`);
        console.log(`whatsapp_id field: ${sub.whatsapp_id || 'N/A'}`);
    } catch (error) {
        console.log(`❌ ${error.message}`);
    }
}

testAlternativeSearch();
