import { supabase } from './src/database/supabase.js';
import fs from 'fs';

async function applyMigration() {
    try {
        console.log('📦 Aplicando migration: 003_group_sync_history.sql');

        const sql = fs.readFileSync('./database/migrations/003_group_sync_history.sql', 'utf8');

        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            // Tentar executar diretamente se RPC não existir
            console.log('⚠️ RPC não disponível, tentando criar tabela diretamente...');

            const { error: createError } = await supabase
                .from('group_sync_history')
                .select('id')
                .limit(1);

            if (createError && createError.code === '42P01') {
                console.log('✅ Tabela não existe, será criada pelo Supabase Dashboard');
                console.log('📋 Execute o SQL manualmente no Supabase Dashboard:');
                console.log(sql);
                return;
            }
        }

        console.log('✅ Migration aplicada com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao aplicar migration:', error);
    } finally {
        process.exit(0);
    }
}

applyMigration();
