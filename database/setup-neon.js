const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Connection string do Neon (será fornecida pelo usuário)
const DATABASE_URL = process.env.DATABASE_URL || process.argv[2];

if (!DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL não fornecida!');
    console.log('\nUso:');
    console.log('  node database/setup-neon.js "postgresql://user:password@host/database?sslmode=require"');
    console.log('\nOu defina DATABASE_URL no ambiente.');
    process.exit(1);
}

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
    console.log('📋 Executando migrations no Neon PostgreSQL...\n');

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
        'hotmart_webhooks',
        'subcampaigns',
        'import_batches',
        'lead_campaign_groups'
    ];

    for (const table of tables) {
        try {
            const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
            console.log(`   ✅ ${table}: ${result.rows[0].count} registros`);
        } catch (err) {
            console.log(`   ⚠️  ${table}: ${err.message}`);
        }
    }

    console.log('\n✅ Validação concluída!\n');
}

async function setupNeon() {
    console.log('🚀 Configurando Neon PostgreSQL...\n');
    console.log(`📍 Conectando a: ${DATABASE_URL.split('@')[1]?.split('?')[0] || 'Neon'}\n`);

    try {
        // Testar conexão
        console.log('🔌 Testando conexão...');
        const result = await pool.query('SELECT NOW(), version()');
        console.log('✅ Conexão estabelecida!');
        console.log(`   Hora do servidor: ${result.rows[0].now}`);
        console.log(`   Versão: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}\n`);

        // Executar migrations
        await runMigrations();

        // Validar
        await validateSetup();

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 NEON POSTGRESQL CONFIGURADO COM SUCESSO!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n📝 Próximos passos:');
        console.log('   1. Atualizar backend/.env com a DATABASE_URL do Neon');
        console.log('   2. Reiniciar o backend: npm run dev');
        console.log('   3. Testar a aplicação localmente');
        console.log('   4. Atualizar variáveis no Render (produção)');
        console.log('\n✅ Banco pronto para uso!\n');

    } catch (err) {
        console.error('\n❌ Erro durante configuração:', err.message);
        console.error('\nDetalhes:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

setupNeon();
