import { supabase } from './src/database/supabase.js';

async function verify() {
    const { data: logs } = await supabase
        .from('cart_abandonment_logs')
        .select('*')
        .eq('event_id', 86)
        .order('created_at', { ascending: true });

    if (logs) {
        console.log('=== ALL LOGS FOR EVENT 86 ===\n');
        logs.forEach(l => {
            console.log(`[${l.action_type}] ${l.status}`);
            console.log(`  Message: ${l.message}`);
            if (l.details) console.log(`  Details: ${l.details}`);
            console.log('');
        });
    }
}
verify();
