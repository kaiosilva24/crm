import { supabase } from './src/database/supabase.js';

async function verify() {
    console.log('--- EVENT 67 ID CHECK ---');
    const { data: event } = await supabase
        .from('cart_abandonment_events')
        .select('*')
        .eq('id', 67)
        .single();

    if (event) {
        console.log(`\nprocessed_id: [${event.manychat_subscriber_id}]`);
        console.log(`phone: [${event.contact_phone}]`);
    } else {
        console.log('Event 67 not found');
    }
}
verify();
