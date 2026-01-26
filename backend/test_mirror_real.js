import 'dotenv/config';
import { supabase } from './src/database/supabase.js';

async function testMirrorWithRealLead() {
    console.log('🧪 TESTANDO MIRROR BUYERS COM LEAD REAL\n');

    try {
        // Pegar o lead mais recente que entrou via webhook3 (ALUNOS AVANÇADO)
        const testEmail = 'simalmeida2108@gmail.com'; // Simone Alves ze Almeida - comprou às 14:47

        console.log(`📧 Testando com: ${testEmail}\n`);

        // 1. Verificar se existe em ALUNOS AVANÇADO
        console.log('1️⃣ Verificando em ALUNOS AVANÇADO (ID: 7)...\n');

        const { data: leadAvancado, error: error1 } = await supabase
            .from('leads')
            .select('*')
            .eq('campaign_id', 7)
            .ilike('email', testEmail)
            .single();

        if (error1 || !leadAvancado) {
            console.log('❌ Lead NÃO encontrado em ALUNOS AVANÇADO');
            console.log('   Isso é estranho, pois o webhook criou esse lead...\n');
        } else {
            console.log('✅ Lead encontrado em ALUNOS AVANÇADO:');
            console.log(`   UUID: ${leadAvancado.uuid}`);
            console.log(`   Nome: ${leadAvancado.first_name}`);
            console.log(`   Email: ${leadAvancado.email}`);
            console.log(`   Telefone: ${leadAvancado.phone}`);
            console.log(`   Criado em: ${new Date(leadAvancado.created_at).toLocaleString('pt-BR')}`);
            console.log('');
        }

        // 2. Verificar se existe em LP 06 JAN SUPER INTERESSADOS
        console.log('2️⃣ Verificando em LP 06 JAN SUPER INTERESSADOS (ID: 10)...\n');

        const { data: leadLP06, error: error2 } = await supabase
            .from('leads')
            .select('*')
            .eq('campaign_id', 10)
            .ilike('email', testEmail)
            .single();

        if (error2 || !leadLP06) {
            console.log('❌ Lead NÃO encontrado em LP 06 JAN SUPER INTERESSADOS');
            console.log('   ⚠️ PROBLEMA IDENTIFICADO!');
            console.log('   O lead precisa EXISTIR em LP06 ANTES de comprar.');
            console.log('   Como ele não existe lá, o Mirror Buyers não tem o que marcar!\n');
        } else {
            console.log('✅ Lead encontrado em LP 06 JAN SUPER INTERESSADOS:');
            console.log(`   UUID: ${leadLP06.uuid}`);
            console.log(`   Nome: ${leadLP06.first_name}`);
            console.log(`   Email: ${leadLP06.email}`);
            console.log(`   Telefone: ${leadLP06.phone}`);
            console.log(`   Vendido: ${leadLP06.sale_completed ? '✅ SIM' : '❌ NÃO'}`);
            console.log(`   Criado em: ${new Date(leadLP06.created_at).toLocaleString('pt-BR')}`);

            if (leadLP06.observations) {
                console.log(`   Observações:\n${leadLP06.observations}`);
            }
            console.log('');
        }

        // 3. Buscar um lead que existe em AMBAS as campanhas
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('3️⃣ Procurando leads que existem em AMBAS as campanhas...\n');

        const { data: leadsLP06 } = await supabase
            .from('leads')
            .select('email, phone, first_name, sale_completed')
            .eq('campaign_id', 10)
            .not('email', 'is', null)
            .limit(100);

        if (!leadsLP06 || leadsLP06.length === 0) {
            console.log('❌ Nenhum lead encontrado em LP06\n');
        } else {
            console.log(`📊 Total de leads em LP06: ${leadsLP06.length}`);

            let foundInBoth = 0;
            let markedAsSold = 0;

            for (const lp06Lead of leadsLP06) {
                // Verificar se existe em ALUNOS AVANÇADO
                const { data: avancadoLead } = await supabase
                    .from('leads')
                    .select('id, created_at')
                    .eq('campaign_id', 7)
                    .ilike('email', lp06Lead.email)
                    .single();

                if (avancadoLead) {
                    foundInBoth++;
                    if (lp06Lead.sale_completed) {
                        markedAsSold++;
                    }

                    console.log(`\n   📧 ${lp06Lead.email}`);
                    console.log(`      Nome: ${lp06Lead.first_name}`);
                    console.log(`      Existe em ALUNOS AVANÇADO: ✅ Sim (criado em ${new Date(avancadoLead.created_at).toLocaleString('pt-BR')})`);
                    console.log(`      Marcado como VENDIDO em LP06: ${lp06Lead.sale_completed ? '✅ SIM' : '❌ NÃO'}`);
                }
            }

            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📊 RESUMO:`);
            console.log(`   Total em LP06: ${leadsLP06.length}`);
            console.log(`   Existem em ambas: ${foundInBoth}`);
            console.log(`   Marcados como vendidos: ${markedAsSold}`);
            console.log(`   Deveriam estar marcados: ${foundInBoth}`);

            if (foundInBoth > markedAsSold) {
                console.log(`\n   ⚠️ PROBLEMA: ${foundInBoth - markedAsSold} leads não foram marcados como vendidos!`);
                console.log(`   Isso significa que o Mirror Buyers NÃO está funcionando.\n`);
            } else if (foundInBoth === markedAsSold && foundInBoth > 0) {
                console.log(`\n   ✅ Todos os leads que deveriam estar marcados ESTÃO marcados!`);
                console.log(`   O Mirror Buyers está funcionando corretamente.\n`);
            } else {
                console.log(`\n   ℹ️ Nenhum lead existe em ambas as campanhas para testar.\n`);
            }
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    }

    process.exit(0);
}

testMirrorWithRealLead();
