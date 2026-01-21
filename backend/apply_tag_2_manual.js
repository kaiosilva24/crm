import { addTagByName } from './src/services/manychatService.js';
import { supabase } from './src/database/supabase.js';

async function applyTag2() {
    const subId = "587919399";
    const tagName = "abandono_carrinho_2";

    console.log(`Applying '${tagName}' to ${subId}...`);

    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    try {
        await addTagByName(subId, tagName, token);
        console.log('✅ Success! Tag applied.');
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
}

applyTag2();
