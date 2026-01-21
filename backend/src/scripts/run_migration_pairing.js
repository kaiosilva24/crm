import { supabase } from '../database/supabase.js';

async function runMigration() {
    console.log('🔄 Executando migration: 004_pairing_code.sql');

    try {
        // Verificar se as colunas já existem
        const { data: existingColumns, error: checkError } = await supabase.rpc('exec_sql', {
            sql: `
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'whatsapp_connections' 
                AND column_name IN ('pairing_code', 'pairing_phone');
            `
        });

        if (existingColumns && existingColumns.length >= 2) {
            console.log('✅ Migration já executada! Colunas já existem.');
            return;
        }

        // Executar migration
        const migrationSQL = `
            ALTER TABLE whatsapp_connections 
            ADD COLUMN IF NOT EXISTS pairing_code VARCHAR(10),
            ADD COLUMN IF NOT EXISTS pairing_phone VARCHAR(20);
        `;

        // Usar SQL direto (sem RPC, via client do Supabase)
        const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

        if (error) {
            console.error('❌ Erro ao executar migration:', error);
            console.log('\n📋 Execute manualmente no Supabase SQL Editor:');
            console.log(migrationSQL);
            process.exit(1);
        }

        console.log('✅ Migration executada com sucesso!');
        console.log('✅ Colunas pairing_code e pairing_phone adicionadas');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.log('\n📋 SOLUÇÃO: Execute manualmente no Supabase SQL Editor:');
        console.log(`
ALTER TABLE whatsapp_connections 
ADD COLUMN IF NOT EXISTS pairing_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS pairing_phone VARCHAR(20);
        `);
        console.log('\n🌐 Acesse: https://supabase.com/dashboard/project/_/sql');
        process.exit(1);
    }

    process.exit(0);
}

runMigration();
