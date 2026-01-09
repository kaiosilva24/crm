import { supabase } from '../database/supabase.js';

async function checkMigration() {
    console.log('🔍 Verificando se a migration foi executada...\n');

    try {
        // Tentar fazer um UPDATE com as novas colunas
        const { data, error } = await supabase
            .from('whatsapp_connections')
            .select('id, name, pairing_code, pairing_phone')
            .limit(1);

        if (error) {
            console.log('❌ ERRO! As colunas NÃO existem!\n');
            console.log('Erro:', error.message);
            console.log('\n📋 VOCÊ PRECISA EXECUTAR ESTA SQL NO SUPABASE:\n');
            console.log('ALTER TABLE whatsapp_connections');
            console.log('ADD COLUMN IF NOT EXISTS pairing_code VARCHAR(10),');
            console.log('ADD COLUMN IF NOT EXISTS pairing_phone VARCHAR(20);');
            console.log('\n🌐 Acesse: https://supabase.com/dashboard → SQL Editor\n');
            process.exit(1);
        }

        console.log('✅ Migration OK! As colunas existem!');
        console.log('Colunas encontradas: id, name, pairing_code, pairing_phone\n');

    } catch (error) {
        console.error('❌ Erro ao verificar:', error);
    }

    process.exit(0);
}

checkMigration();
