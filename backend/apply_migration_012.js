import { supabase } from './src/database/supabase.js';

async function run() {
    try {
        console.log('Applying migration: 012_dual_tag_config.sql');

        // Add column
        const { error: alterError } = await supabase.rpc('exec_sql', {
            sql: `ALTER TABLE cart_abandonment_settings ADD COLUMN IF NOT EXISTS manychat_tag_name_second VARCHAR(255);`
        });

        if (alterError && !alterError.message.includes('already exists')) {
            console.error('Error adding column:', alterError.message);
        } else {
            console.log('✅ Column added (or already exists)');
        }

        // Set default values
        const { error: updateError } = await supabase
            .from('cart_abandonment_settings')
            .update({
                manychat_tag_name_second: supabase.raw(`CONCAT(COALESCE(manychat_tag_name, 'abandono_carrinho'), '_2')`)
            })
            .is('manychat_tag_name_second', null);

        if (updateError) {
            console.error('Error setting defaults:', updateError.message);
        } else {
            console.log('✅ Default values set');
        }

        // Verify
        const { data } = await supabase
            .from('cart_abandonment_settings')
            .select('manychat_tag_name, manychat_tag_name_second')
            .eq('id', 1)
            .single();

        console.log('\nCurrent values:');
        console.log('Tag 1:', data.manychat_tag_name);
        console.log('Tag 2:', data.manychat_tag_name_second);

    } catch (e) {
        console.error('Migration failed:', e.message);
        console.log('\n⚠️  Please run this SQL manually in Supabase:');
        console.log(`
ALTER TABLE cart_abandonment_settings 
ADD COLUMN IF NOT EXISTS manychat_tag_name_second VARCHAR(255);

UPDATE cart_abandonment_settings 
SET manychat_tag_name_second = CONCAT(COALESCE(manychat_tag_name, 'abandono_carrinho'), '_2')
WHERE manychat_tag_name_second IS NULL;
        `);
    }
}

run();
