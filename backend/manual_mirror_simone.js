import 'dotenv/config';
import { supabase } from './src/database/supabase.js';
import { processSalesMirroring } from './src/services/mirrorService.js';

async function manuallyTriggerMirror() {
    console.log('🔧 EXECUTANDO MIRROR MANUALMENTE PARA SIMONE\n');

    try {
        const email = 'simalmeida2108@gmail.com';
        const phone = '5511982024390';
        const leadUuid = '72c7161a-7faf-46ef-99b0-ebeb358fbd35';
        const sourceCampaignId = 7; // ALUNOS AVANÇADO

        console.log(`📧 Email: ${email}`);
        console.log(`📞 Telefone: ${phone}`);
        console.log(`🆔 UUID: ${leadUuid}`);
        console.log(`📁 Campanha Origem: ${sourceCampaignId} (ALUNOS AVANÇADO)\n`);

        console.log('🚀 Chamando processSalesMirroring...\n');

        await processSalesMirroring(sourceCampaignId, { email, phone }, leadUuid);

        console.log('\n✅ Processo concluído!');
        console.log('\n🔍 Verificando resultado...\n');

        const { data: leadLP06 } = await supabase
            .from('leads')
            .select('sale_completed, observations')
            .eq('campaign_id', 10)
            .ilike('email', email)
            .single();

        if (leadLP06) {
            console.log(`Vendido: ${leadLP06.sale_completed ? '✅ SIM' : '❌ NÃO'}`);
            if (leadLP06.observations) {
                console.log(`\nObservações:\n${leadLP06.observations}`);
            }
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    }

    process.exit(0);
}

manuallyTriggerMirror();
