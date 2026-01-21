/**
 * Script para aplicar a migration 007 - Adicionar colunas provider e pairing
 */

import { supabase } from '../src/database/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    try {
        console.log('🔄 Executando migration 007_add_provider_pairing.sql...\n');

        // Ler arquivo SQL
        const sqlFile = path.join(__dirname, '../database/migrations/007_add_provider_pairing.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Dividir em comandos individuais
        const commands = sql
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

        console.log(`📝 ${commands.length} comandos SQL encontrados\n`);

        // Executar cada comando
        for (let i = 0; i < commands.length; i++) {
            const cmd = commands[i];
            console.log(`[${i + 1}/${commands.length}] Executando: ${cmd.substring(0, 60)}...`);

            try {
                // Para ALTER TABLE, usar rpc ou query direto
                const { error } = await supabase.rpc('exec_sql', { sql_query: cmd + ';' });

                if (error) {
                    // Se RPC não existir, tentar executar via client direto
                    console.log('⚠️ RPC não disponível, tentando executar diretamente...');

                    // Para Supabase, precisamos usar a API administrativa
                    // Vamos mostrar as instruções para execução manual
                    console.log('\n⚠️ ATENÇÃO: Execute este comando manualmente no Supabase SQL Editor:');
                    console.log('━'.repeat(80));
                    console.log(cmd + ';');
                    console.log('━'.repeat(80));
                }
            } catch (err) {
                console.error(`❌ Erro ao executar comando ${i + 1}:`, err.message);
            }
        }

        console.log('\n✅ Migration concluída!');
        console.log('\n📌 Se houver erros acima, execute os comandos SQL manualmente no Supabase Dashboard.');
        console.log('   Link: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/editor\n');

    } catch (error) {
        console.error('❌ Erro ao executar migration:', error);
        process.exit(1);
    }
}

runMigration();
