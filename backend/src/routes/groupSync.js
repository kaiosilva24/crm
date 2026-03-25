/**
 * Endpoint para cruzar leads com grupos do WhatsApp
 * Verifica quais leads estão em grupos sem importá-los
 */

import express from 'express';
import { supabase } from '../database/supabase.js';
import { getActiveConnection } from '../services/whatsappService.js';

const router = express.Router();

/**
 * Normaliza telefone para comparação
 * Mantém o DDI completo para comparação precisa
 */
function normalizeForComparison(phone) {
    if (!phone) return null;

    // Remove tudo que não é número
    let cleaned = phone.replace(/\D/g, '');

    // Se tem 13 dígitos ou mais, já está completo
    if (cleaned.length >= 13) {
        return cleaned;
    }

    // Se tem 12 dígitos (DDI 55 + 10 dígitos sem o 9)
    if (cleaned.length === 12 && cleaned.startsWith('55')) {
        const ddd = cleaned.substring(2, 4);
        const firstDigit = cleaned.charAt(4);

        // Se o primeiro dígito é 6, 7, 8 ou 9, é celular sem o 9
        if (firstDigit === '6' || firstDigit === '7' || firstDigit === '8' || firstDigit === '9') {
            // Adicionar o 9: 556596785888 → 55659**9**6785888
            return '55' + ddd + '9' + cleaned.substring(4);
        }
        // Se começa com 2, 3, 4 ou 5, é telefone fixo - manter como está
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

        // Se o primeiro dígito do número é 9, 8 ou 7, é celular antigo
        if (firstDigit === '9' || firstDigit === '8' || firstDigit === '7') {
            // É celular antigo sem o 9 - adicionar 9 e DDI 55
            return '55' + ddd + '9' + cleaned.substring(2);
        }
        // Se começa com 2, 3, 4, 5 ou 6, é telefone FIXO - adicionar DDI 55
        return '55' + cleaned;
    }

    // Para números com menos de 10 dígitos, retornar null (inválido)
    if (cleaned.length < 10) {
        return null;
    }

    return cleaned;
}

/**
 * Sincronizar status de grupo dos leads
 * Verifica quais leads estão em grupos do WhatsApp
 */
