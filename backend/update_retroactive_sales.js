/**
 * Script para atualizar retroativamente leads vendidos
 * DIREÇÃO CORRETA: ALUNOS AVANÇADO → LP 07 SUPER INTERESSADO
 * Quando um lead existe em ALUNOS AVANÇADO, marca como vendido em LP 07 SUPER INTERESSADO
 */

import 'dotenv/config';
import { supabase } from './src/database/supabase.js';

async function updateRetroactiveSalesCorrect() {
    console.log('🔄 ATUALIZANDO VENDAS RETROATIVAS (DIREÇÃO CORRETA)\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        // 1. Buscar campanhas
        const { data: campaigns } = await supabase
            .from('campaigns')
            .select('id, name')
            .or('name.ilike.%LP 07%SUPER INTERESSADO%,name.ilike.%ALUNOS AVANÇADO%LP07%');

        const lp07SuperInteressado = campaigns.find(c =>
            c.name.includes('LP 07') && c.name.includes('SUPER INTERESSADO')
        );
        const alunosAvancado = campaigns.find(c =>
            c.name.includes('ALUNOS') && c.name.includes('AVANÇADO') && c.name.includes('LP07')
        );

        if (!lp07SuperInteressado || !alunosAvancado) {
            console.log('❌ Campanhas não encontradas!');
            process.exit(1);
        }

        console.log(`📥 Campanha FONTE (vendas): ${alunosAvancado.name} (ID: ${alunosAvancado.id})`);
        console.log(`📤 Campanha ALVO (marcar): ${lp07SuperInteressado.name} (ID: ${lp07SuperInteressado.id})`);
        console.log(`\n💡 LÓGICA: Leads em ALUNOS AVANÇADO → Marcar como vendido em LP 07 SUPER INTERESSADO\n`);

        // 2. Buscar TODOS os leads da campanha ALUNOS AVANÇADO (FONTE)
        console.log('🔍 Buscando leads em ALUNOS AVANÇADO LP07 (fonte)...');
        const { data: sourceLeads, error: sourceError } = await supabase
            .from('leads')
            .select('id, email, phone, first_name')
            .eq('campaign_id', alunosAvancado.id);

        if (sourceError) {
            console.error('❌ Erro ao buscar leads fonte:', sourceError);
            process.exit(1);
        }

        console.log(`   ✅ Encontrados ${sourceLeads.length} leads\n`);

        // 3. Buscar TODOS os leads da campanha LP 07 SUPER INTERESSADO (ALVO)
        console.log('🔍 Buscando leads em LP 07 SUPER INTERESSADO (alvo)...');
        const { data: targetLeads, error: targetError } = await supabase
            .from('leads')
            .select('id, uuid, email, phone, first_name, sale_completed')
            .eq('campaign_id', lp07SuperInteressado.id);

        if (targetError) {
            console.error('❌ Erro ao buscar leads alvo:', targetError);
            process.exit(1);
        }

        console.log(`   ✅ Encontrados ${targetLeads.length} leads\n`);

        // 4. Cruzar dados e marcar vendas
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔄 INICIANDO CRUZAMENTO DE DADOS...\n');

        let matched = 0;
        let alreadySold = 0;
        let updated = 0;

        for (const targetLead of targetLeads) {
            // Procurar correspondência por email ou telefone
            const match = sourceLeads.find(sourceLead => {
                // Match por email (case insensitive)
                if (targetLead.email && sourceLead.email) {
                    if (targetLead.email.toLowerCase() === sourceLead.email.toLowerCase()) {
                        return true;
                    }
                }

                // Match por telefone (últimos 8 dígitos)
                if (targetLead.phone && sourceLead.phone) {
                    const targetPhone = targetLead.phone.replace(/\D/g, '').slice(-8);
                    const sourcePhone = sourceLead.phone.replace(/\D/g, '').slice(-8);
                    if (targetPhone === sourcePhone && targetPhone.length >= 8) {
                        return true;
                    }
                }

                return false;
            });

            if (match) {
                matched++;
                console.log(`✅ Match: ${targetLead.first_name} (${targetLead.email || targetLead.phone})`);

                // Verificar se já está marcado como vendido
                if (targetLead.sale_completed) {
                    alreadySold++;
                    console.log(`   ℹ️  Já estava marcado como vendido\n`);
                } else {
                    // Marcar como vendido
                    const obs = `[AUTO RETROATIVO] Venda espelhada da campanha ${alunosAvancado.name} em ${new Date().toLocaleString('pt-BR')}`;
                    const newObs = targetLead.observations
                        ? `${targetLead.observations}\n${obs}`
                        : obs;

                    const { error: updateError } = await supabase
                        .from('leads')
                        .update({
                            sale_completed: true,
                            observations: newObs,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', targetLead.id);

                    if (updateError) {
                        console.error(`   ❌ Erro ao atualizar: ${updateError.message}\n`);
                    } else {
                        updated++;
                        console.log(`   ✅ MARCADO COMO VENDIDO em LP 07 SUPER INTERESSADO!\n`);
                    }
                }
            }
        }

        // 5. Resumo
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 RESUMO DA ATUALIZAÇÃO:\n');
        console.log(`   📥 Leads em ALUNOS AVANÇADO LP07 (fonte): ${sourceLeads.length}`);
        console.log(`   📤 Leads em LP 07 SUPER INTERESSADO (alvo): ${targetLeads.length}`);
        console.log(`   🔗 Correspondências encontradas: ${matched}`);
        console.log(`   ℹ️  Já estavam vendidos: ${alreadySold}`);
        console.log(`   ✅ Atualizados agora: ${updated}`);
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        if (updated > 0) {
            console.log(`✅ SUCESSO! ${updated} leads em LP 07 SUPER INTERESSADO foram marcados como vendidos!`);
        } else if (matched > 0 && alreadySold === matched) {
            console.log('ℹ️  Todos os leads correspondentes já estavam marcados como vendidos.');
        } else {
            console.log('ℹ️  Nenhuma atualização necessária.');
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    }

    process.exit(0);
}

updateRetroactiveSalesCorrect();
