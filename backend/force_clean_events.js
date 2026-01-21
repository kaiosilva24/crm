import { supabase } from './src/database/supabase.js';

async function checkEvents() {
    const partialPhone = "67981720357";
    console.log(`Checking events with phone like %${partialPhone}%...`);

    const { data: events } = await supabase
        .from('cart_abandonment_events')
        .select('*')
        .ilike('contact_phone', `%${partialPhone}%`);

    if (events && events.length > 0) {
        console.log(`Found ${events.length} events:`);
        events.forEach(e => {
            console.log(`- ID: ${e.id}, Phone: ${e.contact_phone}, Status: ${e.status}, Created: ${e.created_at}`);
        });

        // Delete them
        const ids = events.map(e => e.id);
        console.log(`Deleting ${ids.length} events...`);

        await supabase.from('cart_abandonment_logs').delete().in('event_id', ids);
        await supabase.from('cart_abandonment_events').delete().in('id', ids);

        console.log('✅ Deleted successfully.');
    } else {
        console.log('❌ No events found.');
    }
}

checkEvents();
