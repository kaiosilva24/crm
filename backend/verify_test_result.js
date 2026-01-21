import { supabase } from './src/database/supabase.js';

async function verify() {
    console.log('--- LOGS 72 (Custom Field Check) ---');

    // Get the ID first
    const { data: event } = await supabase.from('cart_abandonment_events').select('manychat_subscriber_id').eq('id', 72).single();
    const targetId = event?.manychat_subscriber_id;

    if (targetId) {
        console.log(`TARGETED ID: ${targetId}`);
    } else {
        console.log('No ID found yet.');
        return;
    }

    const { data: logs } = await supabase
        .from('cart_abandonment_logs')
        .select('*')
        .eq('event_id', 72)
        .order('created_at', { ascending: true });

    if (logs) {
        logs.forEach(l => {
            // Show flow
            if (['debug_info', 'create_subscriber', 'update_subscriber', 'first_message'].includes(l.action_type)) {
                console.log(`[${l.action_type}] ${l.message}`);
            }
        });
    }
}
verify();