router.post('/sync-group-status', async (req, res) => {
    let syncHistoryId = null;

    try {
        console.log('\n' + '='.repeat(70));
        console.log('🚀 SINCRONIZAÇÃO DE STATUS DE GRUPO (OTIMIZADA)');
        console.log('='.repeat(70));

        const startTime = Date.now();

        // Registrar início da sincronização
        const { data: syncRecord, error: syncError } = await supabase
            .from('group_sync_history')
            .insert({
                started_at: new Date().toISOString(),
                status: 'running'
            })
            .select()
            .single();

        if (!syncError && syncRecord) {
            syncHistoryId = syncRecord.id;
            console.log(`📝 Histórico de sincronização criado: ID ${syncHistoryId}`);
        }

        const { rows: campaignGroupsRows } = await supabase._pool.query(`
            SELECT 
                cg.campaign_id,
                wg.id as "wg_id",
                wg.group_id as "wg_group_id",
                wg.group_name as "wg_group_name",
                wg.connection_id as "wg_connection_id"
            FROM campaign_groups cg
            INNER JOIN whatsapp_groups wg ON wg.id = cg.whatsapp_group_id
        `);

        // Agrupar grupos por campanha
        const campaignMap = new Map();
        campaignGroupsRows.forEach(cg => {
            if (!campaignMap.has(cg.campaign_id)) {
                campaignMap.set(cg.campaign_id, []);
            }
            if (cg.wg_id) {
                // Monta o objeto whatsapp_groups como o Supabase original retornava
                const wgObject = {
                    id: cg.wg_id,
                    group_id: cg.wg_group_id,
                    group_name: cg.wg_group_name,
                    connection_id: cg.wg_connection_id
                };
                campaignMap.set(cg.campaign_id, [...campaignMap.get(cg.campaign_id), wgObject]);
            }
        });

        console.log(`📊 Campanhas para analisar: ${campaignMap.size}`);

        // Variáveis globais para estatísticas (Legacy Support)
        let totalProcessed = 0;
        let totalUpdatedTrue = 0;
        let totalUpdatedFalse = 0;
        let totalInGroup = 0;
        let totalNotInGroup = 0;
        let totalGroupsProcessed = 0;
        let totalUniqueNumbers = 0;

        // 3. Processar cada campanha separadamente
        for (const [campaignId, groups] of campaignMap.entries()) {
            console.log(`\n🔄 Processando campanha ID: ${campaignId} (${groups.length} grupos)`);

            totalGroupsProcessed += groups.length;

            if (groups.length === 0) continue;

            const groupParticipants = new Set();
            let activeConnectionsCount = 0;
            let inactiveConnectionsCount = 0;
            const inactiveConnections = [];
            let hasFetchError = false;

            // Buscar participantes dos grupos desta campanha
            await Promise.all(groups.map(async (group) => {
                try {
                    const sock = getActiveConnection(group.connection_id);

                    // 🔍 DIAGNÓSTICO: Verificar se conexão está ativa (sock e socket aberto)
                    if (!sock) {
                        console.warn(`⚠️ Conexão inativa ou fechada: ${group.connection_id} (Grupo: ${group.group_name})`);
                        inactiveConnectionsCount++;
                        inactiveConnections.push({
                            connection_id: group.connection_id,
                            group_name: group.group_name
                        });
                        hasFetchError = true; // Marcar como erro para abortar a campanha
                        return;
                    }

                    console.log(`✅ Conexão ativa: ${group.connection_id} - Buscando participantes do grupo ${group.group_name}`);

                    const metadata = await sock.groupMetadata(group.group_id);
                    const participants = metadata.participants || [];

                    console.log(`   📊 Grupo "${group.group_name}": ${participants.length} participantes encontrados`);

                    participants.forEach(p => {
                        let phone = null;
                        if (!p.id.includes('@lid')) phone = p.id.split('@')[0];
                        else if (p.phoneNumber) phone = p.phoneNumber;

                        if (phone) {
                            const normalized = normalizeForComparison(phone);
                            if (normalized) groupParticipants.add(normalized);
                        }
                    });
                    // Só incrementar conexões ativas se a busca for bem sucedida
                    activeConnectionsCount++;
                } catch (e) {
                    console.error(`❌ Erro ao buscar grupo ${group.group_name}: ${e.message}`);
                    hasFetchError = true; // Flag para parar a sincronização se uma falhar
                }
            }));

            totalUniqueNumbers += groupParticipants.size;

            // 🔍 DIAGNÓSTICO: Resumo de conexões
            console.log(`\n📊 Status de Conexões da Campanha ${campaignId}:`);
            console.log(`   ✅ Conexões ativas: ${activeConnectionsCount}`);
            console.log(`   ❌ Conexões inativas: ${inactiveConnectionsCount}`);
            console.log(`   👥 Total de participantes únicos encontrados: ${groupParticipants.size}`);

            if (inactiveConnections.length > 0) {
                console.warn(`\n⚠️ ATENÇÃO: ${inactiveConnections.length} conexão(ões) inativa(s) detectada(s):`);
                inactiveConnections.forEach(conn => {
                    console.warn(`   - Conexão ID: ${conn.connection_id} (Grupo: ${conn.group_name})`);
                });
                console.warn(`\n💡 SOLUÇÃO: Verifique se as conexões do WhatsApp estão conectadas em /api/whatsapp/connections`);
            }

            if ((activeConnectionsCount === 0 && groups.length > 0) || hasFetchError) {
                const errorReason = hasFetchError ? "Houve falha na busca de dados de um ou mais grupos (conexão caiu)." : "Nenhuma conexão WhatsApp ativa encontrada para a campanha.";
                const errorMsg = `Não foi possível sincronizar a campanha ${campaignId}: ${errorReason}`;
                console.error('\n' + '='.repeat(70));
                console.error(`❌ SINCRONIZAÇÃO ABORTADA PARA CAMPANHA ${campaignId}: ${errorReason}`);
                console.error('💡 Os dados anteriores serão mantidos sem alteração para evitar falsos-negativos');
                console.error('='.repeat(70));

                if (campaignMap.size === 1) { // Se for a última/única campanha a dar esse erro
                    return res.status(400).json({
                        success: false,
                        error: errorMsg,
                        activeConnections: activeConnectionsCount,
                        totalGroups: groups.length,
                        connectionError: true
                    });
                } else {
                    continue; // Pula essa campanha e vai parar a próxima se houver múltiplas
                }
            }

            // Buscar leads desta campanha com paginação para garantir que pegue todos
            let leads = [];
            let page = 0;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
                const start = page * pageSize;
                const end = start + pageSize - 1;

                const { data: chunk, error: leadsError } = await supabase
                    .from('leads')
                    .select('id, phone')
                    .eq('campaign_id', campaignId)
                    .range(start, end);

                if (leadsError) {
                    console.error(`Erro ao buscar leads da campanha ${campaignId} (página ${page}):`, leadsError);
                    break;
                }

                if (chunk && chunk.length > 0) {
                    leads = [...leads, ...chunk];
                    if (chunk.length < pageSize) {
                        hasMore = false;
                    } else {
                        page++;
                    }
                } else {
                    hasMore = false;
                }
            }

            // Buscar status atual de in_group da tabela lead_campaign_groups
            const leadIds = leads.map(l => l.id);
            let currentGroupStatus = new Map();

            if (leadIds.length > 0) {
                const { data: groupStatuses } = await supabase
                    .from('lead_campaign_groups')
                    .select('lead_id, in_group')
                    .eq('campaign_id', campaignId)
                    .in('lead_id', leadIds);

                (groupStatuses || []).forEach(gs => {
                    currentGroupStatus.set(gs.lead_id, gs.in_group);
                });
            }

            const idsInGroup = [];
            const idsNotInGroup = [];
            let campaignInGroup = 0;
            let campaignNotInGroup = 0;

            for (const lead of leads) {
                if (!lead.phone) {
                    idsNotInGroup.push(lead.id); // Sem telefone = fora
                    campaignNotInGroup++;
                    continue;
                }

                const normalized = normalizeForComparison(lead.phone);
                const isInGroup = normalized ? groupParticipants.has(normalized) : false;

                if (isInGroup) {
                    idsInGroup.push(lead.id); // Lista de quem DEVE estar
                    campaignInGroup++;
                } else {
                    idsNotInGroup.push(lead.id); // Lista de quem NAO deve estar
                    campaignNotInGroup++;
                }
            }

            // Atualizar status no banco usando lead_campaign_groups (específico por campanha)
            // Comparar com o status atual da tabela lead_campaign_groups
            const toUpdateTrue = idsInGroup.filter(id => {
                return currentGroupStatus.get(id) !== true;
            });

            const toUpdateFalse = idsNotInGroup.filter(id => {
                return currentGroupStatus.get(id) !== false;
            });

            // Atualizar na tabela lead_campaign_groups (isolado por campanha)
            if (toUpdateTrue.length > 0) {
                const records = toUpdateTrue.map(leadId => ({
                    lead_id: leadId,
                    campaign_id: campaignId,
                    in_group: true,
                    updated_at: new Date().toISOString()
                }));

                await supabase
                    .from('lead_campaign_groups')
                    .upsert(records, { onConflict: 'lead_id,campaign_id' });

                console.log(`   ✅ ${toUpdateTrue.length} leads marcados como "no grupo" na campanha ${campaignId}`);
            }

            if (toUpdateFalse.length > 0) {
                const records = toUpdateFalse.map(leadId => ({
                    lead_id: leadId,
                    campaign_id: campaignId,
                    in_group: false,
                    updated_at: new Date().toISOString()
                }));

                await supabase
                    .from('lead_campaign_groups')
                    .upsert(records, { onConflict: 'lead_id,campaign_id' });

                console.log(`   ✅ ${toUpdateFalse.length} leads marcados como "fora do grupo" na campanha ${campaignId}`);
            }

            // Acumular totais
            totalProcessed += leads.length;
            totalUpdatedTrue += toUpdateTrue.length;
            totalUpdatedFalse += toUpdateFalse.length;
            totalInGroup += campaignInGroup;
            totalNotInGroup += campaignNotInGroup;

            console.log(`   📊 Campanha ${campaignId}: ${campaignInGroup} no grupo | ${campaignNotInGroup} fora do grupo`);
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('='.repeat(70));
        console.log(`✅ SINCRONIZAÇÃO OTIMIZADA CONCLUÍDA EM ${duration}s!`);
        console.log(`📊 Campanhas processadas: ${campaignMap.size}`);
        console.log(`📊 Grupos processados: ${totalGroupsProcessed}`);
        console.log(`👥 Números únicos encontrados: ${totalUniqueNumbers}`);
        console.log(`🔄 Total de leads processados: ${totalProcessed}`);
        console.log(`✅ Leads marcados "no grupo": ${totalUpdatedTrue}`);
        console.log(`❌ Leads marcados "fora do grupo": ${totalUpdatedFalse}`);
        console.log(`🔄 Total alterado: ${totalUpdatedTrue + totalUpdatedFalse}`);
        console.log(`📈 Total no grupo: ${totalInGroup}`);
        console.log(`📉 Total fora do grupo: ${totalNotInGroup}`);
        console.log('='.repeat(70));

        res.json({
            success: true,
            duration: `${duration}s`,
            campaignsProcessed: campaignMap.size,

            // Legacy Support Fields (restore original behavior for frontend)
            total: totalProcessed,
            totalWithPhone: totalProcessed,
            inGroup: totalInGroup,
            notInGroup: totalNotInGroup,
            groupsProcessed: totalGroupsProcessed,
            uniqueNumbers: totalUniqueNumbers,

            updated: {
                toInGroup: totalUpdatedTrue,
                toNotInGroup: totalUpdatedFalse,
                total: totalUpdatedTrue + totalUpdatedFalse
            }
        });

        // Atualizar histórico com sucesso
        if (syncHistoryId) {
            await supabase
                .from('group_sync_history')
                .update({
                    completed_at: new Date().toISOString(),
                    status: 'completed',
                    campaigns_processed: campaignMap.size,
                    groups_processed: totalGroupsProcessed,
                    leads_in_group: totalInGroup,
                    leads_not_in_group: totalNotInGroup,
                    leads_updated: totalUpdatedTrue + totalUpdatedFalse,
                    duration_seconds: parseFloat(duration)
                })
                .eq('id', syncHistoryId);
        }
    } catch (error) {
        console.error('❌ Erro na sincronização rápida:', error);

        // Atualizar histórico com erro
        if (syncHistoryId) {
            await supabase
                .from('group_sync_history')
                .update({
                    completed_at: new Date().toISOString(),
                    status: 'failed',
                    error_message: error.message
                })
                .eq('id', syncHistoryId);
        }

        res.status(500).json({ error: error.message });
    }
});

