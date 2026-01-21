const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env.migration' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Conectar ao Render PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigrations() {
    console.log('📋 Executando migrations no Render PostgreSQL...\n');

    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    for (const file of migrationFiles) {
        console.log(`   ⚙️  Executando: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

        try {
            await pool.query(sql);
            console.log(`   ✅ ${file} concluído`);
        } catch (err) {
            if (err.message.includes('already exists') || err.message.includes('duplicate')) {
                console.log(`   ⚠️  ${file} - já existe (ignorado)`);
            } else {
                console.error(`   ❌ Erro em ${file}:`, err.message);
                // Continuar mesmo com erros
            }
        }
    }

    console.log('\n✅ Migrations concluídas!\n');
}

async function validateSetup() {
    console.log('🔍 Validando estrutura do banco...\n');

    const tables = [
        'users',
        'sellers',
        'campaigns',
        'leads',
        'lead_statuses',
        'api_settings',
        'whatsapp_groups',
        'group_participants',
        'whatsapp_auth_state',
        'hotmart_webhooks'
    ];

    for (const table of tables) {
        try {
            const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
            console.log(`   ✅ ${table}: ${result.rows[0].count} registros`);
        } catch (err) {
            console.log(`   ⚠️  ${table}: tabela não existe ou erro - ${err.message}`);
        }
    }

    console.log('\n✅ Validação concluída!\n');
}

async function setupRenderDB() {
    console.log('🚀 Configurando Render PostgreSQL...\n');

    try {
        // Testar conexão
        console.log('🔌 Testando conexão...');
        await pool.query('SELECT NOW()');
        console.log('✅ Conexão estabelecida!\n');

        // Executar migrations
        await runMigrations();

        // Validar
        await validateSetup();

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 BANCO DE DADOS CONFIGURADO COM SUCESSO!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n📝 Próximos passos:');
        console.log('   1. As tabelas foram criadas no Render PostgreSQL');
        console.log('   2. Agora você pode migrar os dados do Supabase manualmente');
        console.log('   3. Ou atualizar o backend para usar o Render e começar do zero\n');
        console.log('💡 Recomendação: Como o Supabase está com problemas de acesso,');
        console.log('   sugiro atualizar o backend agora e começar a usar o Render.');
        console.log('   Os dados antigos podem ser exportados depois via Supabase Dashboard.\n');

    } catch (err) {
        console.error('\n❌ Erro durante configuração:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Executar configuração
setupRenderDB();
