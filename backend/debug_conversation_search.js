import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MANYCHAT_API_BASE = 'https://api.manychat.com';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function runConvTest() {
    const results = {};
    try {
        const { data: settings } = await supabase
            .from('cart_abandonment_settings')
            .select('manychat_api_token')
            .eq('id', 1)
            .single();

        if (!settings?.manychat_api_token) return;

        const token = settings.manychat_api_token;
        const TARGET_PHONE = '5567981720357';

        console.log(`Testing Conversation Search for: ${TARGET_PHONE}`);

        // 1. /fb/conversation/search (GET and POST)
        try {
            const res = await axios.get(`${MANYCHAT_API_BASE}/fb/conversation/search?query=${TARGET_PHONE}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            results.conv_search_get = res.data;
        } catch (e) { results.conv_search_get_err = e.message; }

        // 2. /fb/chat/search
        try {
            const res = await axios.get(`${MANYCHAT_API_BASE}/fb/chat/search?query=${TARGET_PHONE}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            results.chat_search_get = res.data;
        } catch (e) { results.chat_search_get_err = e.message; }

        // 3. /fb/subscriber/findBySystemField as POST (maybe allows whatsapp_phone in body?)
        try {
            const res = await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField`, {
                whatsapp_phone: TARGET_PHONE,
                phone: TARGET_PHONE
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            results.find_post = res.data;
        } catch (e) { results.find_post_err = e.message; }

        fs.writeFileSync('conversation_search_results.json', JSON.stringify(results, null, 2));
        console.log('Results saved.');

    } catch (error) {
        console.error('Fatal:', error);
    }
}

runConvTest();
