import { supabase } from './src/database/supabase.js';

(async () => {
    try {
        console.log('Fetching campaigns...');
        const isOriginalSupabase = Object.getPrototypeOf(supabase).constructor.prototype.isPrototypeOf(supabase);
        console.log('Is Original Supabase Client?', isOriginalSupabase);

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
        console.log('Sample:', campaignGroupsRows[0]);

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
        console.log('Map Size:', campaignMap.size);
        for (const [id, groups] of campaignMap.entries()) {
            console.log('Campaign', id, 'Groups:', groups.length);
        }

    } catch(err) {
        console.error('Err:', err);
    }
    process.exit(0);
})();
