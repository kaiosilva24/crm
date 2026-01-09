/**
 * Comparação simples: pegar 1 participante e 1 lead e comparar
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

async function simpleCompare() {
    console.log('\n🔍 COMPARAÇÃO SIMPLES\n');

    // 1. Pegar UM lead
    const { data: leads } = await supabase
        .from('leads')
        .select('phone, first_name')
        .not('phone', 'is', null)
        .limit(1);

    if (leads && leads.length > 0) {
        const lead = leads[0];
        console.log('📱 LEAD:');
        console.log(`   Nome: ${lead.first_name}`);
        console.log(`   Telefone original: ${lead.phone}`);
        console.log(`   Telefone normalizado: ${normalizeForComparison(lead.phone)}`);
        console.log(`   Tamanho (apenas dígitos): ${lead.phone.replace(/\D/g, '').length}`);
    }

    console.log('');

    // 2. Pegar UM participante de grupo
    const { data: campaignGroups } = await supabase
        .from('campaign_groups')
        .select(`
            whatsapp_groups (
                group_id,
                group_name,
                connection_id
            )
        `)
        .limit(1);

    if (campaignGroups && campaignGroups.length > 0) {
        const group = campaignGroups[0].whatsapp_groups;

        if (group) {
            console.log(`📱 GRUPO: ${group.group_name}`);

            const sock = getActiveConnection(group.connection_id);
            if (sock) {
                const groupMetadata = await sock.groupMetadata(group.group_id);
                const participants = groupMetadata.participants || [];

                console.log(`   Total de participantes: ${participants.length}`);

                if (participants.length > 0) {
                    const participant = participants[0];
                    let phone = null;

                    if (!participant.id.includes('@lid')) {
                        phone = participant.id.split('@')[0];
                    } else if (participant.phoneNumber) {
                        phone = participant.phoneNumber;
                    }

                    console.log(`   Primeiro participante:`);
                    console.log(`      ID: ${participant.id}`);
                    console.log(`      Telefone extraído: ${phone}`);
                    console.log(`      Telefone normalizado: ${normalizeForComparison(phone)}`);
                    if (phone) {
                        console.log(`      Tamanho (apenas dígitos): ${phone.replace(/\D/g, '').length}`);
                    }
                }
            } else {
                console.log('   ⚠️ Conexão não ativa');
            }
        }
    }

    console.log('\n✅ Comparação concluída\n');
    process.exit(0);
}

simpleCompare().catch(error => {
    console.error('❌ Erro:', error);
    process.exit(1);
});
