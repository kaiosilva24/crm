
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkStatus() {
    console.log('🔍 Verificando status das conexões...');
    const { data, error } = await supabase.from('whatsapp_connections').select('*');
    if (error) console.error(error);
    else console.table(data);
}

checkStatus();
