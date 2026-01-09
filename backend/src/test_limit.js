
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Credenciais do Supabase não encontradas!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLimit() {
    console.log('🔍 Testando limite de busca do Supabase...');

    // Tentar buscar 2000 leads
    const { data, error, count } = await supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .range(0, 2000);

    if (error) {
        console.error('❌ Erro:', error.message);
    } else {
        console.log(`✅ Leads retornados: ${data.length}`);
        console.log(`📊 Total no banco (count): ${count}`);

        if (data.length > 1000) {
            console.log('🎉 Sucesso! Conseguiu buscar mais de 1000 registros.');
        } else if (count > 1000) {
            console.log('⚠️ Alerta! Existem mais leads, mas o retorno foi limitado a 1000.');
        }
    }
}

testLimit();
