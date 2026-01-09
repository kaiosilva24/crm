import express from 'express';
import { wappiService } from '../services/wappiService.js';
import { supabase } from '../database/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get configured credentials status
router.get('/status', async (req, res) => {
    try {
        const creds = await wappiService.getCredentials();
        res.json({ configured: true, profileId: creds.profileId });
    } catch (error) {
        res.json({ configured: false, error: error.message });
    }
});

// List Groups
router.get('/groups', async (req, res) => {
    try {
        // Como o endpoint de lista é incerto, vamos tratar erros
        const groups = await wappiService.getGroups();
        console.log(`[WAPPI ROUTE] Returning ${groups.length} groups to frontend`);
        res.json(groups);
    } catch (error) {
        console.error('Erro getGroups:', error.message);
        res.status(500).json({ error: 'Erro ao listar grupos da Wappi. Verifique se o perfil está conectado ou se as credenciais estão corretas.' });
    }
});

// Import Participants from specific Group
router.post('/import', async (req, res) => {
    const { groupId, campaignId } = req.body;

    if (!groupId || !campaignId) {
        return res.status(400).json({ error: 'GroupId and CampaignId required' });
    }

    try {
        const groupData = await wappiService.getGroupParticipants(groupId);
        const participants = groupData.participants || [];

        console.log(`\n📊 [WHAPI IMPORT] Iniciando importação do grupo ${groupId}`);
        console.log(`👥 Total de participantes recebidos: ${participants.length}`);

        let imported = 0;
        let updated = 0;
        let skipped = 0;
        let skippedReasons = {
            invalidFormat: 0,
            isLID: 0,
            tooShort: 0,
            tooLong: 0,
            duplicate: 0,
            other: 0
        };
        const skippedExamples = [];

        // Buscar status padrão
        const { data: defaultStatus } = await supabase
            .from('lead_statuses')
            .select('id')
            .order('display_order', { ascending: true })
            .limit(1)
            .single();
        const defaultStatusId = defaultStatus?.id || null;

        for (const p of participants) {
            // Whapi.Cloud pode retornar:
            // - Objeto: { id: '5511999999999@c.us' } ou { id: '5511999999999' }
            // - String com sufixo: '5511999999999@c.us'
            // - String sem sufixo: '5511999999999'
            const rawId = (typeof p === 'string') ? p : (p.id || p);

            // Extrair apenas o número (remover @c.us, @g.us, @lid se existir)
            const phone = rawId.toString().split('@')[0];

            // Debug: mostrar exemplos dos primeiros 5
            if (skippedExamples.length < 5) {
                console.log(`   Processando: ${rawId} → ${phone}`);
            }

            // Detectar LIDs (privacy IDs) - formato: número:código@lid
            // Importante: só filtrar se tiver @lid OU se tiver : E não for um grupo
            if (rawId.includes('@lid') || (rawId.includes(':') && !rawId.includes('@g.us'))) {
                skipped++;
                skippedReasons.isLID++;
                if (skippedExamples.length < 3) {
                    skippedExamples.push({ raw: rawId, reason: 'LID (Privacy ID)' });
                }
                continue;
            }

            // Limpar e validar telefone
            const cleanPhone = phone.replace(/\D/g, ''); // Remove tudo que não é dígito

            // Validações específicas
            if (cleanPhone.length < 10) {
                skipped++;
                skippedReasons.tooShort++;
                if (skippedExamples.length < 3) {
                    skippedExamples.push({ raw: rawId, phone: cleanPhone, reason: `Muito curto (${cleanPhone.length} dígitos)` });
                }
                continue;
            }

            if (cleanPhone.length > 15) {
                skipped++;
                skippedReasons.tooLong++;
                if (skippedExamples.length < 3) {
                    skippedExamples.push({ raw: rawId, phone: cleanPhone, reason: `Muito longo (${cleanPhone.length} dígitos)` });
                }
                continue;
            }

            // Verificar se é apenas dígitos
            if (!/^\d+$/.test(cleanPhone)) {
                skipped++;
                skippedReasons.invalidFormat++;
                if (skippedExamples.length < 3) {
                    skippedExamples.push({ raw: rawId, phone: cleanPhone, reason: 'Formato inválido' });
                }
                continue;
            }

            // Upsert Logic
            const { data: existing } = await supabase
                .from('leads')
                .select('id')
                .eq('phone', cleanPhone)
                .single();

            if (existing) {
                // Update
                await supabase.from('leads').update({
                    campaign_id: parseInt(campaignId),
                    in_group: true,
                    updated_at: new Date().toISOString()
                }).eq('id', existing.id);
                updated++;
            } else {
                // Insert
                await supabase.from('leads').insert({
                    uuid: uuidv4(),
                    phone: cleanPhone,
                    email: `${cleanPhone}@whatsapp.gw`,
                    first_name: `Whapi Import ${cleanPhone}`,
                    campaign_id: parseInt(campaignId),
                    in_group: true,
                    status_id: defaultStatusId,
                    product_name: 'Produto Desconhecido',
                    source: 'whapi_import'
                });
                imported++;
            }
        }

        // Log detalhado dos resultados
        console.log(`\n✅ [WHAPI IMPORT] Importação concluída!`);
        console.log(`   📥 Novos: ${imported}`);
        console.log(`   🔄 Atualizados: ${updated}`);
        console.log(`   ⚠️  Ignorados: ${skipped}`);

        if (skipped > 0) {
            console.log(`\n📋 Motivos dos contatos ignorados:`);
            console.log(`   🔒 LIDs (Privacy): ${skippedReasons.isLID}`);
            console.log(`   📏 Muito curto: ${skippedReasons.tooShort}`);
            console.log(`   📏 Muito longo: ${skippedReasons.tooLong}`);
            console.log(`   ❌ Formato inválido: ${skippedReasons.invalidFormat}`);

            if (skippedExamples.length > 0) {
                console.log(`\n🔍 Exemplos de contatos ignorados:`);
                skippedExamples.forEach(ex => {
                    console.log(`   - ${ex.raw} → ${ex.reason}`);
                });
            }
        }

        res.json({
            success: true,
            total: participants.length,
            imported,
            updated,
            skipped,
            skippedReasons
        });

    } catch (error) {
        console.error('❌ Erro importação Whapi:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
