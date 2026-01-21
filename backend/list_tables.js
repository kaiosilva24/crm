import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function listTables() {
    console.log('📋 Listando tabelas no banco de dados...\n');

    try {
        // Tentar algumas tabelas comuns
        const tables = [
            'cart_abandonment_events',
            'cart_abandonment_settings',
            'cart_abandonment_logs',
            'leads',
            'campaigns',
            'users'
        ];

        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                console.log(`❌ ${table}: NÃO EXISTE`);
            } else {
                console.log(`✅ ${table}: EXISTE (${data ? data.length : 0} registros encontrados)`);
            }
        }

    } catch (err) {
        console.log('❌ Erro:', err.message);
    }
}

listTables();
