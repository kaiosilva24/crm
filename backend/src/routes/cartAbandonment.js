/**
 * Cart Abandonment Routes
 * Handles Hotmart cart abandonment events with ManyChat integration
 */

import { Router } from 'express';
import { supabase } from '../database/supabase.js';
import { createClient } from '@supabase/supabase-js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
    findSubscriberByPhone,
    findSubscriberByWhatsApp,
    findSubscriberByEmail,
    findSubscriberByName,
    findSubscriberByNameAndVerify,
    findSubscriberByCustomField,
    addTagByName,
    updateSubscriber,
    setCustomField,
    setWhatsAppOptIn,
    testConnection,
    createSubscriber
} from '../services/manychatService.js';

const router = Router();

// Create admin client for background tasks to bypass RLS
const adminDb = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : supabase;

/**
 * Helper - Normaliza telefone para padrão brasileiro
 */
function normalizePhone(phone) {
    if (!phone) return null;
    let n = phone.replace(/\D/g, '');

    if (n.length === 13) return n;

    if (n.length >= 14 && n.startsWith('55')) {
        const ddd = n.substring(2, 4);
        const rest = n.substring(4);
        if (rest.startsWith('99')) {
            return '55' + ddd + rest.substring(1, 10);
        }
        return n.substring(0, 13);
    }

    if (n.length === 12 && n.startsWith('55')) {
        const ddd = n.substring(2, 4);
        const firstDigit = n.charAt(4);
        if (['6', '7', '8', '9'].includes(firstDigit)) {
            return '55' + ddd + '9' + n.substring(4);
        }
        return n;
    }

    if (n.length === 11) return '55' + n;

    if (n.length === 10) {
        const ddd = n.substring(0, 2);
        const firstDigit = n.charAt(2);
        if (['7', '8', '9'].includes(firstDigit)) {
            return '55' + ddd + '9' + n.substring(2);
        }
        return '55' + n;
    }

    if (n.length < 10) return null;

    return n;
}

/**
 * Helper - Log action to cart_abandonment_logs
 */
async function logAction(eventId, actionType, status, message, errorMessage = null, payload = null) {
    try {
        await supabase
            .from('cart_abandonment_logs')
            .insert({
                event_id: eventId,
                action_type: actionType,
                status: status,
                message: message,
                error_message: errorMessage,
                payload: payload
            });
    } catch (error) {
        console.error('Error logging action:', error);
    }
}

/**
 * Helper - Process cart abandonment event
 * This runs asynchronously after webhook response
 */
