import { supabase } from './src/database/supabase.js';

async function check() {
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();

    console.log('=== CART ABANDONMENT SETTINGS ===\n');
    console.log(`Tag 1 (First): ${settings.manychat_tag_name || 'NOT SET'}`);
    console.log(`Tag 2 (Second): ${settings.manychat_tag_name_2 || 'NOT SET'}`);
    console.log(`Flow ID (First): ${settings.manychat_flow_id_first || 'NOT SET'}`);
    console.log(`Flow ID (Second): ${settings.manychat_flow_id_second || 'NOT SET'}`);
    console.log(`Delay (minutes): ${settings.delay_minutes || 'NOT SET'}`);
}

check();
