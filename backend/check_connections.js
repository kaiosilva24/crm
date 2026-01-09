/**
 * Verificar status das conexões WhatsApp
 */

import { supabase } from './src/database/supabase.js';
import { getActiveConnection } from './src/services/whatsappService.js';

async function checkConnections() {
    console.log('\nVerificando conexões WhatsApp...\n');

    // Buscar grupos associados a campanhas
    const { data: campaignGroups } = await supabase
        .from('campaign_groups')
        .select(`
            whatsapp_groups (
                id,
                group_id,
                group_name,
                connection_id
            )
        `);

    const groups = campaignGroups.map(cg => cg.whatsapp_groups).filter(g => g !== null);

    console.log(`Total de grupos associados a campanhas: ${groups.length}\n`);

    for (const group of groups) {
        console.log(`Grupo: "${group.group_name}"`);
        console.log(`  Connection ID: ${group.connection_id}`);

        const sock = getActiveConnection(group.connection_id);

        if (!sock) {
            console.log(`  Status: ❌ CONEXÃO NÃO ATIVA\n`);
            continue;
        }

        console.log(`  Status: ✅ Conexão ativa`);

        try {
            const groupMetadata = await sock.groupMetadata(group.group_id);
            const participants = groupMetadata.participants || [];
            console.log(`  Participantes: ${participants.length}`);

            if (participants.length > 0) {
                const firstParticipant = participants[0];
                console.log(`  Primeiro participante ID: ${firstParticipant.id}`);
            }
        } catch (error) {
            console.log(`  Erro ao buscar participantes: ${error.message}`);
        }

        console.log('');
    }

    process.exit(0);
}

checkConnections().catch(err => {
    console.error('Erro:', err);
    process.exit(1);
});