async function processAbandonmentEvent(eventId) {
    try {
        await logAction(eventId, 'system_check', 'warning', 'RELOAD CHECK: Fallback Code Active', 'If you see this, code is updated');
        console.log(`🔄 Processing abandonment event: ${eventId}`);
        let firstMessageSuccess = false;

        // Get event
        const { data: event } = await supabase
            .from('cart_abandonment_events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (!event) {
            console.error(`Event ${eventId} not found`);
            return;
        }

        // Get settings
        const { data: settings } = await supabase
            .from('cart_abandonment_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (!settings || !settings.is_enabled) {
            console.log('Cart abandonment system is disabled');
            await logAction(eventId, 'processing', 'skipped', 'System disabled');
            return;
        }

        // Update status to processing
        await adminDb
            .from('cart_abandonment_events')
            .update({ status: 'processing', processed_at: new Date().toISOString() })
            .eq('id', eventId);

        // STEP 1: Send first message via API (Strict Single-Target)
        try {
            console.log(`📤 Step 1: Sending first message via API`);

            if (settings.manychat_api_token && (settings.manychat_tag_name || settings.manychat_flow_id_first)) {
                let subscriberId = null;
                const tagName = settings.manychat_tag_name || 'abandono_carrinho';

                // Search by CUSTOM FIELD "phone" (ID 12655372)
                // This field is populated by ManyChat automation (WhatsApp → phone custom field)
                console.log(`🔍 Step 1: Searching by Custom Field 'phone': ${event.contact_phone}`);

                const phoneFieldId = 12655372; // Custom Field "phone"
                subscriberId = await findSubscriberByCustomField(phoneFieldId, event.contact_phone, settings.manychat_api_token);

                // [NEW] Fallback 1: Search by System Field 'phone'
                if (!subscriberId) {
                    console.log(`🔍 Custom Field failed. Searching by System Field 'phone': ${event.contact_phone}`);
                    subscriberId = await findSubscriberByPhone(event.contact_phone, settings.manychat_api_token);
                    if (subscriberId) console.log(`✅ ID Found by System Field 'phone': ${subscriberId}`);
                }

                // [NEW] Fallback 2: Search by WhatsApp System Field
                if (!subscriberId) {
                    console.log(`🔍 System Field failed. Searching by WhatsApp System Field: ${event.contact_phone}`);
                    subscriberId = await findSubscriberByWhatsApp(event.contact_phone, settings.manychat_api_token);
                    if (subscriberId) console.log(`✅ ID Found by WhatsApp System Field: ${subscriberId}`);
                }

                // [NEW] Fallback 3: Search by Name with TELEPHONE verification (The "Hybrid" Strategy)
                if (!subscriberId && event.contact_name) {
                    console.log(`🔍 Phone searches failed. Attemptind Strategy: Name '${event.contact_name}' + Verify '${event.contact_phone}'`);
                    subscriberId = await findSubscriberByNameAndVerify(event.contact_name, event.contact_phone, settings.manychat_api_token);

                    if (subscriberId) {
                        console.log(`✅ ID Found and Verified: ${subscriberId}`);
                        try {
                            console.log(`🛠️ Auto-Healing: Updating system phone for ${subscriberId}...`);
                            await updateSubscriber(subscriberId, { phone: event.contact_phone, has_opt_in_sms: true }, settings.manychat_api_token);
                        } catch (updErr) { console.error('⚠️ Auto-Heal failed:', updErr.message); }
                    }
                }

                if (subscriberId) {
                    console.log(`✅ ID Found by Custom Field 'phone': ${subscriberId}`);

                    // CRITICAL FIX: If found via Custom Field, it might be a "Phantom Contact" (Phone System Field is empty)
                    // We MUST update the System Field 'phone' to ensure future searchability and consistency
                    try {
                        console.log(`🔄 Syncing System Field 'phone' for contact ${subscriberId}...`);
                        const formattedPhone = event.contact_phone.startsWith('+') ? event.contact_phone : `+${event.contact_phone}`;

                        await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/updateSubscriber`, {
                            subscriber_id: subscriberId,
                            phone: formattedPhone,
                            has_opt_in_sms: true,
                            consent_phrase: "Cart Abandonment Sync"
                        }, {
                            headers: {
                                'Authorization': `Bearer ${settings.manychat_api_token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        console.log(`✅ System Field 'phone' synced successfully!`);
                    } catch (syncError) {
                        console.error('❌ Failed to sync System Field phone:', syncError.message);
                        // Non-blocking error - continue to apply tag
                    }
                } else {
                    // If not found, create NEW WhatsApp contact with BOTH fields
                    // This ensures: 1) WhatsApp channel (green icon), 2) Future searchability

                    if (!subscriberId) {
                        const nameParts = (event.contact_name || 'Cliente').split(' ');
                        const firstName = nameParts[0];
                        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

                        console.log(`👤 Custom Field search failed. Creating NEW WhatsApp subscriber...`);
                        try {
                            subscriberId = await createSubscriber(
                                firstName,
                                lastName,
                                event.contact_phone,
                                event.contact_email,
                                settings.manychat_api_token
                            );
                            if (subscriberId) console.log(`✅ Created New WhatsApp ID: ${subscriberId}`);
                        } catch (createError) {
                            console.error('Creation failed:', createError.message);
                            await logAction(eventId, 'create_subscriber', 'error', 'Failed to create new WhatsApp contact', createError.message);
                        }
                    }
                }

                if (subscriberId) {
                    // Save subscriber ID using adminDb
                    await adminDb
                        .from('cart_abandonment_events')
                        .update({ manychat_subscriber_id: subscriberId })
                        .eq('id', eventId);

                    console.log(`🚀 Processing Target: ${subscriberId} with tag: ${tagName}`);

                    // ENSURE PHONE & OPT-IN ARE UPDATED
                    try {
                        const formattedPhone = event.contact_phone.startsWith('+') ? event.contact_phone : `+${event.contact_phone}`;

                        await updateSubscriber(subscriberId, {
                            phone: formattedPhone,
                            has_opt_in_sms: true,
                            has_opt_in_email: true,
                            consent_phrase: "Cart Abandonment Update"
                        }, settings.manychat_api_token);

                        // Explicitly Set Custom Field "WhatsApp" (ID 13968648)
                        // ManyChat Number fields don't like '+', so we strip it just in case.
                        const cleanPhone = formattedPhone.replace('+', '');
                        await setCustomField(subscriberId, 13968648, cleanPhone, settings.manychat_api_token);

                    } catch (updErr) {
                        console.log(`⚠️ Update info failed for ${subscriberId}: ${updErr.message}`);
                    }

                    // ADD TAG (Single Call)
                    try {
                        await addTagByName(
                            subscriberId,
                            tagName,
                            settings.manychat_api_token
                        );
                        console.log(`✅ Tag added successfully to ${subscriberId}`);

                        const { error: updateError } = await adminDb
                            .from('cart_abandonment_events')
                            .update({
                                first_message_sent: true,
                                first_message_sent_at: new Date().toISOString()
                            })
                            .eq('id', eventId);

                        if (updateError) console.error('DB Update Error:', updateError);

                        // Track success for partial failure handling
                        firstMessageSuccess = true;

                    } catch (tagErr) {
                        console.error(`❌ Tag failed for ${subscriberId}:`, tagErr.message);
                        await logAction(eventId, 'first_message', 'error', `Tag failed: ${tagErr.message}`);
                    }

                } else {
                    console.log(`⚠️ Unable to find or create ANY subscriber.`);
                    await logAction(eventId, 'first_message', 'skipped', 'No subscriber resolved');
                }
            } else {
                console.log(`⚠️ ManyChat API/Tag not configured`);
                await logAction(eventId, 'first_message', 'skipped', 'ManyChat API not configured');
            }
        } catch (error) {
            // ...
        }

        // STEP 2: Wait for configured delay
        const delayMs = (settings.delay_minutes || 60) * 60 * 1000;
        console.log(`⏳ Step 2: Waiting ${settings.delay_minutes} minutes...`);
        await logAction(eventId, 'delay_wait', 'success', `Waiting ${settings.delay_minutes} minutes`);

        await new Promise(resolve => setTimeout(resolve, delayMs));

        console.log(`⏰ Delay completed, continuing processing`);

        // STEP 3: Check if contact is in campaign
        let foundInCampaign = false;

        if (settings.campaign_id) {
            try {
                console.log(`🔍 Step 3: Checking if contact is in campaign ${settings.campaign_id}`);

                const phoneEnd = event.contact_phone ? event.contact_phone.slice(-8) : null;

                // Build OR condition: search by email OR phone
                const conditions = [];
                if (event.contact_email) {
                    conditions.push(`email.eq.${event.contact_email}`);
                }
                if (phoneEnd) {
                    conditions.push(`phone.ilike.%${phoneEnd}`);
                }

                if (conditions.length === 0) {
                    console.log('⚠️ No email or phone to search');
                    await logAction(eventId, 'campaign_check', 'error', 'No contact info to search');
                    throw new Error('No contact info');
                }

                const { data: leads } = await supabase
                    .from('leads')
                    .select('id')
                    .eq('campaign_id', settings.campaign_id)
                    .or(conditions.join(','))
                    .limit(1);

                foundInCampaign = leads && leads.length > 0;

                await supabase
                    .from('cart_abandonment_events')
                    .update({
                        found_in_campaign: foundInCampaign,
                        campaign_check_at: new Date().toISOString()
                    })
                    .eq('id', eventId);

                await logAction(
                    eventId,
                    'campaign_check',
                    'success',
                    foundInCampaign ? 'Contact found in campaign' : 'Contact not found in campaign'
                );

                console.log(`${foundInCampaign ? '✅ Contact found' : '❌ Contact not found'} in campaign`);
            } catch (error) {
                console.error('Error checking campaign:', error);
                await logAction(eventId, 'campaign_check', 'error', 'Failed to check campaign', error.message);
            }
        } else {
            console.log('⚠️ No campaign configured for verification');
            await logAction(eventId, 'campaign_check', 'skipped', 'No campaign configured');
        }

        // STEP 4: Second Message
        if (!foundInCampaign && settings.manychat_api_token && (settings.manychat_flow_id_second || settings.manychat_tag_name)) {
            try {
                console.log(`📤 Step 4: Sending second message via API`);

                // Find subscriber by phone
                let subscriberId = await findSubscriberByPhone(
                    event.contact_phone,
                    settings.manychat_api_token
                );

                if (!subscriberId) {
                    console.log(`👤 Subscriber not found in Step 4, attempting to create...`);
                    const nameParts = (event.contact_name || 'Cliente').split(' ');
                    const firstName = nameParts[0];
                    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

                    try {
                        subscriberId = await createSubscriber(
                            firstName,
                            lastName,
                            event.contact_phone,
                            event.contact_email,
                            settings.manychat_api_token
                        );
                    } catch (createError) {
                        console.error('Failed to create subscriber:', createError.message);
                        // Fallback: Try finding by Name
                        try {
                            subscriberId = await findSubscriberByName(`${firstName} ${lastName}`, settings.manychat_api_token);
                            if (subscriberId) console.log(`✅ Fallback successful! Found ID: ${subscriberId}`);
                        } catch (e) { }
                    }
                }

                if (subscriberId) {
                    // Save subscriber ID using adminDb
                    await adminDb
                        .from('cart_abandonment_events')
                        .update({ manychat_subscriber_id: subscriberId })
                        .eq('id', eventId);

                    // Send second message via TAG (using separate configured tag)
                    const tagName = settings.manychat_tag_name_second || (settings.manychat_tag_name || 'abandono_carrinho') + '_2';

                    await addTagByName(
                        subscriberId,
                        tagName,
                        settings.manychat_api_token
                    );

                    await adminDb
                        .from('cart_abandonment_events')
                        .update({
                            second_message_sent: true,
                            second_message_sent_at: new Date().toISOString()
                        })
                        .eq('id', eventId);

                    await logAction(eventId, 'second_message', 'success', `Second tag '${tagName}' added successfully`);
                    console.log(`✅ Second tag added`);
                } else {
                    console.log(`⚠️ Subscriber not found in ManyChat`);
                    await logAction(eventId, 'second_message', 'skipped', 'Subscriber not found in ManyChat');
                }
            } catch (error) {
                console.error('Error sending second message:', error);
                const detail = error.response && error.response.data ? JSON.stringify(error.response.data) : error.message;

                // [UPDATED] If first message was sent, mark as COMPLETED (Partial Success) instead of ERROR
                const finalStatus = firstMessageSuccess ? 'completed' : 'error';
                console.log(`⚠️ Second message failed. First message success: ${firstMessageSuccess}. Setting status to: ${finalStatus}`);

                await supabase
                    .from('cart_abandonment_events')
                    .update({
                        status: finalStatus,
                        error_message: `Second tag failed: ${error.message}`
                    })
                    .eq('id', eventId);

                await logAction(eventId, 'second_message', 'error', 'Failed to send second flow', detail);
            }

        } else {
            const reason = foundInCampaign
                ? 'Contact already in campaign'
                : 'ManyChat API not configured';
            console.log(`⚠️ Skipping second message: ${reason}`);
            await logAction(eventId, 'second_message', 'skipped', reason);
        }

        // Mark as completed ONLY if no previous errors occurred (checked by re-fetching or optimistic logic)
        // Since we are inside the same execution scope, we can check if we hit any catch blocks above? 
        // Better: We query the current status or just check local variables? 
        // Actually simplest way: Check cleanly. But for now, let's just do a check update.

        const { data: currentEvent } = await adminDb
            .from('cart_abandonment_events')
            .select('status')
            .eq('id', eventId)
            .single();

        if (currentEvent && currentEvent.status !== 'error') {
            await adminDb
                .from('cart_abandonment_events')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', eventId);

            console.log(`✅ Event ${eventId} processing completed`);
        } else {
            console.log(`⚠️ Event ${eventId} finished with ERROR status.`);
        }

    } catch (error) {
        console.error(`❌ Error processing event ${eventId}:`, error);

        await supabase
            .from('cart_abandonment_events')
            .update({
                status: 'error',
                error_message: error.message
            })
            .eq('id', eventId);

        await logAction(eventId, 'processing', 'error', 'Processing failed', error.message);
    }
}

/**
 * POST /api/cart-abandonment/webhook
 * Receive cart abandonment events from Hotmart
 */
router.post('/webhook', async (req, res) => {
    try {
        const payload = req.body;
        console.log(`📥 Cart abandonment webhook received:`, JSON.stringify(payload, null, 2));

        // Check if system is enabled
        const { data: settings } = await supabase
            .from('cart_abandonment_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (!settings || !settings.is_enabled) {
            console.log('⚠️ Cart abandonment system is disabled');
            return res.status(200).json({ message: 'System disabled' });
        }

        // Extract data from payload
        const eventType = payload.event || 'UNKNOWN';
        const buyer = payload.data?.buyer || {};
        const product = payload.data?.product || {};

        const contactName = buyer.name || buyer.first_name || 'Unknown';
        const contactEmail = buyer.email || null;
        const contactPhone = normalizePhone(buyer.checkout_phone || buyer.phone || '');
        const productName = product.name || 'Unknown Product';
        const transactionId = payload.data?.purchase?.transaction || null;

        // Check for duplicate (same email or phone in last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        let duplicateQuery = supabase
            .from('cart_abandonment_events')
            .select('id')
            .gte('created_at', oneDayAgo);

        if (contactEmail) {
            duplicateQuery = duplicateQuery.eq('contact_email', contactEmail);
        } else if (contactPhone) {
            duplicateQuery = duplicateQuery.eq('contact_phone', contactPhone);
        } else {
            console.log('⚠️ No email or phone to check for duplicates');
        }

        const { data: duplicates } = await duplicateQuery.limit(1);

        if (duplicates && duplicates.length > 0) {
            console.log(`⚠️ Duplicate event detected for ${contactEmail || contactPhone}`);

            // Log as duplicate but don't process
            const { data: event } = await supabase
                .from('cart_abandonment_events')
                .insert({
                    contact_name: contactName,
                    contact_email: contactEmail,
                    contact_phone: contactPhone,
                    product_name: productName,
                    event_type: eventType,
                    hotmart_transaction_id: transactionId,
                    status: 'duplicate',
                    payload: payload
                })
                .select()
                .single();

            await logAction(event.id, 'webhook_received', 'skipped', 'Duplicate event');

            return res.status(200).json({
                message: 'Duplicate event ignored',
                event_id: event.id
            });
        }

        // Create new event
        const { data: event } = await supabase
            .from('cart_abandonment_events')
            .insert({
                contact_name: contactName,
                contact_email: contactEmail,
                contact_phone: contactPhone,
                product_name: productName,
                event_type: eventType,
                hotmart_transaction_id: transactionId,
                status: 'pending',
                payload: payload
            })
            .select()
            .single();

        await logAction(event.id, 'webhook_received', 'success', 'Event created successfully');

        console.log(`✅ Event created: ${event.id}`);

        // Process asynchronously (don't wait for response)
        processAbandonmentEvent(event.id).catch(err => {
            console.error('Error in async processing:', err);
        });

        // Return success immediately
        res.status(200).json({
            message: 'Event received and queued for processing',
            event_id: event.id
        });

    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/cart-abandonment/settings
 * Get cart abandonment settings
 */
router.get('/settings', authenticate, authorize('admin'), async (req, res) => {
    try {
        let { data: settings } = await supabase
            .from('cart_abandonment_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (!settings) {
            // Create default settings
            const { data: newSettings } = await supabase
                .from('cart_abandonment_settings')
                .insert({
                    id: 1,
                    is_enabled: false,
                    delay_minutes: 60
                })
                .select()
                .single();
            settings = newSettings;
        }

        res.json({ settings });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
});

/**
 * PUT /api/cart-abandonment/settings
 * Update cart abandonment settings
 */
router.put('/settings', authenticate, authorize('admin'), async (req, res) => {
    try {
        const {
            manychat_api_token,
            manychat_flow_id_first,
            manychat_flow_id_second,
            manychat_webhook_url,
            manychat_tag_name,
            delay_minutes,
            campaign_id,
            is_enabled
        } = req.body;

        const { data: settings } = await supabase
            .from('cart_abandonment_settings')
            .upsert({
                id: 1,
                manychat_api_token,
                manychat_flow_id_first,
                manychat_flow_id_second,
                manychat_webhook_url,
                manychat_tag_name,
                delay_minutes,
                campaign_id,
                is_enabled,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        res.json({ message: 'Configurações salvas com sucesso', settings });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Erro ao salvar configurações' });
    }
});

/**
 * GET /api/cart-abandonment/events
 * Get cart abandonment events
 */
router.get('/events', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { status, limit = 50 } = req.query;

        let query = supabase
            .from('cart_abandonment_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (status) {
            query = query.eq('status', status);
        }

        const { data: events } = await query;
        res.json({ events: events || [] });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Erro ao buscar eventos' });
    }
});

/**
 * GET /api/cart-abandonment/logs
 * Get cart abandonment logs
 */
router.get('/logs', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { event_id, limit = 100 } = req.query;

        let query = supabase
            .from('cart_abandonment_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (event_id) {
            query = query.eq('event_id', parseInt(event_id));
        }

        const { data: logs } = await query;
        res.json({ logs: logs || [] });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Erro ao buscar logs' });
    }
});

/**
 * POST /api/cart-abandonment/test-connection
 * Test ManyChat API connection
 */
router.post('/test-connection', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { api_token } = req.body;

        if (!api_token) {
            return res.status(400).json({ error: 'API token é obrigatório' });
        }

        const isValid = await testConnection(api_token);

        if (isValid) {
            res.json({ success: true, message: 'Conexão com ManyChat estabelecida com sucesso' });
        } else {
            res.status(400).json({ success: false, error: 'Falha ao conectar com ManyChat' });
        }
    } catch (error) {
        console.error('Error testing connection:', error);
        res.status(500).json({ error: 'Erro ao testar conexão: ' + error.message });
    }
});

/**
 * GET /api/cart-abandonment/flows
 * Get available ManyChat flows
 */
router.get('/flows', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { api_token } = req.query;

        if (!api_token) {
            return res.status(400).json({ error: 'API token é obrigatório' });
        }

        const flows = await getFlows(api_token);
        res.json({ flows });
    } catch (error) {
        console.error('Error fetching flows:', error);
        res.status(500).json({ error: 'Erro ao buscar flows: ' + error.message });
    }
});

