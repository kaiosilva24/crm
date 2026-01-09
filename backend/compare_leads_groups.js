/**
 * Script para comparar números de leads com participantes de grupos
 * e identificar por que apenas 313 de 812 estão sendo encontrados
 */

import { supabase } from './src/database/supabase.js';
import { getActiveConnection } from './src/services/whatsappService.js';

function normalizeForComparison(phone) {
    if (!phone) return null;

    // Remove tudo que não é número
    let cleaned = phone.replace(/\D/g, '');

    // Se já tem DDI (mais de 11 dígitos), manter como está
    if (cleaned.length > 11) {
        return cleaned;
    }

    // Se tem 11 dígitos (número brasileiro sem DDI), adicionar 55
    if (cleaned.length === 11) {
        return '55' + cleaned;
    }

    // Se tem 10 dígitos, verificar se é celular ou fixo
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

async function compareLeadsWithGroups() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 COMPARAÇÃO DETALHADA: LEADS vs GRUPOS');
    console.log('='.repeat(80));
    console.log('');

    // 1. Buscar todos os leads
    const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, phone, first_name');

    if (leadsError) throw leadsError;

    console.log(`📊 Total de leads: ${leads.length}`);

    const leadsWithPhone = leads.filter(l => l.phone && l.phone.trim() !== '');
    console.log(`📊 Leads com telefone: ${leadsWithPhone.length}`);

    // 2. Buscar grupos associados a campanhas
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

    if (cgError) throw cgError;

    const groups = campaignGroups
        .map(cg => cg.whatsapp_groups)
        .filter(g => g !== null);

    console.log(`📊 Grupos associados a campanhas: ${groups.length}`);
    console.log('');

    // 3. Buscar participantes dos grupos
    const groupParticipants = new Map();
    let totalParticipants = 0;

    for (const group of groups) {
        try {
            const sock = getActiveConnection(group.connection_id);
            if (!sock) {
                console.log(`⚠️ Conexão ${group.connection_id} não ativa, pulando grupo ${group.group_name}`);
                continue;
            }

            const groupMetadata = await sock.groupMetadata(group.group_id);
            const participants = groupMetadata.participants || [];
            totalParticipants += participants.length;

            console.log(`📱 Grupo "${group.group_name}": ${participants.length} participantes`);

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
                    }
                }
            }
        } catch (error) {
            console.error(`❌ Erro ao processar grupo ${group.group_name}:`, error.message);
        }
    }

    console.log('');
    console.log(`📊 Total de participantes (com duplicatas): ${totalParticipants}`);
    console.log(`📊 Números únicos nos grupos: ${groupParticipants.size}`);
    console.log('');

    // 4. Mostrar exemplos de números dos grupos
    console.log('📱 EXEMPLOS DE NÚMEROS DOS GRUPOS (primeiros 10):');
    const groupSamples = Array.from(groupParticipants.keys()).slice(0, 10);
    groupSamples.forEach((phone, idx) => {
        console.log(`   ${idx + 1}. ${phone}`);
    });
    console.log('');

    // 5. Mostrar exemplos de números dos leads
    console.log('📱 EXEMPLOS DE NÚMEROS DOS LEADS (primeiros 10):');
    leadsWithPhone.slice(0, 10).forEach((lead, idx) => {
        const normalized = normalizeForComparison(lead.phone);
        const inGroup = groupParticipants.has(normalized);
        console.log(`   ${idx + 1}. ${lead.phone} → ${normalized} ${inGroup ? '✅ NO GRUPO' : '❌ FORA'}`);
    });
    console.log('');

    // 6. Comparar e contar matches
    let matches = 0;
    let noMatches = 0;
    const matchedLeads = [];
    const unmatchedLeads = [];

    for (const lead of leadsWithPhone) {
        const normalized = normalizeForComparison(lead.phone);
        if (!normalized) {
            noMatches++;
            continue;
        }

        if (groupParticipants.has(normalized)) {
            matches++;
            if (matchedLeads.length < 5) {
                matchedLeads.push({ phone: lead.phone, normalized, name: lead.first_name });
            }
        } else {
            noMatches++;
            if (unmatchedLeads.length < 5) {
                unmatchedLeads.push({ phone: lead.phone, normalized, name: lead.first_name });
            }
        }
    }

    console.log('='.repeat(80));
    console.log('📊 RESULTADO DA COMPARAÇÃO:');
    console.log('='.repeat(80));
    console.log(`✅ Leads encontrados nos grupos: ${matches}`);
    console.log(`❌ Leads NÃO encontrados nos grupos: ${noMatches}`);
    console.log(`📊 Taxa de match: ${((matches / leadsWithPhone.length) * 100).toFixed(2)}%`);
    console.log('');

    console.log('✅ EXEMPLOS DE LEADS ENCONTRADOS:');
    matchedLeads.forEach((lead, idx) => {
        console.log(`   ${idx + 1}. ${lead.name} - ${lead.phone} → ${lead.normalized}`);
    });
    console.log('');

    console.log('❌ EXEMPLOS DE LEADS NÃO ENCONTRADOS:');
    unmatchedLeads.forEach((lead, idx) => {
        console.log(`   ${idx + 1}. ${lead.name} - ${lead.phone} → ${lead.normalized}`);
    });
    console.log('');

    // 7. Análise de padrões
    console.log('🔍 ANÁLISE DE PADRÕES:');

    // Verificar se há números com DDI diferente de 55
    const nonBrazilian = Array.from(groupParticipants.keys()).filter(p => !p.startsWith('55'));
    console.log(`📊 Números internacionais (não-brasileiros) nos grupos: ${nonBrazilian.length}`);
    if (nonBrazilian.length > 0) {
        console.log('   Exemplos:', nonBrazilian.slice(0, 5));
    }

    // Verificar distribuição de tamanhos
    const leadLengths = new Map();
    leadsWithPhone.forEach(lead => {
        const len = (lead.phone || '').replace(/\D/g, '').length;
        leadLengths.set(len, (leadLengths.get(len) || 0) + 1);
    });

    console.log('📊 Distribuição de tamanhos de números DOS LEADS:');
    Array.from(leadLengths.entries()).sort((a, b) => b[1] - a[1]).forEach(([len, count]) => {
        console.log(`   ${len} dígitos: ${count} leads`);
    });

    const groupLengths = new Map();
    Array.from(groupParticipants.keys()).forEach(phone => {
        const len = phone.length;
        groupLengths.set(len, (groupLengths.get(len) || 0) + 1);
    });

    console.log('📊 Distribuição de tamanhos de números DOS GRUPOS:');
    Array.from(groupLengths.entries()).sort((a, b) => b[1] - a[1]).forEach(([len, count]) => {
        console.log(`   ${len} dígitos: ${count} números`);
    });

    console.log('');
    console.log('='.repeat(80));
    console.log('✅ COMPARAÇÃO CONCLUÍDA');
    console.log('='.repeat(80));
    console.log('');

    process.exit(0);
}

compareLeadsWithGroups().catch(error => {
    console.error('❌ Erro:', error);
    process.exit(1);
});
