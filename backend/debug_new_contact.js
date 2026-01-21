import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MANYCHAT_API_BASE = 'https://api.manychat.com';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkContact() {
    try {
        const { data: settings } = await supabase
            .from('cart_abandonment_settings')
            .select('manychat_api_token')
            .eq('id', 1)
            .single();

        if (!settings?.manychat_api_token) return;

        const token = settings.manychat_api_token;
        const TARGET_PHONE = '5521983134746';
        const FIELD_ID = 12655372;

        console.log(`Searching Custom Field ${FIELD_ID} for: ${TARGET_PHONE}`);

        // Try exact match
        try {
            const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findByCustomField`, {
                params: {
                    field_id: FIELD_ID,
                    field_value: TARGET_PHONE
                },
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data.data) {
                console.log('✅ FOUND by exact match!');
                console.log(JSON.stringify(res.data.data, null, 2));
                return;
            }
        } catch (e) {
            console.log(`Exact match failed: ${e.response ? e.response.status : e.message}`);
        }

        // Try with +
        try {
            const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findByCustomField`, {
                params: {
                    field_id: FIELD_ID,
                    field_value: `+${TARGET_PHONE}`
                },
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data.data) {
                console.log('✅ FOUND by + match!');
                console.log(JSON.stringify(res.data.data, null, 2));
                return;
            }
        } catch (e) {
            console.log(`+ match failed: ${e.response ? e.response.status : e.message}`);
        }

        console.log('❌ NOT FOUND via Custom Field.');

    } catch (error) {
        console.error('Fatal:', error);
    }
}

checkContact();
