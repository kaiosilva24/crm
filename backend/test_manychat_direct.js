import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

import { 
    findSubscriberByWhatsApp, 
    findSubscriberByPhone, 
    setWhatsAppOptIn, 
    addTagByName, 
    removeTagByName,
    createWhatsAppSubscriber 
} from './src/services/manychatService.js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://otgfcogtttydrmpfcukl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runDirectTest() {
    console.log("🚀 Testing ManyChat Service Directly...");
    
    // 1. Get settings
    const { data: settings } = await supabase.from('manychat_settings').select('*').eq('id', 1).single();
    if (!settings || !settings.manychat_api_token) {
        console.error("❌ Token da API não encontrado no banco.");
        return;
    }
    const apiToken = settings.manychat_api_token;
    const tagName = '[HMS]-[COMPRA]';
    const rawPhone = '+5562999981718';
    const name = 'Kaio Teste IA';
    
    // 2. Try to find subscriber
    console.log(`[TEST] Searching for ${rawPhone}...`);
    let subscriberId = await findSubscriberByWhatsApp(rawPhone, apiToken) || await findSubscriberByPhone(rawPhone, apiToken);
    
    if (subscriberId) {
        console.log(`[TEST] Found Existing Subscriber ID: ${subscriberId}`);
        await setWhatsAppOptIn(subscriberId, rawPhone, apiToken);
        await removeTagByName(subscriberId, tagName, apiToken);
        await addTagByName(subscriberId, tagName, apiToken);
        console.log("✅ Success for EXISTING user! Tag removed and re-added.");
    } else {
        console.log(`[TEST] Subscriber not found. Creating new WhatsApp-only user...`);
        const nameParts = name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        
        try {
            const newId = await createWhatsAppSubscriber(firstName, lastName, rawPhone, 'testeia@crm.com', apiToken);
            console.log(`[TEST] Created ID: ${newId}`);
            if (newId) {
                await addTagByName(newId, tagName, apiToken);
                console.log("✅ Success for NEW user!");
            }
        } catch (e) {
            console.error("❌ Failed to create:", e.message);
        }
    }
}

runDirectTest();
