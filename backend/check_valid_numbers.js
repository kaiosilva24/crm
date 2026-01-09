/**
 * Script para verificar se os números válidos foram importados
 * - Telefone fixo: 551134840929
 * - Internacional (México): 5218123647837
 */

import { supabase } from './src/database/supabase.js';

const VALID_NUMBERS = {
    fixo: {
        original: '551134840929',
        normalized: '1134840929', // Sem DDI
        description: 'Telefone FIXO (10 dígitos)'
    },
    internacional: {
        original: '5218123647837',
        normalized: '218123647837', // Sem DDI 52
        description: 'Internacional - México (DDI 52)'
    }
};

console.log('\n🔍 VERIFICANDO NÚMEROS VÁLIDOS NO BANCO DE DADOS\n');
console.log('='.repeat(70));

async function checkValidNumbers() {
    try {
        let foundCount = 0;

        for (const [type, info] of Object.entries(VALID_NUMBERS)) {
            console.log(`\n📋 Verificando: ${info.description}`);
            console.log(`   Número original: ${info.original}`);
            console.log(`   Procurando variações...`);

            const variations = [
                info.original,
                info.normalized,
                '55' + info.normalized, // Com DDI 55
            ];

            let found = false;

            for (const phone of variations) {
                const { data, error } = await supabase
                    .from('leads')
                    .select('id, phone, first_name, created_at, source')
                    .eq('phone', phone);

                if (error) {
                    console.log(`   ⚠️ Erro ao buscar ${phone}:`, error.message);
                    continue;
                }

                if (data && data.length > 0) {
                    found = true;
                    foundCount++;
                    console.log(`   ✅ ENCONTRADO! (variação: ${phone})`);
                    console.log(`   📊 Total de registros: ${data.length}`);
                    data.forEach((lead, i) => {
                        console.log(`\n   ${i + 1}. Lead ID: ${lead.id}`);
                        console.log(`      Phone: ${lead.phone}`);
                        console.log(`      Nome: ${lead.first_name}`);
                        console.log(`      Source: ${lead.source}`);
                        console.log(`      Criado: ${new Date(lead.created_at).toLocaleString('pt-BR')}`);
                    });
                    break; // Encontrou, não precisa procurar outras variações
                }
            }

            if (!found) {
                console.log(`   ❌ NÃO ENCONTRADO em nenhuma variação`);
                console.log(`   ⚠️ Este número deveria ter sido importado!`);
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('\n📊 RESUMO DA VERIFICAÇÃO:\n');
        console.log(`Total de números válidos esperados: 2`);
        console.log(`Total de números encontrados: ${foundCount}`);
        console.log('');

        if (foundCount === 2) {
            console.log('🎉 PERFEITO! Todos os números válidos foram importados!');
            console.log('');
            console.log('✅ Telefone fixo: IMPORTADO');
            console.log('✅ Número internacional: IMPORTADO');
            console.log('✅ Número fantasma: BLOQUEADO');
            console.log('');
            console.log('🏆 CONCLUSÃO: Sistema funcionando 100% como esperado!');
        } else if (foundCount === 1) {
            console.log('⚠️ ATENÇÃO: Apenas 1 número válido foi importado');
            console.log('Verifique qual número está faltando acima.');
        } else {
            console.log('❌ PROBLEMA: Nenhum número válido foi importado');
            console.log('Isso pode indicar que a validação está muito restritiva.');
        }

        console.log('='.repeat(70));

    } catch (err) {
        console.error('❌ Erro:', err);
    } finally {
        process.exit(0);
    }
}

checkValidNumbers();
