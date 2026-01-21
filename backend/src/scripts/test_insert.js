
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('🧪 Testing insert...');

    // Simulando exatamente o objeto que estamos tentando inserir
    const leadData = {
        uuid: uuidv4(),
        phone: '5511999999999',
        first_name: '5511999999999',
        campaign_id: 1, // Assume existing or fails foreign key (but we want not-null check)
        in_group: true,
        status_id: 1,
        product_name: 'Produto Desconhecido',
        source: 'test',
        created_at: new Date().toISOString()
    };

    console.log('📝 Data:', leadData);

    const { data, error } = await supabase
        .from('leads')
        .insert(leadData)
        .select();

    if (error) {
        console.log('Error occurred, writing to file...');
        const fs = await import('fs');
        fs.writeFileSync('error_log.json', JSON.stringify(error, null, 2));
    } else {
        console.log('✅ Success:', data);
    }
}

testInsert();
