
import { supabase } from './src/database/supabase.js';

async function runMirrorMigration() {
    const cmd = `
    ALTER TABLE public.campaigns
    ADD COLUMN IF NOT EXISTS mirror_campaign_id bigint REFERENCES public.campaigns(id) ON DELETE SET NULL;
    `;

    console.log('🔄 Executando migration para mirror_campaign_id...');
    console.log(`SQL: ${cmd.trim()}`);

    try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: cmd });

        if (error) {
            console.log('⚠️ RPC exec_sql não disponível ou falhou.');
            console.log('Erro:', error.message);
            console.log('\n⚠️ ATENÇÃO: Execute este comando manualmente no Supabase SQL Editor:');
            console.log('━'.repeat(80));
            console.log(cmd.trim());
            console.log('━'.repeat(80));
        } else {
            console.log('✅ Migration aplicada com SUCESSO via RPC!');
        }
    } catch (err) {
        console.error('❌ Erro inesperado:', err);
    }
}

runMirrorMigration();
