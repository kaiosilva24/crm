import { supabase } from './src/database/supabase.js';

async function verify() {
    const { data: event } = await supabase.from('cart_abandonment_events').select('*').eq('id', 82).single();
    if (event) {
        console.log(`Event 82:`);
        console.log(`Phone: ${event.contact_phone}`);
        console.log(`Name: ${event.contact_name}`);
        console.log(`Subscriber ID: ${event.manychat_subscriber_id}`);

        // Check logs
        const { data: logs } = await supabase
            .from('cart_abandonment_logs')
            .select('*')
            .eq('event_id', 82)
            .order('created_at', { ascending: true });

        if (logs) {
            console.log('\n--- ALL LOGS ---');
            logs.forEach(l => {
                console.log(`[${l.action_type}] ${l.status}: ${l.message}`);
            });
        }
    }
}
verify();
