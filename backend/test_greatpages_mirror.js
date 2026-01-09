// Teste de espelhamento GreatPages
import { db, supabase } from './src/database/supabase.js';

const testPhone = '5511999999999';  // COLOQUE O TELEFONE DO SEU TESTE
const testEmail = 'teste@test.com';  // COLOQUE O EMAIL DO SEU TESTE
const campaignDestId = 5;  // Campanha "LP 05 JAN SUPER INTERESSADOS"

console.log('🧪 Testando espelhamento...\n');

try {
    // 1. Buscar campanha destino
    console.log(`📋 Buscando campanha ID ${campaignDestId}...`);

    const { data: campaign, error: campError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignDestId)
        .single();

    if (campError) throw campError;

    console.log('✅ Campanha destino:', campaign.name);

    if (!campaign.mirror_campaign_id) {
        console.log('❌ Campanha não tem espelhamento configurado!');
        process.exit(1);
    }

    console.log(`🪞 Espelha campanha ID: ${campaign.mirror_campaign_id}\n`);

    // 2. Buscar lead na origem
    const phoneEnd = testPhone.slice(-8);
    console.log(`🔍 Buscando lead na campanha ${campaign.mirror_campaign_id} com telefone terminando em: ${phoneEnd}`);

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, first_name, phone, email, seller_id, campaign_id')
        .eq('campaign_id', campaign.mirror_campaign_id)
        .ilike('phone', `%${phoneEnd}`)
        .limit(5);

    if (error) throw error;

    console.log(`\n📊 Encontrados ${leads?.length || 0} leads na campanha de origem`);

    if (leads && leads.length > 0) {
        leads.forEach((lead, i) => {
            console.log(`\n${i + 1}. ${lead.first_name}`);
            console.log(`   Telefone: ${lead.phone}`);
            console.log(`   Email: ${lead.email}`);
            console.log(`   Vendedora ID: ${lead.seller_id}`);
        });
        console.log(`\n✅ Espelhamento deve copiar vendedora ID: ${leads[0].seller_id}`);
    } else {
        console.log('\n❌ Nenhum lead encontrado na campanha de origem!');
        console.log('   O espelhamento NÃO vai funcionar porque não há lead para copiar.');
        console.log(`\n💡 Certifique-se que existe um lead na campanha "${campaign.mirror_campaign_id}" com esse telefone.`);
    }

    process.exit(0);
} catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
}
