import { supabase } from './src/database/supabase.js';

async function verify() {
    const { data: event } = await supabase.from('cart_abandonment_events').select('*').eq('id', 87).single();
    console.log(`Event 87 Subscriber ID: ${event.manychat_subscriber_id}\n`);

    const { data: logs } = await supabase
        .from('cart_abandonment_logs')
        .select('*')
        .eq('event_id', 87)
        .order('created_at', { ascending: true });

    if (logs) {
        console.log('=== COMPLETE LOGS ===\n');
        logs.forEach((l, i) => {
            console.log(`${i + 1}. [${l.action_type}] ${l.status}: ${l.message}`);
        });
    }
}
verify();
