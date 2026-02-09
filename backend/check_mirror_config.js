/**
 * Script para verificar configuração de Mirror Sales
 * Verifica se ALUNOS AVANÇADO LP07 está configurada para espelhar LP 07 FEV SUPER INTERESSADO
 */

import { supabase } from './src/database/supabase.js';

async function checkMirrorConfig() {
    console.log('🔍 Verificando configuração de espelhamento de vendas...\n');

    // 1. Buscar todas as campanhas
    const { data: campaigns, error: campError } = await supabase
        .from('campaigns')
        .select('id, name, mirror_sales_source_id, is_active')
        .order('name');

    if (campError) {
        console.error('❌ Erro ao buscar campanhas:', campError);
        return;
    }

    console.log('📋 Campanhas encontradas:');
    campaigns.forEach(c => {
        console.log(`   - ID: ${c.id} | Nome: ${c.name} | Ativa: ${c.is_active} | Mirror Source: ${c.mirror_sales_source_id || 'Nenhum'}`);
    });

    // 2. Buscar especificamente as campanhas mencionadas
    const lp07SuperInteressado = campaigns.find(c => c.name.includes('LP 07') && c.name.includes('SUPER INTERESSADO'));
    const alunosAvancadoLP07 = campaigns.find(c => c.name.includes('ALUNOS') && c.name.includes('AVANÇADO') && c.name.includes('LP07'));

    console.log('\n🎯 Campanhas específicas:');
    if (lp07SuperInteressado) {
        console.log(`   ✅ LP 07 SUPER INTERESSADO encontrada:`);
        console.log(`      - ID: ${lp07SuperInteressado.id}`);
        console.log(`      - Nome: ${lp07SuperInteressado.name}`);
        console.log(`      - Ativa: ${lp07SuperInteressado.is_active}`);
    } else {
        console.log('   ❌ LP 07 SUPER INTERESSADO NÃO encontrada');
    }

    if (alunosAvancadoLP07) {
        console.log(`   ✅ ALUNOS AVANÇADO LP07 encontrada:`);
        console.log(`      - ID: ${alunosAvancadoLP07.id}`);
        console.log(`      - Nome: ${alunosAvancadoLP07.name}`);
        console.log(`      - Ativa: ${alunosAvancadoLP07.is_active}`);
        console.log(`      - Mirror Source ID: ${alunosAvancadoLP07.mirror_sales_source_id || 'NÃO CONFIGURADO'}`);
    } else {
        console.log('   ❌ ALUNOS AVANÇADO LP07 NÃO encontrada');
    }

    // 3. Verificar se a configuração está correta
    console.log('\n🔍 Verificação da configuração:');
    if (lp07SuperInteressado && alunosAvancadoLP07) {
        if (alunosAvancadoLP07.mirror_sales_source_id === lp07SuperInteressado.id) {
            console.log('   ✅ CONFIGURAÇÃO CORRETA!');
            console.log(`   ✅ ALUNOS AVANÇADO LP07 está espelhando LP 07 SUPER INTERESSADO (ID: ${lp07SuperInteressado.id})`);
        } else {
            console.log('   ❌ CONFIGURAÇÃO INCORRETA!');
            console.log(`   ❌ Esperado: mirror_sales_source_id = ${lp07SuperInteressado.id}`);
            console.log(`   ❌ Atual: mirror_sales_source_id = ${alunosAvancadoLP07.mirror_sales_source_id || 'NULL'}`);
            console.log('\n💡 SOLUÇÃO: Atualizar a campanha ALUNOS AVANÇADO LP07 com o ID correto.');
        }
    }

    // 4. Verificar se há leads nas campanhas
    if (lp07SuperInteressado) {
        const { count: sourceLeadsCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', lp07SuperInteressado.id);

        console.log(`\n📊 Leads na campanha LP 07 SUPER INTERESSADO: ${sourceLeadsCount || 0}`);
    }

    if (alunosAvancadoLP07) {
        const { count: targetLeadsCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', alunosAvancadoLP07.id);

        const { count: soldLeadsCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', alunosAvancadoLP07.id)
            .eq('sale_completed', true);

        console.log(`📊 Leads na campanha ALUNOS AVANÇADO LP07: ${targetLeadsCount || 0}`);
        console.log(`   - Vendas marcadas: ${soldLeadsCount || 0}`);
    }

    process.exit(0);
}

checkMirrorConfig().catch(console.error);
