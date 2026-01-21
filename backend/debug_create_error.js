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

async function runCreateErrorTest() {
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

        // Attempt creation to force error
        console.log(`Forcing Creation Error for: ${TARGET_PHONE}`);

        const payload = {
            first_name: 'Teste',
            last_name: 'Erro',
            phone: `+${TARGET_PHONE}`,
            whatsapp_phone: `+${TARGET_PHONE}`,
            has_opt_in_sms: true,
            has_opt_in_email: true,
            consent_phrase: "Debug Test"
        };

        try {
            const response = await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/createSubscriber`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            results.success_unexpected = response.data;
        } catch (error) {
            console.log('Error caught!');
            if (error.response) {
                results.error_response = {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers
                };
            } else {
                results.error_message = error.message;
            }
        }

        fs.writeFileSync('create_error_details.json', JSON.stringify(results, null, 2));
        console.log('Results saved.');

    } catch (error) {
        console.error('Fatal:', error);
    }
}

runCreateErrorTest();
