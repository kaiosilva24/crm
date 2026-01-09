/**
 * Verificar total de participantes em cache
 */

import { supabase } from './src/database/supabase.js';

async function check() {
    // Total de participantes
    const { data: allParticipants, count } = await supabase
        .from('group_participants')
        .select('*', { count: 'exact' });

    console.log(`\n📊 Total de participantes em cache: ${allParticipants?.length || 0}`);

    // Agrupar por grupo
    const byGroup = {};
    allParticipants?.forEach(p => {
        if (!byGroup[p.group_id]) {
            byGroup[p.group_id] = 0;
        }
        byGroup[p.group_id]++;
    });

    console.log(`\n📱 Grupos com participantes: ${Object.keys(byGroup).length}`);
    
    // Buscar grupos da campanha
    const { data: campaignGroups } = await supabase
        .from('campaign_groups')
        .select('whatsapp_group_id');

    console.log(`\n🎯 Grupos em campanhas: ${campaignGroups?.length || 0}`);

    const groupIds = campaignGroups?.map(cg => cg.whatsapp_group_id) || [];
    
    // Participantes dos grupos de campanhas
    const { data: campaignParticipants } = await supabase
        .from('group_participants')
        .select('*')
        .in('group_id', groupIds);

    console.log(`\n✅ Participantes de grupos em campanhas: ${campaignParticipants?.length || 0}`);

    process.exit(0);
}

check();
