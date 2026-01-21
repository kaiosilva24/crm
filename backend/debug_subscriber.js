import { supabase } from './src/database/supabase.js';

async function verify() {
    console.log('--- SCHEMA CHECK ---');
    // We can't easily check schema via supabase client without pg_meta or similar.
    // But we can try to insert a dummy row with a number and see if it works.

    // OR we can just try to run the problematic part: findSubscriberByPhone

    const { findSubscriberByPhone } = await import('./src/services/manychatService.js');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();

    if (settings && settings.manychat_api_token) {
        console.log('Testing findSubscriberByPhone...');
        try {
            const id = await findSubscriberByPhone('5567981720357', settings.manychat_api_token);
            console.log('Found ID:', id);
            console.log('Type:', typeof id);

            if (id) {
                // Try to update the event again manually to see if it errors
                const { data: events } = await supabase
                    .from('cart_abandonment_events')
                    .select('id')
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (events && events[0]) {
                    console.log(`Updating event ${events[0].id} with ID ${id}...`);
                    const { error } = await supabase
                        .from('cart_abandonment_events')
                        .update({ manychat_subscriber_id: id })
                        .eq('id', events[0].id);

                    if (error) console.log('Update Error:', error);
                    else console.log('Update Success!');
                }
            }
        } catch (e) {
            console.error('Error in test:', e);
        }
    } else {
        console.log('Settings missing');
    }
}

verify();
