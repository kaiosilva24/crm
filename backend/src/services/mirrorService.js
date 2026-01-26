import { db, supabase } from '../database/supabase.js';

/**
 * Processa o espelhamento de vendas para uma campanha.
 * Quando um lead entra na Campanha B (sourceCampaignId) com venda realizada,
 * verifica se ele existe na Campanha A (que espelha B) e marca como venda.
 * 
 * @param {string|number} sourceCampaignId - ID da campanha onde a venda ocorreu (Original)
 * @param {Object} leadData - Dados do lead (email, phone)
 * @param {string} originalLeadUuid - UUID do lead na campanha original (para referência)
 */
export async function processSalesMirroring(sourceCampaignId, leadData, originalLeadUuid) {
    try {
        if (!sourceCampaignId) return;

        // 1. Buscar campanhas que espelham a campanha de origem
        // "Eu (mirror) quero copiar vendas DE (source)"
        const { data: mirroringCampaigns, error: campError } = await supabase
            .from('campaigns')
            .select('id, name')
            .eq('mirror_sales_source_id', sourceCampaignId)
            .eq('is_active', true);

        if (campError) {
            console.error('❌ Erro ao buscar campanhas espelho:', campError);
            return;
        }

        if (!mirroringCampaigns || mirroringCampaigns.length === 0) {
            // Nenhuma campanha espelhando esta
            return;
        }

        console.log(`🪞 Encontradas ${mirroringCampaigns.length} campanhas espelhando a campanha ${sourceCampaignId}`);

        const { email, phone } = leadData;

        // 2. Para cada campanha que espelha, procurar o lead e marcar venda
        for (const targetCampaign of mirroringCampaigns) {
            console.log(`   ➡️ Processando espelhamento para campanha: ${targetCampaign.name} (${targetCampaign.id})`);

            let targetLead = null;

            // Tentar encontrar por email
            if (email) {
                const { data } = await supabase
                    .from('leads')
                    .select('*')
                    .eq('campaign_id', targetCampaign.id)
                    .ilike('email', email)
                    .limit(1)
                    .maybeSingle();
                targetLead = data;
            }

            // Se não achou, tentar por telefone (se tiver)
            if (!targetLead && phone) {
                // Normalizar ou pegar final
                const phoneEnd = phone.replace(/\D/g, '').slice(-8);
                if (phoneEnd.length >= 8) {
                    const { data } = await supabase
                        .from('leads')
                        .select('*')
                        .eq('campaign_id', targetCampaign.id)
                        .ilike('phone', `%${phoneEnd}`)
                        .limit(1)
                        .maybeSingle();
                    targetLead = data;
                }
            }

            // Se encontrou o lead na campanha alvo
            if (targetLead) {
                console.log(`      🎯 Lead encontrado: ${targetLead.first_name} (${targetLead.uuid})`);

                // Se já não estiver marcado como venda
                if (!targetLead.sale_completed) {
                    const obs = `[AUTO] Venda espelhada da campanha ${sourceCampaignId} (Lead origem: ${originalLeadUuid}) em ${new Date().toLocaleString('pt-BR')}`;
                    const newObs = targetLead.observations ? `${targetLead.observations}\n${obs}` : obs;

                    await db.updateLeadById(targetLead.id, {
                        sale_completed: true,
                        observations: newObs,
                        updated_at: new Date().toISOString()
                    });

                    console.log(`      ✅ Lead marcado como VENDIDO na campanha ${targetCampaign.name}`);
                } else {
                    console.log(`      ℹ️ Lead já estava marcado como vendido.`);
                }
            } else {
                console.log(`      ⚠️ Lead não encontrado nesta campanha.`);
            }
        }

    } catch (error) {
        console.error('❌ Erro no processSalesMirroring:', error);
    }
}
