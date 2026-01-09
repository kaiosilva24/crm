import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    try {
        console.log('Applying migration 007_wappi_settings.sql...');
        const sqlPath = path.resolve(__dirname, '../../database/migrations/007_wappi_settings.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Try to run migration via RPC
        const { error: rpcError } = await supabase.rpc('exec_sql', { sql });

        if (rpcError) {
            console.error('RPC Error (might mean helper missing):', rpcError.message);
            console.log('Trying to insert anyway in case table exists...');
        } else {
            console.log('Migration SQL executed successfully via RPC.');
        }

        // Insert credentials
        const { error: finalInsertError } = await supabase
            .from('wappi_settings')
            .insert({
                api_token: '87043d04cbf75e41c1771d0dd620156b03f15ab1',
                profile_id: 'ece55f82-7cf9'
            });

        if (finalInsertError) {
            if (finalInsertError.code === '42P01') {
                console.error('❌ Table wappi_settings does not exist. The migration failed to run.');
                console.log('Please run the following SQL manually in Supabase Dashboard:');
                console.log(sql);
            } else {
                console.error('Error inserting credentials:', finalInsertError);
            }
        }
        else console.log('✅ Wappi Credentials configured successfully.');

    } catch (err) {
        console.error('Error:', err);
    }
}

runMigration();
