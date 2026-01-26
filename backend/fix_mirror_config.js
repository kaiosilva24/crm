import 'dotenv/config';
import { supabase } from './src/database/supabase.js';

async function fixMirrorConfig() {
    console.log('🔧 CORRIGINDO CONFIGURAÇÃO MIRROR BUYERS\n');

    try {
        // 1. Remover configuração incorreta
        console.log('1️⃣ Removendo configuração incorreta de "LP 06 JAN SUPER INTERESSADOS"...');
        const { error: error1 } = await supabase
            .from('campaigns')
            .update({
                mirror_sales_source_id: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', 10);

        if (error1) {
            console.error('❌ Erro:', error1);
            return;
        }
        console.log('   ✅ Removido\n');

        // 2. Adicionar configuração correta
        console.log('2️⃣ Adicionando configuração correta em "ALUNOS AVANÇADO"...');
        const { error: error2 } = await supabase
            .from('campaigns')
            .update({
                mirror_sales_source_id: 10,
                updated_at: new Date().toISOString()
            })
            .eq('id', 7);

        if (error2) {
            console.error('❌ Erro:', error2);
            return;
        }
        console.log('   ✅ Configurado\n');

        // 3. Verificar resultado
        console.log('3️⃣ Verificando configuração final...\n');
        const { data: campaigns } = await supabase
            .from('campaigns')
            .select('id, name, mirror_sales_source_id')
            .in('id', [7, 10])
            .order('id');

        for (const camp of campaigns) {
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📁 ${camp.name} (ID: ${camp.id})`);

            if (camp.mirror_sales_source_id) {
                const source = campaigns.find(c => c.id === camp.mirror_sales_source_id);
                console.log(`   💰 Espelha COMPRADORES de: ${source ? source.name : camp.mirror_sales_source_id}`);
                console.log(`   ✅ Quando um lead entrar em "${source ? source.name : camp.mirror_sales_source_id}",`);
                console.log(`      se existir em "${camp.name}", será marcado como VENDIDO.`);
            } else {
                console.log(`   ⚪ Sem configuração de Mirror Buyers`);
            }
            console.log('');
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ CONFIGURAÇÃO CORRIGIDA COM SUCESSO!\n');
        console.log('📝 Agora, quando um lead entrar em "LP 06 JAN SUPER INTERESSADOS",');
        console.log('   o sistema vai verificar se ele existe em "ALUNOS AVANÇADO"');
        console.log('   e marcar como VENDIDO automaticamente.\n');

    } catch (error) {
        console.error('❌ Erro:', error);
    }

    process.exit(0);
}

fixMirrorConfig();
