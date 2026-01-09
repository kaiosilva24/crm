/**
 * Verificar como o telefone fixo está salvo no banco
 * e identificar os 5 números que faltam
 */

import { supabase } from './src/database/supabase.js';

const NUMEROS_FALTANDO = [
    '5551995441658',
    '5519984104599', // Fantasma conhecido
    '5512997467112', // Fantasma conhecido
    '551134840929',  // Fixo
    '5511981194533'  // Fantasma conhecido
];

console.log('\n🔍 VERIFICANDO NÚMEROS QUE FALTAM NO BAILEYS\n');
console.log('='.repeat(70));

async function checkMissingNumbers() {
    try {
        console.log('📋 Números do Redirect+ que não estão no Baileys:\n');

        for (const numero of NUMEROS_FALTANDO) {
            console.log(`\n🔍 Procurando: ${numero}`);
            console.log(`   Tamanho: ${numero.length} dígitos`);

            // Gerar variações possíveis
            const variations = [
                numero,
                numero.substring(2), // Sem DDI
                numero.substring(0, 2) + '9' + numero.substring(2), // Com 9 adicionado
            ];

            let found = false;

            for (const phone of variations) {
                const { data, error } = await supabase
                    .from('leads')
                    .select('id, phone, first_name, source')
                    .eq('phone', phone);

                if (error) continue;

                if (data && data.length > 0) {
                    found = true;
                    console.log(`   ✅ ENCONTRADO como: ${phone}`);
                    data.forEach(lead => {
                        console.log(`      Lead ID: ${lead.id}, Nome: ${lead.first_name}, Source: ${lead.source}`);
                    });
                    break;
                }
            }

            if (!found) {
                console.log(`   ❌ NÃO ENCONTRADO em nenhuma variação`);

                // Verificar se é fantasma conhecido
                if (['5519984104599', '5512997467112', '5511981194533'].includes(numero)) {
                    console.log(`   🚫 FANTASMA CONHECIDO - Bloqueado pela blacklist ✅`);
                } else {
                    console.log(`   ⚠️ NÚMERO VÁLIDO que deveria ter sido importado!`);
                }
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('\n📊 RESUMO:\n');
        console.log('Números fantasmas (esperado não importar): 3');
        console.log('  - 5519984104599 ✅');
        console.log('  - 5512997467112 ✅');
        console.log('  - 5511981194533 ✅');
        console.log('');
        console.log('Números válidos (esperado importar): 2');
        console.log('  - 5551995441658 (celular)');
        console.log('  - 551134840929 (fixo)');
        console.log('');
        console.log('='.repeat(70));

    } catch (err) {
        console.error('❌ Erro:', err);
    } finally {
        process.exit(0);
    }
}

checkMissingNumbers();
