import { Router } from 'express';
import { supabase } from '../database/supabase.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
    testConnection,
    findSubscriberByPhone,
    findSubscriberByWhatsApp,
    findSubscriberByName,
    deleteSubscriber,
    createSubscriber,
    createWhatsAppSubscriber,
    setWhatsAppOptIn,
    addTagByName,
    removeTagByName
} from '../services/manychatService.js';

const router = Router();

/**
 * GET /api/manychat/events
 * Get ManyChat automation processing logs
 */
router.get('/events', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const { data: events, error } = await supabase
            .from('manychat_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));
            
        if (error) throw error;
        res.json({ events: events || [] });
    } catch (error) {
        console.error('Error fetching ManyChat events:', error);
        res.status(500).json({ error: 'Erro ao buscar eventos do ManyChat' });
    }
});

/**
 * GET /api/manychat/settings
 * Get current ManyChat settings
 */
router.get('/settings', authenticate, authorize('admin'), async (req, res) => {
    try {
        let { data: settings } = await supabase
            .from('manychat_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (!settings) {
            // Create default if not exists
            const { data: newSettings } = await supabase
                .from('manychat_settings')
                .insert({
                    id: 1,
                    is_enabled: false
                })
                .select()
                .single();
            settings = newSettings;
        }

        res.json({ settings });
    } catch (error) {
        console.error('Error fetching Manychat settings:', error);
        res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
});

/**
 * PUT /api/manychat/settings
 * Update ManyChat settings
 */
router.put('/settings', authenticate, authorize('admin'), async (req, res) => {
    try {
        const {
            webhook_config_id,
            manychat_api_token,
            manychat_tag_name,
            is_enabled,
            campaign_id,
            prepend_number,
            custom_name
        } = req.body;

        const { data: settings } = await supabase
            .from('manychat_settings')
            .update({
                webhook_config_id: webhook_config_id || null,
                manychat_api_token,
                manychat_tag_name,
                is_enabled,
                campaign_id: campaign_id || null,
                prepend_number: prepend_number || null,
                custom_name: custom_name || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', 1)
            .select()
            .single();

        res.json({ message: 'Configurações salvas com sucesso', settings });
    } catch (error) {
        console.error('Error updating Manychat settings:', error);
        res.status(500).json({ error: 'Erro ao salvar configurações' });
    }
});

/**
 * POST /api/manychat/test-connection
 * Test ManyChat API connection using the token
 */
router.post('/test-connection', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { api_token } = req.body;

        if (!api_token) {
            return res.status(400).json({ error: 'API token é obrigatório' });
        }

        const isValid = await testConnection(api_token);

        if (isValid) {
            res.json({ success: true, message: 'Conexão estabelecida com sucesso' });
        } else {
            res.status(400).json({ success: false, error: 'Falha ao conectar com ManyChat' });
        }
    } catch (error) {
        console.error('Error testing connection:', error);
        res.status(500).json({ error: 'Erro ao testar conexão: ' + error.message });
    }
});

/**
 * POST /api/manychat/test-automation
 * Manually trigger the automation for testing purposes
 */
router.post('/test-automation', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { leadData } = req.body;

        if (!leadData || !leadData.name || (!leadData.phone && !leadData.email)) {
            return res.status(400).json({ error: 'Dados do lead (nome, e telefone ou email) são obrigatórios.' });
        }

        // Get settings
        const { data: settings } = await supabase
            .from('manychat_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (!settings) {
            return res.status(400).json({ error: 'Configurações do Manychat não encontradas no banco de dados.' });
        }

        if (!settings.manychat_api_token) {
             return res.status(400).json({ error: 'Token da API não configurado.' });
        }

        const apiToken = settings.manychat_api_token;
        const tagName = leadData.tag || settings.manychat_tag_name;
        
        if (!tagName) {
             return res.status(400).json({ error: 'Nenhuma Tag foi fornecida e não há tag configurada por padrão.' });
        }

        let automationStatus = 'pending';
        let errorMessage = null;

        // Log event creation into database
        const { data: eventRecord, error: insertError } = await supabase
            .from('manychat_events')
            .insert({
                contact_name: leadData.name || 'Teste IA',
                contact_email: leadData.email || null,
                contact_phone: leadData.phone || null,
                product_name: 'Envio de Teste (Local)',
                status: 'processing',
                automation_status: 'pending'
            })
            .select()
            .single();
            
        const eventId = eventRecord ? eventRecord.id : null;

        try {
            let subscriberId = null;

            // Try to find the subscriber
            if (leadData.phone) {
                subscriberId = await findSubscriberByWhatsApp(leadData.phone, apiToken) || await findSubscriberByPhone(leadData.phone, apiToken);
            }
            
            if (!subscriberId && leadData.name) {
                const matches = await findSubscriberByName(leadData.name, apiToken);
                if (matches && matches.length > 0) {
                    subscriberId = matches[0];
                }
            }

            // Se o contato existir, apenas garantimos o Opt-In do WhatsApp e adicionamos a tag
            if (subscriberId) {
                console.log(`[ManyChat TEST] Subscriber found (ID: ${subscriberId}). Applying WhatsApp Opt-in and Tag...`);
                if (leadData.phone) {
                    await setWhatsAppOptIn(subscriberId, leadData.phone, apiToken);
                }
                
                // REMOVE A TAG SE ELA JÁ EXISTIR PARA FORÇAR O GATILHO NOVAMENTE
                await removeTagByName(subscriberId, tagName, apiToken);
                
                await addTagByName(subscriberId, tagName, apiToken);
                automationStatus = 'success';
                res.json({ success: true, message: `Automação executada! (Contato Existente atualizado. ID: ${subscriberId}, Tag: ${tagName})` });
            } else {
                // Se o contato NÃO existir, criamos um NOVO usando apenas WhatsApp para não dar erro de permissão SMS
                const nameParts = (leadData.name || 'Lead').split(' ');
                const firstName = nameParts[0];
                const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
                
                console.log(`[ManyChat TEST] Creating new WhatsApp-only subscriber...`);
                const newSubscriberId = await createWhatsAppSubscriber(
                    firstName,
                    lastName,
                    leadData.phone || '',
                    leadData.email || '',
                    apiToken
                );

                if (newSubscriberId) {
                    console.log(`[ManyChat TEST] Applying tag '${tagName}'...`);
                    await addTagByName(newSubscriberId, tagName, apiToken);
                    automationStatus = 'success';
                    res.json({ success: true, message: `Automação de teste executada! Novo Subscriber ID: ${newSubscriberId}, Tag: ${tagName}` });
                } else {
                    automationStatus = 'error';
                    errorMessage = 'Falha ao criar novo subscriber na API';
                    res.status(500).json({ error: errorMessage });
                }
            }
        } catch (innerError) {
             automationStatus = 'error';
             errorMessage = innerError.message;
             res.status(500).json({ error: 'Erro execução: ' + errorMessage });
        }
        
        // Update database with final result
        if (eventId) {
            await supabase
                .from('manychat_events')
                .update({
                    status: automationStatus === 'success' ? 'success' : 'error',
                    automation_status: automationStatus,
                    error_message: errorMessage,
                    processed_at: new Date().toISOString()
                })
                .eq('id', eventId);
        }

    } catch (error) {
         console.error('Error testing automation:', error);
         res.status(500).json({ error: 'Erro ao testar automação: ' + error.message });
    }
});

