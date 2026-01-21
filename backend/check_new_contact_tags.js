import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function checkLatestSubscriber() {
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // Get latest event
    const { data: event } = await supabase
        .from('cart_abandonment_events')
        .select('*')
        .order('id', { ascending: false })
        .limit(1)
        .single();

    if (!event) {
        console.log('No events found');
        return;
    }

    console.log(`\n=== LATEST EVENT ${event.id} ===`);
    console.log(`Status: ${event.status}`);
    console.log(`Subscriber ID: ${event.manychat_subscriber_id}`);

    let subId = event.manychat_subscriber_id;

    // Handle array format if needed (though it should be string or single ID usually)
    if (Array.isArray(subId)) subId = subId[0];
    if (typeof subId === 'string' && subId.startsWith('[')) {
        try {
            const parsed = JSON.parse(subId);
            subId = parsed[0];
        } catch (e) { }
    }

    if (!subId) {
        console.log('No subscriber ID found in event yet.');
        return;
    }

    console.log(`Checking tags for Subscriber: ${subId}`);

    try {
        const response = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/getInfo`, {
            params: { subscriber_id: subId },
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const sub = response.data.data;
        console.log(`Name: ${sub.first_name} ${sub.last_name}`);
        console.log(`Phone: ${sub.phone || 'EMPTY'}`);
        console.log(`WhatsApp: ${sub.whatsapp_phone || 'EMPTY'}`);
        console.log(`\nTags:`);
        if (sub.tags && sub.tags.length > 0) {
            sub.tags.forEach(tag => console.log(`  - ${tag.name}`));
        } else {
            console.log('  (No tags)');
        }
    } catch (error) {
        console.error('Error fetching subscriber info:', error.response?.data || error.message);
    }
}

checkLatestSubscriber();
