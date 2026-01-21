import { supabase } from './src/database/supabase.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function testCreate() {
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    if (!settings) return console.log('No settings');

    console.log('Testing Simple Payload...');
    try {
        const res = await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/createSubscriber`, {
            first_name: 'Test',
            last_name: 'Simple',
            phone: '+5511988887777',
            has_opt_in_sms: true,
            has_opt_in_email: true,
            consent_phrase: 'Testing'
        }, {
            headers: { 'Authorization': `Bearer ${settings.manychat_api_token}`, 'Content-Type': 'application/json' }
        });
        console.log('Success:', JSON.stringify(res.data));
    } catch (e) {
        console.log('Error:', JSON.stringify(e.response?.data || e.message));
    }
}

testCreate();
