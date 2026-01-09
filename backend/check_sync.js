/**
 * Script simples para mostrar dados de debug da sincronização
 */

import { supabase } from './src/database/supabase.js';
import { getActiveConnection } from './src/services/whatsappService.js';

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

async function checkSync() {
    // Buscar leads
    const { data: leads } = await supabase.from('leads').select('phone').not('phone', 'is', null);
    const leadsWithPhone = leads.filter(l => l.phone && l.phone.trim() !== '');

    console.log(`Total de leads: ${leads.length}`);
    console.log(`Leads com telefone: ${leadsWithPhone.length}`);
    console.log('\nExemplos de leads (primeiros 5):');
    leadsWithPhone.slice(0, 5).forEach((l, i) => {
        console.log(`${i + 1}. Original: ${l.phone} | Normalizado: ${normalizeForComparison(l.phone)}`);
    });

    // Buscar grupos
    const { data: campaignGroups } = await supabase
        .from('campaign_groups')
        .select('whatsapp_groups(group_id, group_name, connection_id)');

    const groups = campaignGroups.map(cg => cg.whatsapp_groups).filter(g => g !== null);
    console.log(`\nGrupos associados: ${groups.length}`);

    // Buscar participantes
    const groupParticipants = new Map();
    for (const group of groups) {
        const sock = getActiveConnection(group.connection_id);
        if (!sock) continue;

        const groupMetadata = await sock.groupMetadata(group.group_id);
        const participants = groupMetadata.participants || [];

        console.log(`\nGrupo "${group.group_name}": ${participants.length} participantes`);

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
                }
            }
        }
    }

    console.log(`\nNúmeros únicos nos grupos: ${groupParticipants.size}`);
    console.log('\nExemplos de números dos grupos (primeiros 5):');
    Array.from(groupParticipants.keys()).slice(0, 5).forEach((phone, i) => {
        console.log(`${i + 1}. ${phone}`);
    });

    // Comparar
    let matches = 0;
    for (const lead of leadsWithPhone) {
        const normalized = normalizeForComparison(lead.phone);
        if (normalized && groupParticipants.has(normalized)) {
            matches++;
        }
    }

    console.log(`\n=== RESULTADO ===`);
    console.log(`Matches encontrados: ${matches} de ${leadsWithPhone.length}`);
    console.log(`Taxa: ${((matches / leadsWithPhone.length) * 100).toFixed(2)}%`);

    process.exit(0);
}

checkSync().catch(err => {
    console.error('Erro:', err);
    process.exit(1);
});
