import { supabase } from './src/database/supabase.js';

console.log('🔍 Verificando leads no banco de dados...\n');

async function checkLeads() {
    try {
        // Total de leads
        const { data: allLeads, error: allError } = await supabase
            .from('leads')
            .select('id, phone, source, campaign_id, in_group, created_at')
            .order('created_at', { ascending: false });

        if (allError) throw allError;

        console.log(`📊 Total de leads no banco: ${allLeads.length}\n`);

        // Agrupar por source
        const bySource = {};
        allLeads.forEach(lead => {
            const source = lead.source || 'unknown';
            bySource[source] = (bySource[source] || 0) + 1;
        });

        console.log('📋 Leads por origem:');
        Object.entries(bySource).forEach(([source, count]) => {
            console.log(`   ${source}: ${count}`);
        });

        // Leads do Whapi
        const whapiLeads = allLeads.filter(l => l.source === 'whapi_import');
        console.log(`\n✅ Leads importados do Whapi: ${whapiLeads.length}`);

        // Leads por campanha
        const byCampaign = {};
        allLeads.forEach(lead => {
            const campaignId = lead.campaign_id || 'sem campanha';
            byCampaign[campaignId] = (byCampaign[campaignId] || 0) + 1;
        });

        console.log('\n📋 Leads por campanha:');
        for (const [campaignId, count] of Object.entries(byCampaign)) {
            if (campaignId !== 'sem campanha') {
                // Buscar nome da campanha
                const { data: campaign } = await supabase
                    .from('campaigns')
                    .select('name')
                    .eq('id', campaignId)
                    .single();

                console.log(`   ${campaign?.name || campaignId}: ${count}`);
            } else {
                console.log(`   Sem campanha: ${count}`);
            }
        }

        // Verificar telefones duplicados
        const phoneMap = {};
        allLeads.forEach(lead => {
            const phone = lead.phone;
            phoneMap[phone] = (phoneMap[phone] || 0) + 1;
        });

        const duplicates = Object.entries(phoneMap).filter(([phone, count]) => count > 1);

        if (duplicates.length > 0) {
            console.log(`\n⚠️  Telefones duplicados encontrados: ${duplicates.length}`);
            console.log('Exemplos:');
            duplicates.slice(0, 5).forEach(([phone, count]) => {
                console.log(`   ${phone}: ${count}x`);
            });
        } else {
            console.log(`\n✅ Nenhum telefone duplicado!`);
        }

        // Leads criados recentemente (últimas 24h)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const recentLeads = allLeads.filter(l => l.created_at > oneDayAgo);
        console.log(`\n🆕 Leads criados nas últimas 24h: ${recentLeads.length}`);

        // Últimos 10 leads
        console.log('\n📝 Últimos 10 leads importados:');
        allLeads.slice(0, 10).forEach((lead, i) => {
            console.log(`   ${i + 1}. ${lead.phone} - ${lead.source} - ${new Date(lead.created_at).toLocaleString('pt-BR')}`);
        });

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

checkLeads();
