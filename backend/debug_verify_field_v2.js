import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- VERIFY FIELD 12655372 (phone) ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // Suporte Kaio
    const subId = "183534299";
    const fieldId = 12655372;

    try {
        const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/getInfo`, {
            params: { subscriber_id: subId },
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.data?.data?.custom_fields) {
            const field = res.data.data.custom_fields.find(f => f.id === fieldId);
            if (field) {
                console.log(`✅ Field ${fieldId} (${field.name}) Value: [${field.value}]`);
            } else {
                console.log(`❌ Field ${fieldId} not present on user.`);
            }
        }
    } catch (e) {
        console.log(`❌ ERROR: ${e.message}`);
    }
}

test();
