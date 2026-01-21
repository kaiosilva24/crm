require('dotenv').config({ path: '.env.migration' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Conectar ao Render PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Necessário para Render
    }
});

async function runMigrations() {
    console.log('📋 Executando migrations...\n');

    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort(); // Executar em ordem alfabética

    for (const file of migrationFiles) {
        console.log(`   ⚙️  Executando: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

        try {
            await pool.query(sql);
            console.log(`   ✅ ${file} concluído`);
        } catch (err) {
            // Ignorar erros de "já existe" pois algumas migrations podem ter sido executadas
            if (err.message.includes('already exists') || err.message.includes('duplicate')) {
                console.log(`   ⚠️  ${file} - tabela já existe (ignorado)`);
            } else {
                console.error(`   ❌ Erro em ${file}:`, err.message);
                throw err;
            }
        }
    }

    console.log('\n✅ Migrations concluídas!\n');
}

async function importData() {
    console.log('📥 Importando dados do backup...\n');

    const backupFile = path.join(__dirname, 'supabase-backup.sql');

    if (!fs.existsSync(backupFile)) {
        console.error('❌ Arquivo de backup não encontrado!');
        console.log('Execute primeiro: node database/export-supabase.js');
        process.exit(1);
    }

    const sql = fs.readFileSync(backupFile, 'utf8');

    // Dividir em statements individuais
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('SET'));

    console.log(`   📊 Total de statements: ${statements.length}`);

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
        try {
            await pool.query(statement);
            successCount++;

            // Mostrar progresso a cada 10 statements
            if (successCount % 10 === 0) {
                process.stdout.write(`\r   ✅ Importados: ${successCount}/${statements.length}`);
            }
        } catch (err) {
            errorCount++;
            // Ignorar erros de duplicação (caso execute 2x)
            if (!err.message.includes('duplicate key')) {
                console.error(`\n   ❌ Erro ao importar statement:`, err.message);
            }
        }
    }

    console.log(`\n\n✅ Importação concluída!`);
    console.log(`   - Sucesso: ${successCount}`);
    console.log(`   - Erros: ${errorCount}\n`);
}

async function validateData() {
    console.log('🔍 Validando dados importados...\n');

    const tables = [
        'sellers',
        'campaigns',
        'leads',
        'api_settings',
        'whatsapp_groups',
        'group_participants',
        'whatsapp_auth_state',
        'hotmart_webhooks'
    ];

    const counts = {};

    for (const table of tables) {
        try {
            const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
            counts[table] = parseInt(result.rows[0].count);
            console.log(`   ✅ ${table}: ${counts[table]} registros`);
        } catch (err) {
            console.log(`   ⚠️  ${table}: tabela não existe ou erro`);
            counts[table] = 0;
        }
    }

    console.log('\n✅ Validação concluída!\n');
    return counts;
}

async function importToRender() {
    console.log('🚀 Iniciando importação para Render PostgreSQL...\n');

    try {
        // Testar conexão
        console.log('🔌 Testando conexão...');
        await pool.query('SELECT NOW()');
        console.log('✅ Conexão estabelecida!\n');

        // 1. Executar migrations
        await runMigrations();

        // 2. Importar dados
        await importData();

        // 3. Validar
        const counts = await validateData();

        // Relatório final
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n📊 Resumo:');
        Object.entries(counts).forEach(([table, count]) => {
            console.log(`   - ${table}: ${count} registros`);
        });
        console.log('\n📝 Próximos passos:');
        console.log('   1. Atualizar backend/.env com DATABASE_URL');
        console.log('   2. Instalar dependência: npm install pg');
        console.log('   3. Testar localmente: npm run dev');
        console.log('   4. Atualizar variáveis no Render');
        console.log('\n✅ Consulte MIGRATION_GUIDE.md para detalhes\n');

    } catch (err) {
        console.error('\n❌ Erro durante importação:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Executar importação
importToRender();
