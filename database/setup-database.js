const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://crm_banco_de_dados_06xu_user:kaknOV5bi88UUIlJY9bMMgv5rydS7WCS@dpg-d5lrs5koud1c738v8upg-a.oregon-postgres.render.com/crm_banco_de_dados_06xu';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
    console.log('🚀 Configurando banco de dados do Render...\n');

    try {
        // 1. Executar schema inicial
        console.log('📋 Criando schema inicial...');
        const initialSchema = fs.readFileSync(path.join(__dirname, '000_initial_schema.sql'), 'utf8');
        await pool.query(initialSchema);
        console.log('✅ Schema inicial criado\n');

        // 2. Executar migrations adicionais
        console.log('📋 Executando migrations adicionais...\n');
        const migrationsDir = path.join(__dirname, 'migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of migrationFiles) {
            console.log(`   ⚙️  ${file}`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

            try {
                await pool.query(sql);
                console.log(`   ✅ Concluído`);
            } catch (err) {
                if (err.message.includes('already exists') || err.message.includes('duplicate')) {
                    console.log(`   ⚠️  Já existe (ignorado)`);
                } else {
                    console.log(`   ⚠️  ${err.message.split('\n')[0]}`);
                }
            }
        }

        console.log('\n✅ Migrations concluídas!\n');

        // 3. Verificar tabelas
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        console.log('📊 Tabelas criadas:');
        tables.rows.forEach(row => console.log(`   - ${row.table_name}`));

        // 4. Verificar usuários
        const users = await pool.query('SELECT COUNT(*) FROM users');
        console.log(`\n👥 Usuários: ${users.rows[0].count}`);

        if (users.rows[0].count === '0') {
            console.log('\n⚠️  Nenhum usuário encontrado!');
            console.log('💡 Você precisa criar um usuário admin para fazer login.\n');
        }

        console.log('\n🎉 Banco de dados configurado com sucesso!\n');

    } catch (err) {
        console.error('❌ Erro:', err.message);
        throw err;
    } finally {
        await pool.end();
    }
}

setupDatabase();
