/**
 * Script de diagnóstico que salva resultado em JSON
 */

import { supabase } from './src/database/supabase.js';
import { getActiveConnection } from './src/services/whatsappService.js';
import fs from 'fs';

function normalizeForComparison(phone) {
    if (!phone) return null;
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length > 11) return cleaned;
    if (cleaned.length === 11) return '55' + cleaned;
    if (cleaned.length === 10) {
        const ddd = cleaned.substring(0, 2);
        const firstDigit = cleaned.charAt(2);
        if (firstDigit === '9' || firstDigit === '8' || firstDigit === '7') {
            return '55' + ddd + '9' + cleaned.substring(2);
        }
        return '55' + cleaned;
    }
    if (cleaned.length < 10) return null;
    return cleaned;
}

async function diagnose() {
    const result = {
        leads: {},
        groups: {},
        comparison: {},
        examples: {}
    };

    // 1. LEADS
    const { data: leads } = await supabase
        .from('leads')
        .select('id, phone, first_name')
        .not('phone', 'is', null);

    const leadsWithPhone = leads.filter(l => l.phone && l.phone.trim() !== '');
    result.leads.total = leads.length;
    result.leads.withPhone = leadsWithPhone.length;
    result.leads.examples = leadsWithPhone.slice(0, 10).map(l => ({
        name: l.first_name,
        original: l.phone,
        normalized: normalizeForComparison(l.phone),
        originalLength: l.phone.replace(/\D/g, '').length
    }));

    // 2. GRUPOS
    const { data: campaignGroups } = await supabase
        .from('campaign_groups')
        .select('whatsapp_groups(id, group_id, group_name, connection_id)');

    const groups = campaignGroups.map(cg => cg.whatsapp_groups).filter(g => g !== null);
    result.groups.total = groups.length;

    // 3. PARTICIPANTES
    const groupParticipants = new Map();
    const participantExamples = [];

    for (const group of groups) {
        const sock = getActiveConnection(group.connection_id);
        if (!sock) continue;

        const groupMetadata = await sock.groupMetadata(group.group_id);
        const participants = groupMetadata.participants || [];

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
                    groupParticipants.set(normalized, true);
                    if (participantExamples.length < 10) {
                        participantExamples.push({
                            original: phone,
                            normalized: normalized,
                            originalLength: phone.replace(/\D/g, '').length
                        });
                    }
                }
            }
        }
    }

    result.groups.uniqueNumbers = groupParticipants.size;
    result.examples.participants = participantExamples;

    // 4. COMPARAR
    let matches = 0;
    const matchExamples = [];
    const noMatchExamples = [];

    for (const lead of leadsWithPhone) {
        const normalized = normalizeForComparison(lead.phone);
        if (normalized && groupParticipants.has(normalized)) {
            matches++;
            if (matchExamples.length < 5) {
                matchExamples.push({
                    name: lead.first_name,
                    phone: lead.phone,
                    normalized: normalized
                });
            }
        } else if (noMatchExamples.length < 5) {
            noMatchExamples.push({
                name: lead.first_name,
                phone: lead.phone,
                normalized: normalized
            });
        }
    }

    result.comparison.matches = matches;
    result.comparison.noMatches = leadsWithPhone.length - matches;
    result.comparison.matchRate = ((matches / leadsWithPhone.length) * 100).toFixed(2) + '%';
    result.examples.matches = matchExamples;
    result.examples.noMatches = noMatchExamples;

    // Salvar em JSON
    fs.writeFileSync('diagnosis_result.json', JSON.stringify(result, null, 2));
    console.log('Resultado salvo em diagnosis_result.json');
    console.log(`Matches: ${matches} de ${leadsWithPhone.length} (${result.comparison.matchRate})`);

    process.exit(0);
}

diagnose().catch(err => {
    console.error('Erro:', err);
    process.exit(1);
});
