import { supabase } from './src/database/supabase.js';

async function check() {
    console.log('--- SETTINGS ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    if (settings) {
        console.log(`Delay: ${settings.delay_minutes} min`);
        console.log(`Campaign ID: ${settings.campaign_id}`);
        console.log(`Tag 1: ${settings.manychat_tag_name}`);
        console.log(`Tag 2: ${settings.manychat_tag_name_2}`);
    } else {
        console.log('No settings found');
    }
}
check();
