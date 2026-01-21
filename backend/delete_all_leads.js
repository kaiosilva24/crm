/**
 * Script para deletar TODOS os leads do banco de dados
 * ⚠️ ATENÇÃO: Esta ação é irreversível!
 */

import { supabase } from './src/database/supabase.js';

console.log('\n⚠️ DELETANDO TODOS OS LEADS DO BANCO DE DADOS\n');
console.log('='.repeat(70));

async function deleteAllLeads() {
    try {
        // 1. Contar quantos leads existem
        const { count, error: countError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        console.log(`📊 Total de leads no banco: ${count}`);
        console.log('');

        if (count === 0) {
            console.log('✅ Não há leads para deletar!');
            process.exit(0);
        }

        console.log('🗑️ Deletando todos os leads...');
        console.log('');

        // 2. Deletar TODOS os leads
        const { error: deleteError } = await supabase
            .from('leads')
            .delete()
            .neq('id', 0); // Deleta todos (condição sempre verdadeira)

        if (deleteError) throw deleteError;

        console.log('✅ TODOS OS LEADS FORAM DELETADOS!');
        console.log('');
        console.log(`📊 Total deletado: ${count} leads`);
        console.log('');
        console.log('='.repeat(70));
        console.log('');
        console.log('🎯 Próximo passo: Importar novos leads via CSV');
        console.log('');
        console.log('='.repeat(70));

    } catch (error) {
        console.error('❌ Erro ao deletar leads:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

deleteAllLeads();
