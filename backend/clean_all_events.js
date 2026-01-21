import { supabase } from './src/database/supabase.js';

async function cleanAll() {
    console.log('Cleaning ALL recent events...');

    // Get last 20 IDs
    const { data: events } = await supabase
        .from('cart_abandonment_events')
        .select('id')
        .order('id', { ascending: false })
        .limit(20);

    if (events && events.length > 0) {
        const ids = events.map(e => e.id);
        await supabase.from('cart_abandonment_logs').delete().in('event_id', ids);
        await supabase.from('cart_abandonment_events').delete().in('id', ids);
        console.log(`✅ Deleted ${ids.length} events.`);
    }
}

cleanAll();
