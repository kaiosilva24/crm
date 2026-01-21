/**
 * SOLUÇÃO SIMPLES: Endpoint que retorna participantes da última sincronização
 * Não depende de conexão ativa do Baileys
 */

// Adicionar ao whatsappGroups.js após o endpoint atual

router.get('/campaigns/:campaignId/participants-cached', async (req, res) => {
    try {
        const { campaignId } = req.params;

        console.log(`🔍 Buscando participantes CACHEADOS da campanha ${campaignId}`);

        // Buscar todos os leads que foram importados dos grupos desta campanha
        // e que têm in_group = true
        const { data: participants, error } = await supabase
            .from('leads')
            .select('id, first_name, phone, email, in_group, created_at, source')
            .eq('campaign_id', parseInt(campaignId))
            .eq('in_group', true)  // Apenas quem está nos grupos
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Erro:', error);
            return res.json([]);
        }

        console.log(`✅ Encontrados ${participants.length} participantes nos grupos`);

        res.json(participants || []);
    } catch (error) {
        console.error('❌ Erro geral:', error);
        res.json([]);
    }
});
