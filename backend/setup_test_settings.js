import { supabase } from './src/database/supabase.js';

async function setup() {
    console.log('--- SETUP SETTINGS ---');
    // Set Delay to 1 minute
    const { error } = await supabase
        .from('cart_abandonment_settings')
        .update({ delay_minutes: 1 })
        .eq('id', 1); // Assuming ID 1, or I should fetch first. 
    // But update without WHERE updates all if no filter, but here usually 1 row.
    // Better:
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('id').limit(1);
    if (settings && settings.length > 0) {
        await supabase.from('cart_abandonment_settings').update({ delay_minutes: 1 }).eq('id', settings[0].id);
        console.log('Updated delay to 1 minute');
    } else {
        console.log('No settings found to update');
    }
}
setup();
