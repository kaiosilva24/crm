import { supabase } from './src/database/supabase.js';
import { getActiveConnection } from './src/services/whatsappService.js';

(async () => {
    try {
        console.log('Fetching campaigns...');
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
            
        console.log('Result length:', campaignGroupsRows.length);

        // Agrupar grupos por campanha
        const campaignMap = new Map();
        campaignGroupsRows.forEach(cg => {
            if (!campaignMap.has(cg.campaign_id)) {
                campaignMap.set(cg.campaign_id, []);
            }
            if (cg.wg_id) {
                const wgObject = {
                    id: cg.wg_id,
                    group_id: cg.wg_group_id,
                    group_name: cg.wg_group_name,
                    connection_id: cg.wg_connection_id
                };
                campaignMap.set(cg.campaign_id, [...campaignMap.get(cg.campaign_id), wgObject]);
            }
        });
        
        console.log('Map Size:', campaignMap.size);

        for (const [campaignId, groups] of campaignMap.entries()) {
            console.log(`\n🔄 Processando campanha ID: ${campaignId} (${groups.length} grupos)`);
            if (groups.length === 0) continue;

            const groupParticipants = new Set();
            let activeConnectionsCount = 0;
            let inactiveConnectionsCount = 0;
            const inactiveConnections = [];
            let hasFetchError = false;

            for (const group of groups) {
                // To avoid baileys crash in test script, mock the participants
                const sock = getActiveConnection(group.connection_id);
                console.log(`Connection for ${group.connection_id}:`, !!sock);
                if (!sock) {
                    inactiveConnectionsCount++;
                    hasFetchError = true;
                } else {
                    activeConnectionsCount++;
                }
            }

            console.log(`Active Connections: ${activeConnectionsCount}, Inactive: ${inactiveConnectionsCount}, HasFetchError: ${hasFetchError}`);
            
            if ((activeConnectionsCount === 0 && groups.length > 0) || hasFetchError) {
                console.log(`=> SKIPPING CAMPAIGN ${campaignId} BECAUSE OF INACTIVE/ERROR CONNECTIONS!`);
                continue;
            }

            console.log(`=> SUCCESSFUL CONNECTIONS for campaign ${campaignId}. Searching leads...`);
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

                if (readsError) break;
                if (chunk && chunk.length > 0) {
                    leads = [...leads, ...chunk];
                    if (chunk.length < pageSize) hasMore = false;
                    else page++;
                } else {
                    hasMore = false;
                }
            }
            console.log(`Found ${leads.length} leads for campaign ${campaignId}`);
        }

    } catch(err) {
        console.error('Err:', err);
    }
    process.exit(0);
})();