export async function processManychatAutomation(webhookId, leadData, bypassWebhookIdCheck = false, options = {}) {
    try {
        console.log(`[ManyChat] Checking automation for webhook ID: ${webhookId}`);

        // Get settings
        const { data: settings } = await supabase
            .from('manychat_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (!settings || !settings.is_enabled) {
            console.log(`[ManyChat] Automation disabled. Skipping.`);
            return;
        }

        // Determinar se acionamento bateu com Configurada Webhook ou Campanha
        const isWebhookMatch = settings.webhook_config_id && settings.webhook_config_id == webhookId;
        const triggerCampaignId = options.triggerCampaignId || leadData.campaign_id;
        const isCampaignMatch = settings.campaign_id && settings.campaign_id == triggerCampaignId;

        // Se NÃO estamos ignorando o check e não bateu Webhook ou Campanha, pular.
        if (!bypassWebhookIdCheck && !isWebhookMatch && !isCampaignMatch) {
            console.log(`[ManyChat] Webhook ID mismatch and Campaign mismatch. Skipping.`);
            return;
        }
        
        // Se a gente ignorou o Webhook (via GreatPages) mas tbm não bateu a campanha, deve pular.
        if (bypassWebhookIdCheck && !isCampaignMatch) {
            console.log(`[ManyChat] Campaign mismatch (Expected: ${settings.campaign_id}, Received: ${triggerCampaignId}). Skipping.`);
            return;
        }

        if (!settings.manychat_api_token || !settings.manychat_tag_name) {
            console.log(`[ManyChat] Token or Tag Name missing. Skipping.`);
            return;
        }

        // Apply Custom Name Formatting
        let finalName = leadData.name || 'Desconhecido';
        if (settings.custom_name && settings.custom_name.trim() !== '') {
            const currentCounter = settings.name_counter || 1;
            finalName = `${settings.custom_name.trim()} ${currentCounter}`;
            // Increment counter asynchronously
            supabase.from('manychat_settings').update({ name_counter: currentCounter + 1 }).eq('id', 1).then();
        }

        // Apply Prepend Number Formatting
        let finalPhone = leadData.phone;
        if (settings.prepend_number && finalPhone) {
            finalPhone = `${settings.prepend_number.trim()}${finalPhone}`;
            // Previne falha no Manychat por causa do "+" que possa vir caso o cliente digite "+55"
            finalPhone = finalPhone.replace(/\+/g, '');
        }

        const apiToken = settings.manychat_api_token;
        const tagName = settings.manychat_tag_name;
        
        console.log(`[ManyChat] Executing automation for lead: ${finalName} - ${finalPhone}`);
        
        let automationStatus = 'pending';
        let errorMessage = null;
        
        // Log event creation into database
        const { data: eventRecord, error: insertError } = await supabase
            .from('manychat_events')
            .insert({
                contact_name: finalName,
                contact_email: leadData.email || null,
                contact_phone: finalPhone || null,
                product_name: leadData.product || null,
                status: 'processing',
                automation_status: 'pending'
            })
            .select()
            .single();
            
        const eventId = eventRecord ? eventRecord.id : null;

        if (insertError) {
             console.error("[ManyChat] Failed to insert tracking event:", insertError.message);
        }

        try {
            let subscriberId = null;

            // Try to find the subscriber
            if (finalPhone) {
                subscriberId = await findSubscriberByWhatsApp(finalPhone, apiToken) || await findSubscriberByPhone(finalPhone, apiToken);
            }
            
            if (!subscriberId && finalName) {
                const matches = await findSubscriberByName(finalName, apiToken);
                if (matches && matches.length > 0) {
                    subscriberId = matches[0];
                }
            }

            // Se o contato existir, apenas garantimos o Opt-In do WhatsApp e adicionamos a tag
            if (subscriberId) {
                console.log(`[ManyChat] Subscriber found (ID: ${subscriberId}). Applying WhatsApp Opt-in and Tag...`);
                if (finalPhone) {
                    await setWhatsAppOptIn(subscriberId, finalPhone, apiToken);
                }
                
                // REMOVE A TAG SE ELA JÁ EXISTIR PARA FORÇAR O GATILHO NOVAMENTE
                await removeTagByName(subscriberId, tagName, apiToken);
                
                await addTagByName(subscriberId, tagName, apiToken);
                console.log(`[ManyChat] Automation completed successfully for existing lead.`);
                automationStatus = 'success';
            } else {
                // Se o contato NÃO existir, criamos um NOVO usando apenas WhatsApp para não dar erro de permissão SMS
                const nameParts = finalName.split(' ');
                const firstName = nameParts[0];
                const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
                
                console.log(`[ManyChat] Creating new WhatsApp-only subscriber...`);
                const newSubscriberId = await createWhatsAppSubscriber(
                    firstName,
                    lastName,
                    finalPhone || '',
                    leadData.email || '',
                    apiToken
                );

                if (newSubscriberId) {
                    console.log(`[ManyChat] Applying tag '${tagName}'...`);
                    await addTagByName(newSubscriberId, tagName, apiToken);
                    console.log(`[ManyChat] Automation completed successfully for new lead.`);
                    automationStatus = 'success';
                } else {
                    console.error(`[ManyChat] Failed to create subscriber. Automation aborted.`);
                    automationStatus = 'error';
                    errorMessage = 'Falha ao criar contato na API ManyChat.';
                }
            }
        } catch (err) {
            console.error(`[ManyChat] Inner execution error:`, err.message);
            automationStatus = 'error';
            errorMessage = err.message;
        }
        
        // Update database with final result
        if (eventId) {
            await supabase
                .from('manychat_events')
                .update({
                    status: automationStatus === 'success' ? 'success' : 'error',
                    automation_status: automationStatus,
                    error_message: errorMessage,
                    processed_at: new Date().toISOString()
                })
                .eq('id', eventId);
        }

    } catch (error) {
        console.error(`[ManyChat] Error executing automation:`, error.message);
    }
}

export default router;
