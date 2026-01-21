import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function testSearchAPI() {
    console.log('=== TESTING MODERN MANYCHAT SEARCH API ===\n');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    const whatsappPhone = "5567981720357";

    // Try different search endpoints
    const endpoints = [
        '/fb/subscriber/search',
        '/fb/contacts/search',
        '/fb/subscriber/findByWhatsAppId'
    ];

    for (const endpoint of endpoints) {
        console.log(`\nTrying: ${endpoint}`);
        try {
            const response = await axios.post(`${MANYCHAT_API_BASE}${endpoint}`, {
                whatsapp_id: whatsappPhone
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ SUCCESS!');
            console.log('Response:', JSON.stringify(response.data, null, 2));
        } catch (error) {
            console.log(`❌ Error: ${error.response?.status || error.message}`);
            if (error.response?.data) {
                console.log('Details:', JSON.stringify(error.response.data, null, 2));
            }
        }
    }
}

testSearchAPI();
