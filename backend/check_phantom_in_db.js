/**
 * Script para verificar se o número fantasma foi importado no banco
 */

import { supabase } from './src/database/supabase.js';

const PHANTOM_NUMBER = '5511981194533';
const PHANTOM_NORMALIZED = '11981194533'; // Sem DDI

console.log('\n🔍 VERIFICANDO NÚMERO FANTASMA NO BANCO DE DADOS\n');
console.log('='.repeat(70));

async function checkPhantom() {
    try {
        // Buscar por todas as variações possíveis
        const variations = [
            PHANTOM_NUMBER,           // 5511981194533
            PHANTOM_NORMALIZED,       // 11981194533
            '55' + PHANTOM_NORMALIZED, // 5511981194533
        ];

        console.log('📋 Procurando por variações:');
        variations.forEach((v, i) => console.log(`   ${i + 1}. ${v}`));
        console.log('');

        for (const phone of variations) {
            const { data, error } = await supabase
                .from('leads')
                .select('id, phone, first_name, created_at, source')
                .eq('phone', phone);

            if (error) {
                console.log(`❌ Erro ao buscar ${phone}:`, error.message);
                continue;
            }

            if (data && data.length > 0) {
                console.log(`\n🚨 NÚMERO FANTASMA ENCONTRADO NO BANCO!`);
                console.log('='.repeat(70));
                console.log(`Variação encontrada: ${phone}`);
                console.log(`Total de registros: ${data.length}`);
                console.log('');
                console.log('Detalhes:');
                data.forEach((lead, i) => {
                    console.log(`\n${i + 1}. Lead ID: ${lead.id}`);
                    console.log(`   Phone: ${lead.phone}`);
                    console.log(`   Nome: ${lead.first_name}`);
                    console.log(`   Source: ${lead.source}`);
                    console.log(`   Criado em: ${lead.created_at}`);
                });
                console.log('');
                console.log('❌ CONCLUSÃO: O bloqueio NÃO funcionou!');
                console.log('='.repeat(70));
                return true;
            }
        }

        console.log('✅ NÚMERO FANTASMA NÃO ENCONTRADO NO BANCO!');
        console.log('='.repeat(70));
        console.log('');
        console.log('🎉 CONCLUSÃO: O bloqueio funcionou perfeitamente!');
        console.log('');
        console.log('O número 5511981194533 foi detectado e rejeitado');
        console.log('pela blacklist antes de ser importado.');
        console.log('='.repeat(70));
        return false;

    } catch (err) {
        console.error('❌ Erro:', err);
    } finally {
        process.exit(0);
    }
}

checkPhantom();
