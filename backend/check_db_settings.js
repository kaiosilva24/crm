import { supabase } from './src/database/supabase.js';

async function checkSettings() {
    console.log('Checking Settings...\n');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();

    console.log(`Tag 1 Name: "${settings.manychat_tag_name}"`);
    console.log(`Tag 2 Name (Config): "${settings.manychat_tag_name_second}"`);
    console.log(`Computed Tag 2: "${settings.manychat_tag_name_second || (settings.manychat_tag_name || 'abandono_carrinho') + '_2'}"`);
    console.log(`Delay: ${settings.delay_minutes} minutes`);
    console.log(`API Token: ${settings.manychat_api_token ? 'Set' : 'Missing'}`);
}

checkSettings();
