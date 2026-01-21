const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// URL do PostgreSQL do Render (onde o PostgREST está conectado)
const DATABASE_URL = 'postgresql://crm_banco_de_dados_06xu_user:kaknOV5bi88UUIlJY9bMMgv5rydS7WCS@dpg-d5lrs5koud1c738v8upg-a.oregon-postgres.render.com/crm_banco_de_dados_06xu';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
    console.log('🚀 Executando migrations no PostgreSQL do Render...\n');

    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    console.log(`📋 Total de migrations: ${migrationFiles.length}\n`);

    for (const file of migrationFiles) {
        console.log(`⚙️  Executando: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

        try {
            await pool.query(sql);
            console.log(`✅ ${file} concluído`);
        } catch (err) {
            if (err.message.includes('already exists') || err.message.includes('duplicate')) {
                console.log(`⚠️  ${file} - já existe (ignorado)`);
            } else {
                console.error(`❌ Erro em ${file}:`, err.message);
            }
        }
    }

    console.log('\n✅ Migrations concluídas!\n');

    // Verificar tabelas criadas
    console.log('🔍 Verificando tabelas criadas...\n');
    const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
    `);

    console.log('📊 Tabelas no banco:');
    result.rows.forEach(row => console.log(`   - ${row.table_name}`));

    console.log('\n🎉 PostgreSQL do Render configurado com sucesso!\n');

    await pool.end();
}

runMigrations().catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});
