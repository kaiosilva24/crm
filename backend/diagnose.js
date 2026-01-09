/**
 * Script de diagnóstico completo
 * Compara números de leads com participantes de grupos
 */

import { supabase } from './src/database/supabase.js';
import { getActiveConnection } from './src/services/whatsappService.js';

function normalizeForComparison(phone) {
    if (!phone) return null;
    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.length > 11) {
        return cleaned;
    }

    if (cleaned.length === 11) {
        return '55' + cleaned;
    }

    if (cleaned.length === 10) {
        const ddd = cleaned.substring(0, 2);
        const firstDigit = cleaned.charAt(2);

        if (firstDigit === '9' || firstDigit === '8' || firstDigit === '7') {
            return '55' + ddd + '9' + cleaned.substring(2);
        }
        return '55' + cleaned;
    }

    if (cleaned.length < 10) {
        return null;
    }

    return cleaned;
}

async function diagnose() {
    console.log('\n' + '='.repeat(80));
    console.log('DIAGNOSTICO COMPLETO - LEADS vs GRUPOS');
    console.log('='.repeat(80) + '\n');

    // 1. BUSCAR LEADS
    console.log('1. BUSCANDO LEADS...');
    const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, phone, first_name')
        .not('phone', 'is', null);

    if (leadsError) {
        console.error('Erro ao buscar leads:', leadsError);
        process.exit(1);
    }

    const leadsWithPhone = leads.filter(l => l.phone && l.phone.trim() !== '');
    console.log(`   Total de leads: ${leads.length}`);
    console.log(`   Leads com telefone: ${leadsWithPhone.length}\n`);

    // Mostrar 10 exemplos de leads
    console.log('   EXEMPLOS DE LEADS (primeiros 10):');
    leadsWithPhone.slice(0, 10).forEach((lead, i) => {
        const normalized = normalizeForComparison(lead.phone);
        console.log(`   ${i + 1}. ${lead.first_name || 'Sem nome'}`);
        console.log(`      Original: "${lead.phone}"`);
        console.log(`      Normalizado: "${normalized}"`);
        console.log(`      Tamanho original: ${lead.phone.replace(/\D/g, '').length} digitos\n`);
    });

    // 2. BUSCAR GRUPOS
    console.log('\n2. BUSCANDO GRUPOS ASSOCIADOS A CAMPANHAS...');
    const { data: campaignGroups, error: cgError } = await supabase
        .from('campaign_groups')
        .select(`
            whatsapp_group_id,
            whatsapp_groups (
                id,
                group_id,
                group_name,
                connection_id
            )
        `);

    if (cgError) {
        console.error('Erro ao buscar grupos:', cgError);
        process.exit(1);
    }

    const groups = campaignGroups
        .map(cg => cg.whatsapp_groups)
        .filter(g => g !== null);

    console.log(`   Grupos associados a campanhas: ${groups.length}\n`);

    // 3. BUSCAR PARTICIPANTES
    console.log('3. BUSCANDO PARTICIPANTES DOS GRUPOS...');
    const groupParticipants = new Map();
    let totalParticipants = 0;
    const participantExamples = [];

    for (const group of groups) {
        try {
            const sock = getActiveConnection(group.connection_id);
            if (!sock) {
                console.log(`   ⚠️ Grupo "${group.group_name}": Conexão não ativa\n`);
                continue;
            }

            const groupMetadata = await sock.groupMetadata(group.group_id);
            const participants = groupMetadata.participants || [];
            totalParticipants += participants.length;

            console.log(`   ✅ Grupo "${group.group_name}": ${participants.length} participantes`);

            for (const participant of participants) {
                let phone = null;

                if (!participant.id.includes('@lid')) {
                    phone = participant.id.split('@')[0];
                } else if (participant.phoneNumber) {
                    phone = participant.phoneNumber;
                }

                if (phone) {
                    const normalized = normalizeForComparison(phone);
                    if (normalized) {
                        if (!groupParticipants.has(normalized)) {
                            groupParticipants.set(normalized, []);
                        }
                        groupParticipants.get(normalized).push(group.group_name);

                        // Guardar exemplos
                        if (participantExamples.length < 10) {
                            participantExamples.push({
                                original: phone,
                                normalized: normalized,
                                group: group.group_name
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`   ❌ Erro ao processar grupo "${group.group_name}":`, error.message);
        }
    }

    console.log(`\n   Total de participantes (com duplicatas): ${totalParticipants}`);
    console.log(`   Números únicos: ${groupParticipants.size}\n`);

    // Mostrar exemplos de participantes
    console.log('   EXEMPLOS DE PARTICIPANTES (primeiros 10):');
    participantExamples.forEach((p, i) => {
        console.log(`   ${i + 1}. Grupo: ${p.group}`);
        console.log(`      Original: "${p.original}"`);
        console.log(`      Normalizado: "${p.normalized}"`);
        console.log(`      Tamanho original: ${p.original.replace(/\D/g, '').length} digitos\n`);
    });

    // 4. COMPARAR
    console.log('\n4. COMPARANDO LEADS COM PARTICIPANTES...');
    let matches = 0;
    let noMatches = 0;
    const matchExamples = [];
    const noMatchExamples = [];

    for (const lead of leadsWithPhone) {
        const normalized = normalizeForComparison(lead.phone);
        if (!normalized) {
            noMatches++;
            continue;
        }

        if (groupParticipants.has(normalized)) {
            matches++;
            if (matchExamples.length < 5) {
                matchExamples.push({
                    name: lead.first_name || 'Sem nome',
                    phone: lead.phone,
                    normalized: normalized,
                    groups: groupParticipants.get(normalized)
                });
            }
        } else {
            noMatches++;
            if (noMatchExamples.length < 5) {
                noMatchExamples.push({
                    name: lead.first_name || 'Sem nome',
                    phone: lead.phone,
                    normalized: normalized
                });
            }
        }
    }

    console.log(`   ✅ Matches encontrados: ${matches}`);
    console.log(`   ❌ Não encontrados: ${noMatches}`);
    console.log(`   📊 Taxa de match: ${((matches / leadsWithPhone.length) * 100).toFixed(2)}%\n`);

    // Mostrar exemplos de matches
    if (matchExamples.length > 0) {
        console.log('   EXEMPLOS DE LEADS ENCONTRADOS NOS GRUPOS:');
        matchExamples.forEach((m, i) => {
            console.log(`   ${i + 1}. ${m.name}`);
            console.log(`      Telefone: ${m.phone} → ${m.normalized}`);
            console.log(`      Grupos: ${m.groups.join(', ')}\n`);
        });
    }

    // Mostrar exemplos de não-matches
    if (noMatchExamples.length > 0) {
        console.log('   EXEMPLOS DE LEADS NÃO ENCONTRADOS:');
        noMatchExamples.forEach((m, i) => {
            console.log(`   ${i + 1}. ${m.name}`);
            console.log(`      Telefone: ${m.phone} → ${m.normalized}\n`);
        });
    }

    // 5. ANÁLISE DE PADRÕES
    console.log('\n5. ANÁLISE DE PADRÕES...');

    // Tamanhos dos números dos leads
    const leadLengths = new Map();
    leadsWithPhone.forEach(lead => {
        const len = lead.phone.replace(/\D/g, '').length;
        leadLengths.set(len, (leadLengths.get(len) || 0) + 1);
    });

    console.log('   Distribuição de tamanhos - LEADS:');
    Array.from(leadLengths.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([len, count]) => {
            console.log(`      ${len} dígitos: ${count} leads (${((count / leadsWithPhone.length) * 100).toFixed(1)}%)`);
        });

    // Tamanhos dos números dos grupos
    const groupLengths = new Map();
    Array.from(groupParticipants.keys()).forEach(phone => {
        const len = phone.length;
        groupLengths.set(len, (groupLengths.get(len) || 0) + 1);
    });

    console.log('\n   Distribuição de tamanhos - GRUPOS:');
    Array.from(groupLengths.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([len, count]) => {
            console.log(`      ${len} dígitos: ${count} números (${((count / groupParticipants.size) * 100).toFixed(1)}%)`);
        });

    console.log('\n' + '='.repeat(80));
    console.log('DIAGNÓSTICO CONCLUÍDO');
    console.log('='.repeat(80) + '\n');

    process.exit(0);
}

diagnose().catch(error => {
    console.error('\n❌ ERRO:', error);
    console.error(error.stack);
    process.exit(1);
});
