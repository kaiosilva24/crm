/**
 * Investigar o número 5511934840929 que apareceu na exportação
 * mas não deveria existir
 */

import { supabase } from './src/database/supabase.js';

const NUMERO_SUSPEITO = '5511934840929';

console.log('\n🔍 INVESTIGAÇÃO: Número Suspeito na Exportação\n');
console.log('='.repeat(70));
console.log(`Número: ${NUMERO_SUSPEITO}`);
console.log('='.repeat(70));

async function investigateNumber() {
    try {
        // Análise do número
        console.log('\n📊 ANÁLISE DO NÚMERO:');
        console.log(`Tamanho: ${NUMERO_SUSPEITO.length} dígitos`);
        console.log(`DDI: ${NUMERO_SUSPEITO.substring(0, 2)}`);
        console.log(`DDD: ${NUMERO_SUSPEITO.substring(2, 4)}`);
        console.log(`3º dígito: ${NUMERO_SUSPEITO.charAt(4)} ${NUMERO_SUSPEITO.charAt(4) === '9' ? '(celular)' : '(fixo?)'}`);
        console.log(`Número: ${NUMERO_SUSPEITO.substring(4)}`);

        // Comparação com o fixo original
        const FIXO_ORIGINAL = '551134840929';
        const FIXO_NORMALIZADO = '11934840929';

        console.log('\n🔄 COMPARAÇÃO:');
        console.log(`Fixo original:     ${FIXO_ORIGINAL} (12 dígitos)`);
        console.log(`Fixo normalizado:  ${FIXO_NORMALIZADO} (11 dígitos)`);
        console.log(`Número suspeito:   ${NUMERO_SUSPEITO} (13 dígitos)`);
        console.log('');
        console.log('⚠️ PROBLEMA IDENTIFICADO:');
        console.log('O número suspeito tem 13 dígitos = DDI 55 + DDD 11 + 9 + número');
        console.log('Parece que o sistema adicionou um "9" ao telefone FIXO!');
        console.log('');
        console.log('TRANSFORMAÇÃO INCORRETA:');
        console.log(`551134840929 (fixo) → 5511934840929 (celular incorreto)`);

        // Buscar todas as variações
        const variations = [
            NUMERO_SUSPEITO,      // 5511934840929
            '11934840929',        // Sem DDI
            FIXO_ORIGINAL,        // 551134840929
            FIXO_NORMALIZADO,     // 11934840929
            '1134840929',         // Fixo sem DDI
        ];

        console.log('\n🔍 BUSCANDO NO BANCO DE DADOS:\n');

        let foundInLeads = false;

        for (const phone of variations) {
            console.log(`Procurando: ${phone}...`);

            const { data, error } = await supabase
                .from('leads')
                .select('id, phone, first_name, email, source, created_at, campaign_id')
                .eq('phone', phone);

            if (error) {
                console.log(`  ❌ Erro: ${error.message}`);
                continue;
            }

            if (data && data.length > 0) {
                foundInLeads = true;
                console.log(`  ✅ ENCONTRADO! (${data.length} registro(s))`);
                data.forEach((lead, i) => {
                    console.log(`\n  ${i + 1}. Lead ID: ${lead.id}`);
                    console.log(`     Phone: ${lead.phone}`);
                    console.log(`     Nome: ${lead.first_name}`);
                    console.log(`     Email: ${lead.email}`);
                    console.log(`     Source: ${lead.source}`);
                    console.log(`     Campaign ID: ${lead.campaign_id}`);
                    console.log(`     Criado: ${new Date(lead.created_at).toLocaleString('pt-BR')}`);
                });
            } else {
                console.log(`  ❌ Não encontrado`);
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('\n📋 CONCLUSÃO:\n');

        if (foundInLeads) {
            console.log('⚠️ O número FOI ENCONTRADO na tabela leads!');
            console.log('');
            console.log('POSSÍVEIS CAUSAS:');
            console.log('1. Normalização incorreta adicionou "9" ao telefone fixo');
            console.log('2. O número foi importado em uma sincronização anterior');
            console.log('3. Bug na função normalizePhone() que adiciona 9 em fixos');
            console.log('');
            console.log('SOLUÇÃO:');
            console.log('1. Deletar este lead do banco');
            console.log('2. Corrigir a função normalizePhone() para não adicionar 9 em fixos');
            console.log('3. Reimportar os contatos');
        } else {
            console.log('❓ O número NÃO foi encontrado na tabela leads!');
            console.log('');
            console.log('POSSÍVEIS CAUSAS:');
            console.log('1. Foi exportado de outra tabela (não leads)');
            console.log('2. Bug na função de exportação');
            console.log('3. Cache do frontend mostrando dados antigos');
            console.log('');
            console.log('PRÓXIMO PASSO:');
            console.log('Verificar de onde veio este número na exportação.');
        }

        console.log('='.repeat(70));

    } catch (err) {
        console.error('❌ Erro:', err);
    } finally {
        process.exit(0);
    }
}

investigateNumber();
