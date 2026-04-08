import axios from 'axios';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

/**
 * Send webhook to ManyChat
 */
export async function sendTagWebhook(phone, tagName, webhookUrl) {
    try {
        console.log(`📤 Sending TAG webhook to ManyChat: phone=${phone}, tag=${tagName}`);
        const response = await axios.post(webhookUrl, {
            phone: phone,
            tag: tagName,
            source: 'cart_abandonment'
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log(`✅ TAG webhook sent successfully`);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('❌ Error sending TAG webhook:', error.message);
        throw error;
    }
}

/**
 * Check if ManyChat credentials are valid
 */
export async function testConnection(apiToken) {
    try {
        console.log(`🔌 Testing ManyChat connection...`);
        const response = await axios.get(`${MANYCHAT_API_BASE}/fb/page/getInfo`, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`✅ ManyChat connection successful: ${response.data?.data?.name || 'Authorized'}`);
        return true;
    } catch (error) {
        console.error('❌ ManyChat connection failed:', error.response ? error.response.data : error.message);
        return false;
    }
}

/**
 * Get available Flows
 */
export async function getFlows(apiToken) {
    try {
        console.log(`📂 Fetching ManyChat flows...`);
        // Note: ManyChat API might not have a direct "list flows" endpoint in public API v1 easily.
        // But /fb/sending/getFlows usually returns list.
        const response = await axios.get(`${MANYCHAT_API_BASE}/fb/sending/getFlows`, {
            headers: { 'Authorization': `Bearer ${apiToken}` }
        });

        if (response.data && response.data.data && response.data.data.flows) {
            return response.data.data.flows;
        } else if (response.data && response.data.data) {
            // Sometimes it returns array directly
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error('Error getting flows:', error.message);
        return [];
    }
}

/**
 * Find subscriber by phone number
 */
export async function findSubscriberByPhone(phone, apiToken) {
    if (!phone) return null;

    let cleanPhone = phone.replace(/\D/g, '');
    let formats = [phone, `+${cleanPhone}`, cleanPhone];

    const uniqueFormats = [...new Set(formats)];

    for (const ph of uniqueFormats) {
        try {
            console.log(`[ManyChat] Looking up subscriber by phone: ${ph}`);
            // Correct API: /fb/subscriber/findBySystemField?phone=...
            const response = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField`, {
                params: {
                    phone: ph
                },
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.data) {
                const resData = response.data.data;
                // API typically returns an array for this endpoint search, but sometimes object
                const candidates = Array.isArray(resData) ? resData : [resData];

                for (const sub of candidates) {
                    if (sub.id && sub.status !== 'deleted') {
                        console.log(`✅ Found ACTIVE ID: ${sub.id} (Format: ${ph})`);
                        return sub.id;
                    } else if (sub.id) {
                        console.log(`⚠️ Found ID ${sub.id} but status is '${sub.status}'. Ignoring.`);
                    }
                }
            }
        } catch (error) {
            // If 404 or empty, just continue to next format
            // If 400 (Validation), it might mean bad format, also continue
            if (error.response && error.response.status !== 404 && error.response.status !== 400) {
                console.error(`Error checking phone ${ph}:`, error.message);
            }
        }
    }
    console.log(`[ManyChat] Subscriber not found by phone`);
    return null;
}

/**
 * Find subscriber by WhatsApp Phone Number
 * This searches the whatsapp_phone field specifically (for WhatsApp contacts with green icon)
 */
export async function findSubscriberByWhatsApp(whatsappPhone, apiToken) {
    if (!whatsappPhone) return null;

    let cleanPhone = whatsappPhone.replace(/\D/g, '');
    let formats = [whatsappPhone, `+${cleanPhone}`, cleanPhone];

    // Lidar com o 9º dígito no Brasil para não enganar a busca
    if (cleanPhone.startsWith('55') && cleanPhone.length === 13) {
        // Ex: 55 11 9 9999-9999 -> Remover o 9
        const without9 = cleanPhone.slice(0, 4) + cleanPhone.slice(5);
        formats.push(without9);
        formats.push(`+${without9}`);
    } else if (cleanPhone.startsWith('55') && cleanPhone.length === 12) {
        // Ex: 55 11 9999-9999 -> Adicionar o 9
        const ddd = cleanPhone.slice(2, 4);
        if (parseInt(ddd) >= 11) {
            const with9 = cleanPhone.slice(0, 4) + '9' + cleanPhone.slice(4);
            formats.push(with9);
            formats.push(`+${with9}`);
        }
    }

    const uniqueFormats = [...new Set(formats)];

    for (const ph of uniqueFormats) {
        // ManyChat uses either `whatsapp_phone` or `wa_id`
        for (const field of ['whatsapp_phone', 'wa_id']) {
            try {
                console.log(`🔍 Finding ManyChat subscriber by ${field}: ${ph}`);
                const response = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField`, {
                    params: {
                        [field]: ph
                    },
                    headers: {
                        'Authorization': `Bearer ${apiToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data && response.data.data) {
                    const resData = response.data.data;
                    const candidates = Array.isArray(resData) ? resData : [resData];

                    for (const sub of candidates) {
                        if (sub.id && sub.status !== 'deleted') {
                            console.log(`✅ Found ACTIVE ID by ${field}: ${sub.id} (Format: ${ph})`);
                            return sub.id;
                        } else if (sub.id) {
                            console.log(`⚠️ Found ID ${sub.id} by ${field} but status is '${sub.status}'. Ignoring.`);
                        }
                    }
                }
            } catch (error) {
                // If 404 or empty, just continue to next format
                if (error.response && error.response.status !== 404 && error.response.status !== 400) {
                    console.error(`Error checking ${field} ${ph}:`, error.message);
                }
            }
        }
    }
    console.log(`[ManyChat] Subscriber not found by WhatsApp fields`);
    return null;
}

/**
 * Create a new subscriber
 * CRITICAL: Sets BOTH phone and whatsapp_phone to ensure:
 * 1. Contact has WhatsApp channel (green icon) via whatsapp_phone
 * 2. Contact is searchable via findBySystemField(phone)
 */
export async function createSubscriber(firstName, lastName, phone, email, apiToken) {
    try {
        console.log(`🆕 Creating new WhatsApp subscriber: ${firstName} ${lastName} (${phone}, ${email})`);
        
        // Ensure strict E.164 formatting without blindly mutating DDIs
        let cleanPhone = phone.replace(/\D/g, '');
        const formattedPhone = `+${cleanPhone}`;
        
        const payload = {
            first_name: firstName,
            last_name: lastName,
            phone: formattedPhone,              // For searchability via findBySystemField
            whatsapp_phone: formattedPhone,     // For WhatsApp channel (green icon)
            has_opt_in_sms: true,
            has_opt_in_email: true,
            consent_phrase: "Purchase from Hotmart"
        };
        if (email) payload.email = email;

        const response = await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/createSubscriber`, payload, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.data) {
            console.log(`✅ WhatsApp Subscriber created: ${response.data.data.id}`);
            return response.data.data.id;
        }
        return null;
        return null;
    } catch (error) {
        const detail = error.response && error.response.data
            ? JSON.stringify(error.response.data)
            : error.message;
        console.error('❌ Error creating subscriber:', detail);
        throw new Error(detail);
    }
}

/**
 * Create a new subscriber with ONLY whatsapp_phone
 * Used for specific automations that do not need system 'phone' or 'email' opt-ins.
 * This avoids the 'Permission denied to import phone' error.
 */
export async function createWhatsAppSubscriber(firstName, lastName, whatsappPhone, email, apiToken) {
    try {
        console.log(`🆕 Creating new pure-WhatsApp subscriber: ${firstName} ${lastName} (${whatsappPhone})`);
        
        // Ensure strict E.164 formatting without blindly mutating DDIs
        let cleanPhone = whatsappPhone.replace(/\D/g, '');
        const formattedPhone = `+${cleanPhone}`;
        
        const payload = {
            first_name: firstName,
            last_name: lastName,
            whatsapp_phone: formattedPhone,     // ONLY use whatsapp_phone
            consent_phrase: "Integracao CRM"
        };
        if (email) {
            payload.email = email;
            payload.has_opt_in_email = true;
        }

        const response = await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/createSubscriber`, payload, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.data) {
            console.log(`✅ Pure WhatsApp Subscriber created: ${response.data.data.id}`);
            return response.data.data.id;
        }
        return null;
    } catch (error) {
        const detail = error.response && error.response.data
            ? JSON.stringify(error.response.data)
            : error.message;
        console.error('❌ Error creating WhatsApp subscriber:', detail);
        
        // Se Manychat acusar que o contato já existe através do número do whatsapp:
        if (detail.includes("already exists")) {
             throw new Error(`ALREADY_EXISTS:${whatsappPhone}`);
        }
        throw new Error(detail);
    }
}

/**
 * Find subscriber by Email
 */
export async function findSubscriberByEmail(email, apiToken) {
    if (!email) return null;
    try {
        console.log(`🔍 Finding ManyChat subscriber by email: ${email}`);
        const response = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField`, {
            params: {
                email: email
            },
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.data) {
            const resData = response.data.data;
            if (resData.id) {
                console.log(`✅ Found ID by Email: ${resData.id}`);
                return resData.id;
            }
        }
        return null; // Not found (ManyChat returns empty data usually or 200 OK with empty)
    } catch (error) {
        if (error.response && error.response.status === 404) return null; // Standard not found
        console.error('Error finding subscriber by email:', error.message);
        return null;
    }
}

/**
 * Set a Custom Field Value
 */
export async function setCustomField(subscriberId, fieldId, value, apiToken) {
    try {
        console.log(`📝 Setting CF ${fieldId} to "${value}" for ${subscriberId}...`);
        const response = await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/setCustomField`, {
            subscriber_id: subscriberId,
            field_id: fieldId,
            field_value: value
        }, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.status === 'success') {
            console.log(`✅ Custom Field set successfully.`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ Error setting custom field:', error.response ? error.response.data : error.message);
        return false;
    }
}

/**
 * Set WhatsApp Opt-In for a subscriber
 * This enables the WhatsApp channel (green WhatsApp icon)
 */
export async function setWhatsAppOptIn(subscriberId, phone, apiToken) {
    try {
        console.log(`📱 Setting WhatsApp opt-in for ${subscriberId}...`);
        const response = await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/setWhatsAppOptIn`, {
            subscriber_id: subscriberId,
            phone: phone
        }, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.status === 'success') {
            console.log(`✅ WhatsApp opt-in set successfully.`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ Error setting WhatsApp opt-in:', error.response ? error.response.data : error.message);
        return false;
    }
}

/**
 * Find subscriber by Custom Field
 * UPDATED: Tries multiple formats for phone numbers (with/without +)
 */
export async function findSubscriberByCustomField(fieldId, fieldValue, apiToken) {
    if (!fieldId || !fieldValue) return null;

    // For phone numbers, try multiple formats
    const valuesToTry = [fieldValue];
    if (fieldValue.startsWith('+')) {
        valuesToTry.push(fieldValue.substring(1)); // Remove +
    } else if (/^\d+$/.test(fieldValue)) {
        valuesToTry.push(`+${fieldValue}`); // Add +
    }

    for (const value of valuesToTry) {
        try {
            console.log(`🔍 Finding ManyChat subscriber by Custom Field [${fieldId}]: ${value}`);
            const response = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findByCustomField`, {
                params: {
                    field_id: fieldId,
                    field_value: value
                },
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.data) {
                const resData = response.data.data;
                const candidates = Array.isArray(resData) ? resData : [resData];

                for (const sub of candidates) {
                    if (sub.id && sub.status !== 'deleted') {
                        console.log(`✅ Found ACTIVE ID by Custom Field: ${sub.id} (Value: ${value})`);
                        return sub.id;
                    } else if (sub.id) {
                        console.log(`⚠️ Found ID ${sub.id} by Custom Field but status is '${sub.status}'. Ignoring.`);
                        if (sub.status === 'deleted') continue; // Explicitly continue for clarity
                    }
                }
            }
        } catch (error) {
            // 404 means just not found with this format, try next
            if (error.response && error.response.status !== 404) {
                console.error('Error finding by custom field:', error.response ? error.response.data : error.message);
            }
        }
    }

    console.log(`[ManyChat] Subscriber not found by Custom Field ${fieldId}`);
    return null;
}

/**
 * Find subscriber by Name (Fallback)
 * Returns ARRAY of IDs
 */
export async function findSubscriberByName(fullName, apiToken) {
    try {
        console.log(`🔍 Finding ManyChat subscriber by name: ${fullName}`);
        const response = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findByName`, {
            params: {
                name: fullName
            },
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.data) {
            // Return ALL matching IDs (limit to top 3 for safety)
            const matches = response.data.data.slice(0, 3).map(s => s.id);
            if (matches.length > 0) {
                console.log(`✅ Found ${matches.length} subscribers by name: ${matches.join(', ')}`);
                return matches;
            }
        }
        return [];
    } catch (error) {
        console.error('Error finding subscriber by name:', error.response ? error.response.data : error.message);
        return [];
    }
}

/**
 * Find subscriber by Name and VERIFY by Phone Number
 * This is the fallback for contacts that only have 'whatsapp_phone' and no other fields.
 */
export async function findSubscriberByNameAndVerify(name, targetPhone, apiToken) {
    if (!name || !targetPhone) return null;
    try {
        console.log(`🔍 Strategy: Searching by Name '${name}' then verifying Phone '${targetPhone}'...`);

        // 1. Find candidates by Name
        const candidates = await findSubscriberByName(name, apiToken);
        if (!candidates || candidates.length === 0) return null;

        // Clean target phone (digits only)
        const cleanTarget = targetPhone.replace(/\D/g, '');

        // 2. Iterate and Verify
        for (const id of candidates) {
            try {
                const response = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/getInfo?subscriber_id=${id}`, {
                    headers: { 'Authorization': `Bearer ${apiToken}` }
                });

                const sub = response.data.data;
                if (!sub) continue;

                // Status Check
                if (sub.status === 'deleted') {
                    console.log(`⚠️ Candidate ${id} matches name but is DELETED. Ignoring.`);
                    continue;
                }

                // Phone Check (System Phone OR WhatsApp Phone)
                const phoneA = sub.phone ? sub.phone.replace(/\D/g, '') : '';
                const phoneB = sub.whatsapp_phone ? sub.whatsapp_phone.replace(/\D/g, '') : '';

                if (phoneA.includes(cleanTarget) || phoneB.includes(cleanTarget)) {
                    console.log(`✅ MATCH CONFIRMED! ID ${id} has name '${name}' and phone/wa '${cleanTarget}'.`);
                    return id;
                } else {
                    console.log(`❌ Candidate ${id} has name '${name}' but phones [${phoneA}, ${phoneB}] mismatch target '${cleanTarget}'.`);
                }

            } catch (err) {
                console.error(`Error verifying candidate ${id}:`, err.message);
            }
        }
        return null;

    } catch (error) {
        console.error('Error in Name+Verify Strategy:', error.message);
        return null;
    }
}

/**
 * Update existing subscriber
 */
export async function updateSubscriber(subscriberId, data, apiToken) {
    // ... existing implementation ...
    try {
        console.log(`📝 Updating subscriber ${subscriberId}...`);
        const payload = { subscriber_id: subscriberId, ...data };

        const response = await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/updateSubscriber`, payload, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.status === 'success') {
            console.log(`✅ Subscriber ${subscriberId} updated successfully.`);
            return response.data.data;
        }
        throw new Error(response.data.message || 'Unknown error');
    } catch (error) {
        console.error('Error updating subscriber:', error.response ? error.response.data : error.message);
        throw error;
    }
}

/**
 * Add a tag to a subscriber by Tag Name
 */
export async function addTagByName(subscriberId, tagName, apiToken) {
    // ... existing implementation
    try {
        console.log(`🏷️ Adding tag '${tagName}' to subscriber ${subscriberId}`);
        let tagId = null;
        if (!isNaN(tagName)) {
            tagId = tagName;
        } else {
            const tagsRes = await axios.get(`${MANYCHAT_API_BASE}/fb/page/getTags`, {
                headers: { 'Authorization': `Bearer ${apiToken}` }
            });
            if (tagsRes.data && tagsRes.data.data) {
                const tag = tagsRes.data.data.find(t => t.name === tagName);
                if (tag) tagId = tag.id;
            }
        }

        if (!tagId) throw new Error(`Tag '${tagName}' not found`);

        await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/addTag`, {
            subscriber_id: subscriberId,
            tag_id: tagId
        }, {
            headers: { 'Authorization': `Bearer ${apiToken}` }
        });

        console.log(`✅ Tag added successfully`);
        return true;
    } catch (error) {
        console.error('❌ Error adding tag:', error.response ? error.response.data : error.message);
        throw error;
    }
}

/**
 * Send a Flow to a subscriber
 */
export async function sendFlowToSubscriber(subscriberId, flowId, apiToken) {
    // ... existing implementation
    try {
        console.log(`📨 Sending Flow ${flowId} to ${subscriberId}`);
        await axios.post(`${MANYCHAT_API_BASE}/fb/sending/sendFlow`, {
            subscriber_id: subscriberId,
            flow_ns: flowId
        }, {
            headers: { 'Authorization': `Bearer ${apiToken}` }
        });
        console.log(`✅ Flow sent successfully`);
        return true;
    } catch (error) {
        console.error('❌ Error sending flow:', error.response ? error.response.data : error.message);
        throw error;
    }
}

/**
 * Delete a subscriber (Note: ManyChat Public API might not fully support this, but we attempt it or alternative logic)
 * We will try standard 'deleteSubscriber' or 'unsubscribe' logic if delete is not available.
 * Many users achieve re-triggering by removing and re-adding tags.
 */
export async function deleteSubscriber(subscriberId, apiToken) {
    try {
        console.log(`🗑️ Attempting to delete/unsubscribe subscriber ${subscriberId}...`);
        
        // Attempt to call a delete endpoint if it exists in Manychat API
        try {
            await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/deleteSubscriber`, {
                subscriber_id: subscriberId
            }, {
                headers: { 
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`✅ Subscriber deleted via API`);
        } catch (delErr) {
            console.log(`⚠️ Delete endpoint failed (expected usually), falling back to unsubscribe/wipe...`);
            // Fallback: update subscriber to remove consent or unsubscribe if delete doesn't exist
            await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/updateSubscriber`, {
                subscriber_id: subscriberId,
                has_opt_in_sms: false,
                has_opt_in_email: false,
                phone: null,
                whatsapp_phone: null
            }, {
                headers: { 
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`✅ Subscriber wiped/unsubscribed as fallback`);
        }
        return true;
    } catch (error) {
        console.error('❌ Error deleting/unsubscribing subscriber:', error.response ? error.response.data : error.message);
        // We do not throw because we don't want to stop the flow if delete fails
        return false;
    }
}

/**
 * Remove a tag from a subscriber by Tag Name
 */
export async function removeTagByName(subscriberId, tagName, apiToken) {
    try {
        console.log(`🗑️ Removing tag '${tagName}' from subscriber ${subscriberId}`);
        let tagId = null;
        if (!isNaN(tagName)) {
            tagId = tagName;
        } else {
            const tagsRes = await axios.get(`${MANYCHAT_API_BASE}/fb/page/getTags`, {
                headers: { 'Authorization': `Bearer ${apiToken}` }
            });
            if (tagsRes.data && tagsRes.data.data) {
                const tag = tagsRes.data.data.find(t => t.name === tagName);
                if (tag) tagId = tag.id;
            }
        }

        if (!tagId) {
            console.log(`Tag '${tagName}' not found, nothing to remove.`);
            return true;
        }

        await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/removeTag`, {
            subscriber_id: subscriberId,
            tag_id: tagId
        }, {
            headers: { 'Authorization': `Bearer ${apiToken}` }
        });

        console.log(`✅ Tag removed successfully`);
        return true;
    } catch (error) {
        console.error('❌ Error removing tag (might not have had it):', error.response ? error.response.data : error.message);
        return false;
    }
}

