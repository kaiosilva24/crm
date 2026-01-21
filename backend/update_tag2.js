import { supabase } from './src/database/supabase.js';

async function update() {
    console.log('--- UPDATE TAG 2 ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('id').limit(1);
    if (settings && settings.length > 0) {
        const res = await supabase.from('cart_abandonment_settings')
            .update({ manychat_tag_name_2: 'abandono_carrinho_2' })
            .eq('id', settings[0].id);
        console.log('Updated manychat_tag_name_2');
    }
}
update();