/**
 * Obter última sincronização
 */
router.get('/last-sync', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('group_sync_history')
            .select('*')
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            // Se não houver histórico ainda
            if (error.code === 'PGRST116') {
                return res.json({
                    success: true,
                    lastSync: null,
                    message: 'Nenhuma sincronização encontrada'
                });
            }
            throw error;
        }

        res.json({
            success: true,
            lastSync: {
                timestamp: data.completed_at,
                duration: data.duration_seconds,
                stats: {
                    campaignsProcessed: data.campaigns_processed,
                    groupsProcessed: data.groups_processed,
                    leadsInGroup: data.leads_in_group,
                    leadsNotInGroup: data.leads_not_in_group,
                    leadsUpdated: data.leads_updated
                }
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar última sincronização:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Verificar status das conexões (diagnóstico)
 */
router.get('/connection-status', async (req, res) => {
    try {
        // Buscar todas as conexões do banco
        const { data: allConnections, error: connError } = await supabase
            .from('whatsapp_connections')
            .select('id, name, status, phone_number');

        if (connError) throw connError;

        // Buscar quais grupos estão vinculados a campanhas
        const { data: campaignGroups, error: cgError } = await supabase
            .from('campaign_groups')
            .select(`
                campaign_id,
                whatsapp_groups (
                    id,
                    group_name,
                    connection_id
                )
            `);

        if (cgError) throw cgError;

        // Mapear conexões necessárias
        const neededConnections = new Set();
        campaignGroups.forEach(cg => {
            if (cg.whatsapp_groups) {
                neededConnections.add(cg.whatsapp_groups.connection_id);
            }
        });

        // Verificar quais estão ativas na memória
        const { getActiveConnection } = await import('../services/whatsappService.js');

        const connectionStatus = allConnections.map(conn => {
            const isNeeded = neededConnections.has(conn.id);
            const isActive = !!getActiveConnection(conn.id);

            return {
                id: conn.id,
                name: conn.name,
                phone_number: conn.phone_number,
                db_status: conn.status,
                is_needed_for_sync: isNeeded,
                is_active_in_memory: isActive,
                ready_for_sync: isNeeded && isActive
            };
        });

        const summary = {
            total_connections: allConnections.length,
            needed_for_sync: Array.from(neededConnections).length,
            active_in_memory: connectionStatus.filter(c => c.is_active_in_memory).length,
            ready_for_sync: connectionStatus.filter(c => c.ready_for_sync).length,
            missing_connections: connectionStatus.filter(c => c.is_needed_for_sync && !c.is_active_in_memory)
        };

        res.json({
            success: true,
            summary,
            connections: connectionStatus
        });

    } catch (error) {
        console.error('❌ Erro ao verificar status de conexões:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Obter estatísticas de grupos
 */
router.get('/group-stats', async (req, res) => {
    try {
        // Contar leads em grupos vs fora
        const { data: stats, error } = await supabase
            .from('leads')
            .select('in_group');

        if (error) throw error;

        const inGroup = stats.filter(l => l.in_group).length;
        const notInGroup = stats.filter(l => !l.in_group).length;

        res.json({
            total: stats.length,
            inGroup,
            notInGroup,
            percentage: stats.length > 0 ? Math.round((inGroup / stats.length) * 100) : 0
        });

    } catch (error) {
        console.error('❌ Erro ao obter estatísticas:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
