import { supabase } from './src/database/supabase.js';

async function checkLogs() {
    const eventId = 104;
    console.log(`=== LOGS FOR EVENT ${eventId} ===\n`);

    const { data: logs } = await supabase
        .from('cart_abandonment_logs')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

    if (logs) {
        logs.forEach((l, i) => {
            console.log(`${i + 1}. [${l.action_type}] ${l.status}: ${l.message}`);
            if (l.details) console.log(`  Details: ${l.details}`);
        });
    }
}

checkLogs();
