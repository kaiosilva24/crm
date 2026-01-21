import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function testFindByName() {
    console.log('=== TEST FIND BY NAME ===\n');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    const name = "Teste Cliente"; // Name used in webhook

    try {
        const response = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findByName`, {
            params: { name: name },
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = response.data.data;
        if (data && data.length > 0) {
            console.log(`✅ Found ${data.length} subscribers with name "${name}":`);
            data.forEach(sub => {
                console.log(`- ID: ${sub.id}, Name: ${sub.first_name} ${sub.last_name}, Phone: ${sub.phone}, WA: ${sub.whatsapp_phone}`);
            });
        } else {
            console.log(`❌ No subscribers found with name "${name}"`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.response?.status || error.message}`);
        if (error.response?.data) console.log(JSON.stringify(error.response.data));
    }
}

testFindByName();
