import { supabase } from './src/database/supabase.js';

async function verify() {
    console.log('--- DETAILED LOGS 77 ---');
    const { data: logs } = await supabase
        .from('cart_abandonment_logs')
        .select('*')
        .eq('event_id', 77)
        .order('created_at', { ascending: true });

    if (logs) {
        logs.forEach(l => {
            console.log(`[${l.action_type}] ${l.status}: ${l.message}`);
            if (l.details) {
                console.log(`   Detailed Error: ${l.details.substring(0, 200)}...`);
            }
        });
    }
}
verify();
