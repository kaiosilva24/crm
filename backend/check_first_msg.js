import { supabase } from './src/database/supabase.js';

async function checkFirstMessage() {
    const eventId = 104;
    console.log(`Checking first message logs for Event ${eventId}...`);

    const { data: logs } = await supabase
        .from('cart_abandonment_logs')
        .select('*')
        .eq('event_id', eventId)
        .eq('action_type', 'first_message');

    logs.forEach(l => {
        console.log(`[${l.status}] ${l.message}`);
        if (l.details) console.log(`Details: ${l.details}`);
    });
}

checkFirstMessage();
