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

async function runSearchTest() {
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

        console.log(`Testing Unknown Search for: ${TARGET_PHONE}`);

        // Test 1: findByName with Number
        // Many systems index phone numbers in the "name" search index
        try {
            const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findByName?name=${TARGET_PHONE}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            results.search_by_name_param = res.data;
        } catch (e) { results.search_by_name_err = e.message; }

        // Test 2: findByName with +Number
        try {
            const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findByName?name=%2B${TARGET_PHONE}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            results.search_by_name_plus_param = res.data;
        } catch (e) { results.search_by_name_plus_err = e.message; }

        fs.writeFileSync('number_search_results.json', JSON.stringify(results, null, 2));
        console.log('Results saved.');

    } catch (error) {
        console.error('Fatal:', error);
    }
}

runSearchTest();
