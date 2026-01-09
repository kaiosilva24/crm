/**
 * Endpoint para cruzar leads com grupos do WhatsApp
 * Verifica quais leads estão em grupos sem importá-los
 */

import express from 'express';
import { supabase } from '../database/supabase.js';
import { getActiveConnection } from '../services/whatsappService.js';

const router = express.Router();

// Cache de participantes de grupos (TTL de 5 minutos)
const groupParticipantsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos em milissegundos

// Timestamp da última sincronização por campanha
const lastSyncTimestamps = new Map();

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
    try {
        console.log('\n' + '='.repeat(70));
        console.log('🚀 SINCRONIZAÇÃO DE STATUS DE GRUPO (OTIMIZADA)');
        console.log('='.repeat(70));

        const startTime = Date.now();

        // 2. Buscar todas as campanhas ATIVAS que têm grupos sincronizados
        const { data: campaignGroups, error: cgError } = await supabase
            .from('campaign_groups')
            .select(`
                campaign_id,
                whatsapp_groups (
                    id,
                    group_id,
                    group_name,
                    connection_id
                )
            `);

        if (cgError) throw cgError;

        // Agrupar grupos por campanha
        const campaignMap = new Map();
        campaignGroups.forEach(cg => {
            if (!campaignMap.has(cg.campaign_id)) {
                campaignMap.set(cg.campaign_id, []);
            }
            if (cg.whatsapp_groups) {
                campaignMap.set(cg.campaign_id, [...campaignMap.get(cg.campaign_id), cg.whatsapp_groups]);
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

            // Buscar participantes dos grupos desta campanha (com cache)
            await Promise.all(groups.map(async (group) => {
                try {
                    const cacheKey = `${group.connection_id}_${group.group_id}`;
                    const cached = groupParticipantsCache.get(cacheKey);

                    // Usar cache se disponível e não expirado
                    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
                        console.log(`   📦 Usando cache para grupo ${group.group_name}`);
                        cached.participants.forEach(p => groupParticipants.add(p));
                        return;
                    }

                    // Buscar do WhatsApp se não tem cache
                    const sock = getActiveConnection(group.connection_id);
                    if (!sock) return;

                    const metadata = await sock.groupMetadata(group.group_id);
                    const participants = metadata.participants || [];
                    const normalizedParticipants = new Set();

                    participants.forEach(p => {
                        let phone = null;
                        if (!p.id.includes('@lid')) phone = p.id.split('@')[0];
                        else if (p.phoneNumber) phone = p.phoneNumber;

                        if (phone) {
                            const normalized = normalizeForComparison(phone);
                            if (normalized) {
                                groupParticipants.add(normalized);
                                normalizedParticipants.add(normalized);
                            }
                        }
                    });

                    // Salvar no cache
                    groupParticipantsCache.set(cacheKey, {
                        participants: normalizedParticipants,
                        timestamp: Date.now()
                    });

                    console.log(`   ✅ Cache atualizado para grupo ${group.group_name} (${normalizedParticipants.size} participantes)`);
                } catch (e) {
                    console.error(`❌ Erro grupo ${group.group_name}: ${e.message}`);
                }
            }));

            totalUniqueNumbers += groupParticipants.size;

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

            // Atualizar timestamp da última sincronização desta campanha
            lastSyncTimestamps.set(campaignId, Date.now());
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('='.repeat(70));
        console.log(`✅ SINCRONIZAÇÃO OTIMIZADA CONCLUÍDA EM ${duration}s!`);
        console.log(`🔄 Total processado: ${totalProcessed}`);
        console.log(`🔄 Total alterado: ${totalUpdatedTrue + totalUpdatedFalse}`);
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
    } catch (error) {
        console.error('❌ Erro na sincronização rápida:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Verificar quando foi a última sincronização
 * GET /api/group-sync/last-sync
 */
router.get('/last-sync', async (req, res) => {
    try {
        const syncInfo = {};

        for (const [campaignId, timestamp] of lastSyncTimestamps.entries()) {
            const ageMinutes = Math.floor((Date.now() - timestamp) / 60000);
            syncInfo[campaignId] = {
                timestamp,
                ageMinutes,
                needsSync: ageMinutes >= 5 // Precisa sincronizar se passou mais de 5 minutos
            };
        }

        res.json({
            lastSync: syncInfo,
            cacheSize: groupParticipantsCache.size,
            cacheTTL: CACHE_TTL / 60000 // em minutos
        });
    } catch (error) {
        console.error('❌ Erro ao verificar última sincronização:', error);
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
