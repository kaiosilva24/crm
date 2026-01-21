import { supabase } from './src/database/supabase.js';

async function verify() {
    const { data: event } = await supabase.from('cart_abandonment_events').select('manychat_subscriber_id').eq('id', 79).single();
    if (event) console.log(`ID: ${event.manychat_subscriber_id}`);
}
verify();