/**
 * POST /api/cart-abandonment/check-campaign/:id
 * Check if contact from event is in campaign and mark as completed
 */
router.post('/check-campaign/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);

        // Get event
        const { data: event, error: eventError } = await supabase
            .from('cart_abandonment_events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (eventError || !event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Get settings
        const { data: settings } = await supabase
            .from('cart_abandonment_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (!settings || !settings.campaign_id) {
            return res.status(400).json({ error: 'No campaign configured for verification' });
        }

        // Check if contact is in campaign
        const phoneEnd = event.contact_phone ? event.contact_phone.slice(-8) : null;

        let query = supabase
            .from('leads')
            .select('id')
            .eq('campaign_id', settings.campaign_id);

        if (event.contact_email) {
            query = query.eq('email', event.contact_email);
        } else if (phoneEnd) {
            query = query.ilike('phone', `%${phoneEnd}`);
        } else {
            return res.status(400).json({ error: 'No contact info to search' });
        }

        const { data: leads } = await query.limit(1);
        const foundInCampaign = leads && leads.length > 0;

        // Update event
        await adminDb
            .from('cart_abandonment_events')
            .update({
                in_campaign: foundInCampaign,
                status: foundInCampaign ? 'completed' : 'error',
                completed_at: foundInCampaign ? new Date().toISOString() : null
            })
            .eq('id', eventId);

        await logAction(
            eventId,
            'manual_campaign_check',
            'success',
            foundInCampaign ? 'Contact found in campaign' : 'Contact not found in campaign'
        );

        res.json({
            success: true,
            found: foundInCampaign,
            message: foundInCampaign
                ? 'Contact found in campaign and marked as completed'
                : 'Contact not found in campaign'
        });
    } catch (error) {
        console.error('Error checking campaign:', error);
        res.status(500).json({ error: 'Error checking campaign: ' + error.message });
    }
});

export default router;
