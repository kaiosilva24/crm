import { findSubscriberByCustomField } from './src/services/manychatService.js';
import { supabase } from './src/database/supabase.js';

async function test() {
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    const phoneFieldId = 12655372;
    const phone = "5567981720357";

    console.log(`Testing findSubscriberByCustomField with phone: ${phone}`);

    const subscriberId = await findSubscriberByCustomField(phoneFieldId, phone, token);

    if (subscriberId) {
        console.log(`✅ SUCCESS! Found subscriber: ${subscriberId}`);
    } else {
        console.log(`❌ FAILED! Subscriber not found`);
    }
}

test();
