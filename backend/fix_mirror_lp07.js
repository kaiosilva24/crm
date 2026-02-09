import 'dotenv/config';
import { supabase } from './src/database/supabase.js';

async function fixMirrorLP07() {
    console.log('🔧 CONFIGURANDO MIRROR SALES: LP 07 FEV SUPER INTERESSADO\n');

    try {
        // 1. Buscar campanhas
        const { data: campaigns } = await supabase
            .from('campaigns')
            .select('id, name, mirror_sales_source_id')
            .or('name.ilike.%LP 07%,name.ilike.%ALUNOS AVANÇADO%')
            .order('name');

        console.log('📋 Campanhas encontradas:');
        campaigns.forEach(c => console.log(`   - ID ${c.id}: ${c.name}`));
        console.log('');

        const lp07 = campaigns.find(c => c.name.includes('LP 07') && c.name.includes('SUPER INTERESSADO'));
        const alunosAvancado = campaigns.find(c => c.name.includes('ALUNOS') && c.name.includes('AVANÇADO'));

        if (!lp07) {
            console.log('❌ LP 07 FEV SUPER INTERESSADO não encontrada!');
            process.exit(1);
        }

        if (!alunosAvancado) {
            console.log('❌ ALUNOS AVANÇADO não encontrada!');
            process.exit(1);
        }

        console.log(`✅ Fonte: ${lp07.name} (ID: ${lp07.id})`);
        console.log(`✅ Alvo: ${alunosAvancado.name} (ID: ${alunosAvancado.id})\n`);

        // 2. Configurar espelhamento
        console.log(`🔄 Configurando ${alunosAvancado.name} para espelhar ${lp07.name}...`);

        const { error } = await supabase
            .from('campaigns')
            .update({
                mirror_sales_source_id: lp07.id,
                updated_at: new Date().toISOString()
            })
            .eq('id', alunosAvancado.id);

        if (error) {
            console.error('❌ Erro:', error);
            process.exit(1);
        }

        console.log('✅ Configuração salva!\n');

        // 3. Verificar
        const { data: verification } = await supabase
            .from('campaigns')
            .select('id, name, mirror_sales_source_id')
            .eq('id', alunosAvancado.id)
            .single();

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 VERIFICAÇÃO:');
        console.log(`   Campanha: ${verification.name}`);
        console.log(`   Mirror Source ID: ${verification.mirror_sales_source_id}`);
        console.log(`   Status: ${verification.mirror_sales_source_id === lp07.id ? '✅ CORRETO!' : '❌ ERRO!'}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('✅ PRONTO! Agora quando uma venda ocorrer em:');
        console.log(`   📥 "${lp07.name}"`);
        console.log('   O sistema irá:');
        console.log(`   1️⃣ Procurar o lead em "${alunosAvancado.name}"`);
        console.log('   2️⃣ Marcar como VENDIDO se encontrar\n');

    } catch (error) {
        console.error('❌ Erro:', error);
    }

    process.exit(0);
}

fixMirrorLP07();
