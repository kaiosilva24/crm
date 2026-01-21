import { supabase } from './src/database/supabase.js';

async function listEvents() {
    console.log('Listing latest 10 events...');
    const { data: events } = await supabase
        .from('cart_abandonment_events')
        .select('*')
        .order('id', { ascending: false })
        .limit(10);

    events.forEach(e => {
        console.log(`ID: ${e.id} | Phone: "${e.contact_phone}" | Status: ${e.status} | Time: ${e.created_at}`);
    });
}

listEvents();
