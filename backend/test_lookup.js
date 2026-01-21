import { findSubscriberByPhone } from './src/services/manychatService.js';
import { supabase } from './src/database/supabase.js';
import dotenv from 'dotenv';
dotenv.config();

async function testLookup() {
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    if (!settings) { console.log('No settings'); return; }

    const phones = ['5567981720357', '+5567981720357', '67981720357'];

    for (const phone of phones) {
        console.log(`\nChecking phone: ${phone}`);
        try {
            const id = await findSubscriberByPhone(phone, settings.manychat_api_token);
            if (id) {
                console.log(`✅ FOUND! Phone: ${phone} -> ID: ${id}`);
                break;
            }
        } catch (e) {
            console.error(`Error for ${phone}: ${e.message}`);
            if (e.response) console.log(`Status: ${e.response.status}, Data:`, JSON.stringify(e.response.data));
        }
    }
}

testLookup();
