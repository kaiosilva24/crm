import { supabase } from './src/database/supabase.js';

async function verify() {
    const { data: event } = await supabase.from('cart_abandonment_events').select('*').eq('id', 83).single();
    if (event) {
        console.log(`Event 83:`);
        console.log(`Phone: ${event.contact_phone}`);
        console.log(`Subscriber ID: ${event.manychat_subscriber_id}`);

        const { data: logs } = await supabase
            .from('cart_abandonment_logs')
            .select('*')
            .eq('event_id', 83)
            .order('created_at', { ascending: true });

        if (logs) {
            console.log('\n--- KEY LOGS ---');
            logs.forEach(l => {
                if (['debug_info', 'first_message', 'create_subscriber', 'add_tag'].includes(l.action_type)) {
                    console.log(`[${l.action_type}] ${l.status}: ${l.message}`);
                }
            });
        }
    }
}
verify();
