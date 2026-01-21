import axios from 'axios';
import { supabase } from './src/database/supabase.js';

async function testSync() {
    console.log('Testing Sync Endpoint...\n');

    // 1. Get the latest error event
    const { data: event } = await supabase
        .from('cart_abandonment_events')
        .select('id')
        .eq('status', 'error')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!event) {
        console.log('No error event found to test.');
        return;
    }

    console.log(`Testing with Event ID: ${event.id}`);

    // 2. Call Endpoint (Mocking Auth - simplistic)
    // Note: The endpoint requires Auth. If we run this locally against localhost:3001, we need a token.
    // For quick debugging, we might skip auth or need to login. 
    // Let's assume we can hit it if we had a token, but getting a token in script is hard.
    // ALTERNATIVE: We just run the INTERNAL logic of the endpoint here to see if it throws.

    try {
        // Call internal logic directly
        const id = event.id;

        const { data: ev, error: err } = await supabase.from('cart_abandonment_events').select('*').eq('id', id).single();
        if (err) throw new Error('Event not found DB');

        console.log('Event loaded:', ev.id);

        const { data: settings } = await supabase.from('cart_abandonment_settings').select('campaign_id').single();
        console.log('Campaign configured:', settings?.campaign_id);

        if (!settings?.campaign_id) console.log('❌ No campaign ID!');

        // Check campaign
        const { data: leads, error: leadErr } = await supabase
            .from('leads')
            .select('id')
            .eq('campaign_id', settings.campaign_id)
            .limit(1);

        if (leadErr) console.error('Lead query error:', leadErr);
        console.log('Leads found:', leads);

    } catch (error) {
        console.error('❌ Script Error:', error.message);
    }
}

testSync();
