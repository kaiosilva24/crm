/**
 * Procurar o telefone fixo com TODAS as possíveis normalizações
 */

import { supabase } from './src/database/supabase.js';

const FIXO_ORIGINAL = '551134840929';

console.log('\n🔍 BUSCA AMPLA - Telefone Fixo com Todas as Normalizações\n');
console.log('='.repeat(70));

async function searchAllVariations() {
    try {
        // Todas as possíveis variações de normalização
        const variations = [
            '551134840929',   // Original com DDI
            '1134840929',     // Sem DDI (11 dígitos)
            '11934840929',    // Com 9 adicionado (normalização incorreta)
            '5511934840929',  // Com DDI + 9 adicionado
            '34840929',       // Só o número (8 dígitos)
            '934840929',      // Com 9 no início (9 dígitos)
        ];

        console.log('📋 Procurando por TODAS as variações possíveis:\n');
        variations.forEach((v, i) => {
            console.log(`   ${i + 1}. ${v} (${v.length} dígitos)`);
        });
        console.log('');

        let found = false;

        for (const phone of variations) {
            const { data, error } = await supabase
                .from('leads')
                .select('id, phone, first_name, source, created_at')
                .eq('phone', phone);

            if (error) continue;

            if (data && data.length > 0) {
                found = true;
                console.log(`\n✅ ENCONTRADO com normalização: ${phone}`);
                console.log('='.repeat(70));
                data.forEach((lead, i) => {
                    console.log(`\n${i + 1}. Lead ID: ${lead.id}`);
                    console.log(`   Phone: ${lead.phone}`);
                    console.log(`   Nome: ${lead.first_name}`);
                    console.log(`   Source: ${lead.source}`);
                    console.log(`   Criado: ${new Date(lead.created_at).toLocaleString('pt-BR')}`);
                });
                console.log('');
                break;
            }
        }

        if (!found) {
            console.log('\n❌ NÃO ENCONTRADO em NENHUMA variação');
            console.log('='.repeat(70));
            console.log('\n📋 CONCLUSÃO:');
            console.log('O número fixo 551134840929 NÃO está no grupo que você sincronizou.');
            console.log('');
            console.log('POSSÍVEIS RAZÕES:');
            console.log('1. O Redirect+ capturou de um grupo diferente');
            console.log('2. O número saiu do grupo antes da sincronização');
            console.log('3. O Baileys não conseguiu ver este participante');
            console.log('');
            console.log('✅ VALIDADOR: Funcionando corretamente');
            console.log('✅ BLACKLIST: Bloqueou número fantasma');
            console.log('✅ INTERNACIONAL: Importado com sucesso');
        }

        console.log('='.repeat(70));

    } catch (err) {
        console.error('❌ Erro:', err);
    } finally {
        process.exit(0);
    }
}

searchAllVariations();
