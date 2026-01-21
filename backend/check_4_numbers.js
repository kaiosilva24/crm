/**
 * Verificar status detalhado dos 4 números específicos
 */

import { supabase } from './src/database/supabase.js';

const NUMEROS_ESPECIFICOS = [
    { numero: '5551995441658', tipo: 'Celular' },
    { numero: '5519984104599', tipo: 'Fantasma conhecido' },
    { numero: '5512997467112', tipo: 'Fantasma conhecido' },
    { numero: '5511981194533', tipo: 'Fantasma conhecido' }
];

console.log('\n🔍 VERIFICAÇÃO DETALHADA DOS 4 NÚMEROS\n');
console.log('='.repeat(70));

async function checkSpecificNumbers() {
    try {
        for (const item of NUMEROS_ESPECIFICOS) {
            const { numero, tipo } = item;

            console.log(`\n📋 ${numero} (${tipo})`);
            console.log('-'.repeat(70));

            // Gerar todas as variações possíveis
            const variations = [
                numero,                              // Original
                numero.substring(2),                 // Sem DDI
                numero.substring(0, 2) + '9' + numero.substring(2), // Com 9 adicionado
            ];

            let found = false;
            let foundVariation = null;
            let leadData = null;

            for (const phone of variations) {
                const { data, error } = await supabase
                    .from('leads')
                    .select('id, phone, first_name, source, created_at')
                    .eq('phone', phone);

                if (error) continue;

                if (data && data.length > 0) {
                    found = true;
                    foundVariation = phone;
                    leadData = data[0];
                    break;
                }
            }

            if (found) {
                console.log(`✅ ENCONTRADO NO BANCO`);
                console.log(`   Salvo como: ${foundVariation}`);
                console.log(`   Lead ID: ${leadData.id}`);
                console.log(`   Nome: ${leadData.first_name}`);
                console.log(`   Source: ${leadData.source}`);
                console.log(`   Criado: ${new Date(leadData.created_at).toLocaleString('pt-BR')}`);

                if (tipo.includes('Fantasma')) {
                    console.log(`   ⚠️ PROBLEMA: Fantasma foi importado! Deveria ter sido bloqueado!`);
                } else {
                    console.log(`   ✅ OK: Número válido importado corretamente`);
                }
            } else {
                console.log(`❌ NÃO ENCONTRADO NO BANCO`);

                if (tipo.includes('Fantasma')) {
                    console.log(`   ✅ OK: Fantasma bloqueado pela blacklist`);
                } else {
                    console.log(`   ❌ PROBLEMA: Número válido não foi importado!`);
                    console.log(`   Possíveis causas:`);
                    console.log(`   1. Não está no grupo que você sincronizou`);
                    console.log(`   2. Baileys não conseguiu capturar`);
                    console.log(`   3. Foi rejeitado por alguma validação`);
                }
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('\n📊 RESUMO:\n');

        // Contar quantos foram encontrados
        let validosEncontrados = 0;
        let fantasmasEncontrados = 0;

        for (const item of NUMEROS_ESPECIFICOS) {
            const variations = [
                item.numero,
                item.numero.substring(2),
                item.numero.substring(0, 2) + '9' + item.numero.substring(2),
            ];

            for (const phone of variations) {
                const { data } = await supabase
                    .from('leads')
                    .select('id')
                    .eq('phone', phone);

                if (data && data.length > 0) {
                    if (item.tipo.includes('Fantasma')) {
                        fantasmasEncontrados++;
                    } else {
                        validosEncontrados++;
                    }
                    break;
                }
            }
        }

        console.log(`Números válidos (esperado: 1):`);
        console.log(`  - Encontrados: ${validosEncontrados} ${validosEncontrados === 1 ? '✅' : '❌'}`);
        console.log('');
        console.log(`Números fantasmas (esperado: 0):`);
        console.log(`  - Encontrados: ${fantasmasEncontrados} ${fantasmasEncontrados === 0 ? '✅' : '❌'}`);
        console.log('');

        if (validosEncontrados === 1 && fantasmasEncontrados === 0) {
            console.log('🎉 PERFEITO! Sistema funcionando 100%');
        } else {
            console.log('⚠️ Há problemas a corrigir');
        }

        console.log('='.repeat(70));

    } catch (err) {
        console.error('❌ Erro:', err);
    } finally {
        process.exit(0);
    }
}

checkSpecificNumbers();
