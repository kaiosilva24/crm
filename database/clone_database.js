const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../backend/.env' }); // Load env from backend if possible, or define below

// CONFIGURAÇÃO
const SOURCE_DB_URL = 'postgresql://crm_banco_de_dados_06xu_user:kaknOV5bi88UUIlJY9bMMgv5rydS7WCS@dpg-d5lrs5koud1c738v8upg-a.oregon-postgres.render.com/crm_banco_de_dados_06xu';

// Credenciais Supabase (TARGET)
// Tenta ler do .env ou usa as strings conhecidas
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nedtihfmhmlqwrhzajmd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZHRpaGZtaG1scXdyaHpham1kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODY3OTg5NywiZXhwIjoyMDI0MjU1ODk3fQ.wMuhXeVvLGOuasTr6P0wVqkynSUI6KR3ouyw0wGgTO4';

// Inicializar clientes
const sourcePool = new Pool({ connectionString: SOURCE_DB_URL, ssl: { rejectUnauthorized: false } });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log(`🔑 Key usada (prefixo): ${SUPABASE_SERVICE_KEY.substring(0, 10)}...`);

async function main() {
    console.log('\n📦 CLONADOR DE BANCO DE DADOS (SUPABASE API MODE)');
    console.log('================================================');
    console.log('Origem: Render Postgres (via pg driver)');
    console.log('Destino: Supabase (via API Service Key)');

    try {
        // 1. Testar conexão Origem
        console.log('\n🔄 Conectando à Origem (Render)...');
        await sourcePool.query('SELECT NOW()');
        console.log('✅ Conexão Origem: OK');

        // 2. Obter lista de tabelas da Origem
        console.log('\n📖 Lendo schema da Origem...');
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            AND table_name != '_prisma_migrations' -- Ignorar prismas se houver
            AND table_name != 'schema_migrations';
        `;
        const tablesRes = await sourcePool.query(tablesQuery);
        const tables = tablesRes.rows.map(r => r.table_name);

        console.log(`📋 Tabelas encontradas: ${tables.join(', ')}`);

        // 3. Definir Ordem de Inserção (Crucial para Foreign Keys)
        // Tabelas independentes primeiro, depois as dependentes
        const priorityOrder = [
            'users',
            'campaigns',
            'whatsapp_connections',
            'whatsapp_groups',
            'lead_statuses',
            'leads',
            'subcampaigns',
            'campaign_groups',
            'group_participants',
            'api_settings',
            'hotmart_settings',
            'hotmart_webhooks' // ou logs
        ];

        tables.sort((a, b) => {
            let idxA = priorityOrder.indexOf(a);
            let idxB = priorityOrder.indexOf(b);
            if (idxA === -1) idxA = 999;
            if (idxB === -1) idxB = 999;
            return idxA - idxB;
        });

        console.log(`\n🔄 Ordem de Clonagem: ${tables.join(' -> ')}`);

        // 4. Loop de Clonagem
        console.log('\n🚀 Iniciando migração de dados...');

        for (const table of tables) {
            console.log(`\n📦 Processando: ${table}`);

            // Ler dados da origem
            const { rows } = await sourcePool.query(`SELECT * FROM "${table}"`);

            if (rows.length === 0) {
                console.log(`   ⚪ Tabela vazia.`);
                continue;
            }

            console.log(`   📥 Lidos: ${rows.length} registros.`);

            // Inserir no destino em lotes (Supabase API tem limites)
            const BATCH_SIZE = 100;
            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < rows.length; i += BATCH_SIZE) {
                const batch = rows.slice(i, i + BATCH_SIZE);

                // Supabase insert
                const { error } = await supabase
                    .from(table)
                    .upsert(batch, { ignoreDuplicates: true }); // Upsert para evitar erro de chave duplicada

                if (error) {
                    if (errorCount === 0) {
                        console.error(`   ❌ PRIMEIRO ERRO DETALHADO:`, JSON.stringify(error, null, 2));
                    }
                    if (error.code === '42P01' || error.message.includes('not found')) {
                        console.error(`   ❌ ERRO CRÍTICO: Tabela '${table}' não encontrada.`);
                        break;
                    } else {
                        console.error(`   ❌ Erro no lote:`, error.message);
                        errorCount += batch.length;
                    }
                } else {
                    successCount += batch.length;
                }
            }

            if (successCount > 0) console.log(`   ✅ Inseridos/Verificados: ${successCount}`);
            if (errorCount > 0) console.log(`   ⚠️  Falhas: ${errorCount}`);
        }

        console.log('\n🎉 Processo finalizado!');

    } catch (err) {
        console.error('\n❌ Erro Geral:', err);
    } finally {
        await sourcePool.end();
    }
}

main();
