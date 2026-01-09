
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLeads() {
    console.log('🔍 Checking recent leads...');

    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .like('email', '%@whatsapp.gw')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('❌ Error:', error);
    } else {
        console.log(`✅ Leads found: ${data.length}`);
        data.forEach(l => {
            console.log(`   - ${l.first_name} (${l.phone}) - ${l.created_at}`);
        });
    }
}

checkLeads();
