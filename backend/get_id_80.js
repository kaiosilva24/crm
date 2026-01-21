import { supabase } from './src/database/supabase.js';

async function verify() {
    const { data: event } = await supabase.from('cart_abandonment_events').select('manychat_subscriber_id').eq('id', 80).single();
    if (event) {
        console.log(`ID: ${event.manychat_subscriber_id}`);

        // Check logs
        const { data: logs } = await supabase
            .from('cart_abandonment_logs')
            .select('*')
            .eq('event_id', 80)
            .order('created_at', { ascending: true });

        if (logs) {
            console.log('\n--- KEY LOGS ---');
            logs.forEach(l => {
                if (['debug_info', 'first_message', 'create_subscriber'].includes(l.action_type)) {
                    console.log(`[${l.action_type}] ${l.status}: ${l.message}`);
                }
            });
        }
    }
}
verify();
