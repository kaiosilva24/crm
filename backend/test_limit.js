
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLimit() {
    console.log('🧪 Testing Supabase Query Limit...');

    try {
        // 1. Get all campaigns
        const { data: campaigns, error: campError } = await supabase
            .from('campaigns')
            .select('id, name');

        if (campError) throw campError;
        console.log(`found ${campaigns.length} campaigns`);

        for (const camp of campaigns) {
            console.log(`\nChecking Campaign: ${camp.name} (ID: ${camp.id})`);

            // 2. Count exact
            const { count, error: countError } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('campaign_id', camp.id);

            if (countError) console.error(countError);
            console.log(`   - Total Count (DB): ${count}`);

            // 3. Fetch with default limit (usually 1000)
            const { data: defaultData } = await supabase
                .from('leads')
                .select('id')
                .eq('campaign_id', camp.id);
            console.log(`   - Default fetch length: ${defaultData?.length}`);

            // 4. Fetch with range 0-100000
            const { data: rangeData, error: rangeError } = await supabase
                .from('leads')
                .select('id')
                .eq('campaign_id', camp.id)
                .range(0, 100000);

            if (rangeError) console.error(rangeError);
            console.log(`   - Range(0, 100000) length: ${rangeData?.length}`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testLimit();
