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

async function runExploration() {
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

        // 1. Try alternate system fields
        const variations = ['wa_id', 'whatsapp_id', 'whatsapp', 'phone_alt'];
        results.variations = {};

        for (const v of variations) {
            try {
                const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField?${v}=${TARGET_PHONE}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                results.variations[v] = res.data;
            } catch (e) { results.variations[v] = `Error: ${e.response ? e.response.status : e.message}`; }
        }

        // 2. Try POST findByCustomField (sometimes accepts different payloads?)
        // Unlikely but checking docs behavior via guess

        // 3. Try to List Webhooks or other metadata that might have info? No.

        fs.writeFileSync('exploration_results.json', JSON.stringify(results, null, 2));
        console.log('Results saved.');

    } catch (error) {
        console.error('Fatal:', error);
    }
}

runExploration();
