import { supabase } from './src/database/supabase.js';

async function run() {
    try {
        console.log('Verificando schema do banco...\n');

        const { data, error } = await supabase
            .from('cart_abandonment_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) {
            console.error('Erro:', error.message);
            return;
        }

        console.log('Campos disponíveis:');
        Object.keys(data).forEach(key => {
            console.log(`  - ${key}: ${data[key]}`);
        });

        if ('manychat_tag_name_second' in data) {
            console.log('\n✅ Coluna manychat_tag_name_second EXISTE');
            console.log('Valor:', data.manychat_tag_name_second || 'NULL');
        } else {
            console.log('\n❌ Coluna manychat_tag_name_second NÃO EXISTE');
            console.log('Execute a migração SQL!');
        }

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

run();
