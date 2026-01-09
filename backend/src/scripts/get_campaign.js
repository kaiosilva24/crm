
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function getCampaign() {
    const { data } = await supabase.from('campaigns').select('id').limit(1).single();
    if (data) console.log('CAMPAIGN_ID:', data.id);
    else console.log('NO_CAMPAIGN');
}

getCampaign();
