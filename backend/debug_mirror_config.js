import 'dotenv/config';
import { supabase } from './src/database/supabase.js';

async function debugMirrorConfig() {
    console.log('🔍 VERIFICANDO CONFIGURAÇÃO DE MIRROR BUYERS\n');

    try {
        // 1. Buscar todas as campanhas
        const { data: campaigns, error } = await supabase
            .from('campaigns')
            .select('id, name, mirror_campaign_id, mirror_sales_source_id, is_active')
            .order('name');

        if (error) {
            console.error('❌ Erro ao buscar campanhas:', error);
            return;
        }

        console.log(`📊 Total de campanhas: ${campaigns.length}\n`);

        // 2. Filtrar campanhas com mirror_sales_source_id configurado
        const mirroring = campaigns.filter(c => c.mirror_sales_source_id);

        if (mirroring.length === 0) {
            console.log('⚠️ NENHUMA campanha tem Mirror Buyers configurado!\n');
        } else {
            console.log(`🪞 Campanhas com Mirror Buyers configurado: ${mirroring.length}\n`);
        }

        // 3. Mostrar detalhes de cada campanha
        for (const camp of campaigns) {
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📁 Campanha: ${camp.name}`);
            console.log(`   ID: ${camp.id}`);
            console.log(`   Ativa: ${camp.is_active ? '✅ Sim' : '❌ Não'}`);

            if (camp.mirror_campaign_id) {
                const source = campaigns.find(c => c.id === camp.mirror_campaign_id);
                console.log(`   🔄 Espelha VENDEDORA de: ${source ? source.name : `ID ${camp.mirror_campaign_id}`}`);
            }

            if (camp.mirror_sales_source_id) {
                const source = campaigns.find(c => c.id === camp.mirror_sales_source_id);
                console.log(`   💰 Espelha COMPRADORES de: ${source ? source.name : `ID ${camp.mirror_sales_source_id}`}`);
                console.log(`   ⚙️ Quando um lead entrar em "${source ? source.name : camp.mirror_sales_source_id}",`);
                console.log(`      se ele existir em "${camp.name}", será marcado como VENDIDO.`);
            }

            // Contar leads nesta campanha
            const { count } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('campaign_id', camp.id);

            console.log(`   👥 Total de leads: ${count || 0}`);
            console.log('');
        }

        // 4. Verificar se a coluna existe
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔧 VERIFICAÇÃO DE SCHEMA\n');

        const { data: columns } = await supabase
            .from('information_schema.columns')
            .select('column_name')
            .eq('table_name', 'campaigns')
            .in('column_name', ['mirror_campaign_id', 'mirror_sales_source_id']);

        console.log('Colunas encontradas na tabela campaigns:');
        if (columns) {
            columns.forEach(col => console.log(`   ✅ ${col.column_name}`));
        }

        // 5. Mostrar exemplo de configuração
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📖 COMO FUNCIONA:\n');
        console.log('1. Na campanha "Alunos Avançado", configure:');
        console.log('   💰 Espelhar Compradores de: "LP06 Jan Super Interessado"');
        console.log('');
        console.log('2. Quando um lead ENTRAR na campanha "LP06 Jan Super Interessado",');
        console.log('   o sistema vai:');
        console.log('   a) Buscar esse lead na campanha "Alunos Avançado" (por email/telefone)');
        console.log('   b) Se encontrar, marcar como VENDIDO automaticamente');
        console.log('');
        console.log('⚠️ IMPORTANTE: O lead precisa JÁ EXISTIR em "Alunos Avançado"');
        console.log('   antes de entrar em "LP06 Jan Super Interessado"!\n');

    } catch (error) {
        console.error('❌ Erro:', error);
    }

    process.exit(0);
}

debugMirrorConfig();
