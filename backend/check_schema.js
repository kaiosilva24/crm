import { supabase } from './src/database/supabase.js';

async function checkSchema() {
    console.log('🔍 Verificando schema da tabela campaigns...\n');

    try {
        // Get a sample campaign to see its structure
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Erro ao buscar campanha:', error);
            return;
        }

        if (data && data.length > 0) {
            console.log('✅ Estrutura da campanha:');
            console.log(JSON.stringify(data[0], null, 2));
            console.log('\n📋 Colunas disponíveis:');
            console.log(Object.keys(data[0]).join(', '));

            if ('mirror_sales_source_id' in data[0]) {
                console.log('\n✅ Coluna mirror_sales_source_id EXISTE!');
            } else {
                console.log('\n❌ Coluna mirror_sales_source_id NÃO EXISTE!');
                console.log('⚠️  A migration não foi aplicada corretamente.');
            }
        } else {
            console.log('⚠️  Nenhuma campanha encontrada no banco.');
        }
    } catch (err) {
        console.error('❌ Erro:', err);
    }
}

checkSchema();
