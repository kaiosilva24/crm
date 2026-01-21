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

async function runDiagnosis() {
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
        const ID_USER_SEES = '113526061';
        const ID_WE_FOUND = '859832079';

        // Check ID User Sees
        try {
            const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/getInfo?subscriber_id=${ID_USER_SEES}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            results.user_id_details = res.data.data;
        } catch (e) {
            results.user_id_error = e.message;
        }

        // Check ID We Found
        try {
            const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/getInfo?subscriber_id=${ID_WE_FOUND}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            results.found_id_details = res.data.data;
        } catch (e) {
            results.found_id_error = e.message;
        }

        // Search Phone
        try {
            const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField?phone=${TARGET_PHONE}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            results.search_phone_res = res.data;
        } catch (e) { results.search_phone_err = e.message; }

        // Search WhatsApp Phone
        try {
            const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField?whatsapp_phone=${TARGET_PHONE}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            results.search_whatsapp_res = res.data;
        } catch (e) { results.search_whatsapp_err = e.message; }

        // Search Name
        try {
            const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findByName?name=Suporte Kaio`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            results.search_name_res = res.data;
        } catch (e) { results.search_name_err = e.message; }

        fs.writeFileSync('diagnosis_results.json', JSON.stringify(results, null, 2));
        console.log('Results saved.');

    } catch (error) {
        console.error('Fatal:', error);
    }
}

runDiagnosis();
