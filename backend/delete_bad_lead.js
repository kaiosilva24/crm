/**
 * Deletar o lead incorreto (telefone fixo com 9 adicionado)
 */

import { supabase } from './src/database/supabase.js';

const LEAD_ID_INCORRETO = 17875;
const PHONE_INCORRETO = '11934840929';

console.log('\n🗑️ DELETANDO LEAD INCORRETO\n');
console.log('='.repeat(70));

async function deleteBadLead() {
    try {
        // Buscar o lead primeiro
        const { data: lead, error: fetchError } = await supabase
            .from('leads')
            .select('*')
            .eq('id', LEAD_ID_INCORRETO)
            .single();

        if (fetchError) {
            console.log('❌ Erro ao buscar lead:', fetchError.message);
            process.exit(1);
        }

        if (!lead) {
            console.log('❌ Lead não encontrado!');
            process.exit(1);
        }

        console.log('📋 Lead encontrado:');
        console.log(`   ID: ${lead.id}`);
        console.log(`   Phone: ${lead.phone}`);
        console.log(`   Nome: ${lead.first_name}`);
        console.log(`   Email: ${lead.email}`);
        console.log(`   Source: ${lead.source}`);
        console.log(`   Campaign ID: ${lead.campaign_id}`);
        console.log(`   Criado: ${new Date(lead.created_at).toLocaleString('pt-BR')}`);
        console.log('');

        // Deletar
        const { error: deleteError } = await supabase
            .from('leads')
            .delete()
            .eq('id', LEAD_ID_INCORRETO);

        if (deleteError) {
            console.log('❌ Erro ao deletar:', deleteError.message);
            process.exit(1);
        }

        console.log('✅ Lead deletado com sucesso!');
        console.log('');
        console.log('='.repeat(70));
        console.log('\n📋 PRÓXIMOS PASSOS:\n');
        console.log('1. ✅ Função normalizePhone() corrigida');
        console.log('2. ✅ Lead incorreto deletado');
        console.log('3. 🔄 Reimportar os contatos do grupo');
        console.log('4. ✅ Telefone fixo será importado corretamente (10 dígitos)');
        console.log('');
        console.log('='.repeat(70));

    } catch (err) {
        console.error('❌ Erro:', err);
    } finally {
        process.exit(0);
    }
}

deleteBadLead();
