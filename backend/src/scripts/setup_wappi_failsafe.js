import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
CREATE TABLE IF NOT EXISTS wappi_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_token VARCHAR(255) NOT NULL,
    profile_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE wappi_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users on wappi_settings" ON wappi_settings;
CREATE POLICY "Allow all for authenticated users on wappi_settings" ON wappi_settings
    FOR ALL USING (true) WITH CHECK (true);
`;

async function run() {
    console.log('🔄 Executing Migration via RPC...');
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
        console.error('⚠️ RPC Error (exec_sql might be missing):', error.message);
    } else {
        console.log('✅ SQL executed successfully.');
    }

    console.log('🔄 Verifying/Inserting default credentials...');
    // Check if exists
    const { data: existing } = await supabase.from('wappi_settings').select('id').limit(1);

    if (!existing || existing.length === 0) {
        const { error: insertErr } = await supabase.from('wappi_settings').insert({
            api_token: '87043d04cbf75e41c1771d0dd620156b03f15ab1',
            profile_id: 'ece55f82-7cf9'
        });

        if (insertErr) console.error('❌ Insert Error:', insertErr);
        else console.log('✅ Default credentials inserted.');
    } else {
        console.log('ℹ️ Credentials already exist.');
    }
}

run();
