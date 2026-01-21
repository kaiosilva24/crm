const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env.migration' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Lista de todas as tabelas do CRM
const TABLES = [
    'sellers',
    'campaigns',
    'leads',
    'api_settings',
    'whatsapp_groups',
    'group_participants',
    'whatsapp_auth_state',
    'hotmart_webhooks'
];

async function exportTable(tableName) {
    console.log(`📦 Exportando tabela: ${tableName}...`);

    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*');

        if (error) {
            console.error(`❌ Erro ao exportar ${tableName}:`, error);
            return null;
        }

        console.log(`✅ ${tableName}: ${data.length} registros`);
        return { tableName, data };
    } catch (err) {
        console.error(`❌ Erro ao exportar ${tableName}:`, err);
        return null;
    }
}

function generateInsertSQL(tableName, records) {
    if (!records || records.length === 0) {
        return `-- Tabela ${tableName} está vazia\n`;
    }

    let sql = `\n-- Dados da tabela: ${tableName}\n`;

    for (const record of records) {
        const columns = Object.keys(record);
        const values = columns.map(col => {
            const val = record[col];

            if (val === null || val === undefined) {
                return 'NULL';
            }

            if (typeof val === 'string') {
                // Escapar aspas simples
                return `'${val.replace(/'/g, "''")}'`;
            }

            if (typeof val === 'boolean') {
                return val ? 'TRUE' : 'FALSE';
            }

            if (val instanceof Date) {
                return `'${val.toISOString()}'`;
            }

            if (typeof val === 'object') {
                return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            }

            return val;
        });

        sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
    }

    return sql;
}

async function exportSupabase() {
    console.log('🚀 Iniciando exportação do Supabase...\n');

    const backupFile = path.join(__dirname, 'supabase-backup.sql');
    let sqlContent = `-- Backup do Supabase CRM
-- Data: ${new Date().toISOString()}
-- 
-- IMPORTANTE: Este arquivo contém apenas os DADOS (INSERT statements)
-- O schema (CREATE TABLE) será criado pelas migrations existentes
--

SET client_encoding = 'UTF8';

`;

    const exportResults = [];

    // Exportar cada tabela
    for (const table of TABLES) {
        const result = await exportTable(table);
        if (result) {
            exportResults.push(result);
        }
    }

    // Gerar SQL de INSERT para cada tabela
    for (const { tableName, data } of exportResults) {
        sqlContent += generateInsertSQL(tableName, data);
    }

    // Salvar arquivo
    fs.writeFileSync(backupFile, sqlContent, 'utf8');

    console.log('\n✅ Exportação concluída!');
    console.log(`📄 Arquivo salvo em: ${backupFile}`);
    console.log(`📊 Tamanho: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);

    // Resumo
    console.log('\n📊 Resumo da exportação:');
    for (const { tableName, data } of exportResults) {
        console.log(`   - ${tableName}: ${data.length} registros`);
    }

    console.log('\n🎉 Backup criado com sucesso!');
    console.log('📝 Próximo passo: Execute node database/import-to-render.js');
}

// Executar exportação
exportSupabase().catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});
