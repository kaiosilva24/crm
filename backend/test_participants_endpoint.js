/**
 * Script para testar o endpoint de participantes e ver o erro exato
 */

import { supabase } from './src/database/supabase.js';
import { getActiveConnection } from './src/services/whatsappService.js';

const campaignId = 4; // ID da campanha de teste

console.log('\n🧪 TESTANDO ENDPOINT DE PARTICIPANTES\n');
console.log('='.repeat(70));

async function testParticipantsEndpoint() {
    try {
        console.log(`📋 Campanha ID: ${campaignId}\n`);

        // 1. Buscar grupos associados à campanha
        const { data: campaignGroups, error: cgError } = await supabase
            .from('campaign_groups')
            .select('group_id')
            .eq('campaign_id', parseInt(campaignId));

        if (cgError) {
            console.error('❌ Erro ao buscar campaign_groups:', cgError);
            process.exit(1);
        }

        console.log(`✅ Campaign groups encontrados: ${campaignGroups?.length || 0}`);

        if (!campaignGroups || campaignGroups.length === 0) {
            console.log('⚠️ Nenhum grupo associado a esta campanha');
            process.exit(0);
        }

        const groupIds = campaignGroups.map(cg => cg.group_id);
        console.log(`📊 Group IDs: ${groupIds.join(', ')}\n`);

        // 2. Buscar informações dos grupos
        const { data: groups, error: groupsError } = await supabase
            .from('whatsapp_groups')
            .select('id, group_id, group_name, connection_id')
            .in('id', groupIds);

        if (groupsError) {
            console.error('❌ Erro ao buscar grupos:', groupsError);
            process.exit(1);
        }

        console.log(`✅ Grupos encontrados: ${groups?.length || 0}\n`);

        if (!groups || groups.length === 0) {
            console.log('⚠️ Nenhum grupo encontrado');
            process.exit(0);
        }

        // 3. Tentar buscar participantes de cada grupo
        for (const group of groups) {
            console.log(`\n📱 Grupo: ${group.group_name}`);
            console.log(`   Group ID: ${group.group_id}`);
            console.log(`   Connection ID: ${group.connection_id}`);

            try {
                const sock = getActiveConnection(group.connection_id);

                if (!sock) {
                    console.log(`   ⚠️ Conexão não ativa`);
                    continue;
                }

                console.log(`   ✅ Conexão ativa encontrada`);

                const groupMetadata = await sock.groupMetadata(group.group_id);
                const participants = groupMetadata.participants || [];

                console.log(`   ✅ Participantes: ${participants.length}`);

                // Testar normalização de alguns participantes
                for (let i = 0; i < Math.min(3, participants.length); i++) {
                    const p = participants[i];
                    console.log(`\n   Participante ${i + 1}:`);
                    console.log(`     ID: ${p.id}`);
                    console.log(`     Notify: ${p.notify || 'N/A'}`);
                    console.log(`     VerifiedName: ${p.verifiedName || 'N/A'}`);
                }

            } catch (error) {
                console.error(`   ❌ ERRO:`, error.message);
                console.error(`   Stack:`, error.stack);
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('✅ Teste concluído');

    } catch (error) {
        console.error('\n❌ ERRO GERAL:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

testParticipantsEndpoint();
