require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testConnection() {
    console.log('🔌 Testando conexão com Render PostgreSQL...\n');

    try {
        // Teste 1: Conexão básica
        const timeResult = await pool.query('SELECT NOW()');
        console.log('✅ Conexão estabelecida!');
        console.log(`   Hora do servidor: ${timeResult.rows[0].now}\n`);

        // Teste 2: Listar tabelas
        const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

        console.log('📋 Tabelas encontradas:');
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        console.log('');

        // Teste 3: Contar registros principais
        const tables = ['sellers', 'campaigns', 'leads', 'api_settings'];
        console.log('📊 Contagem de registros:');

        for (const table of tables) {
            try {
                const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`   - ${table}: ${countResult.rows[0].count} registros`);
            } catch (err) {
                console.log(`   - ${table}: tabela não existe`);
            }
        }

        console.log('\n✅ Teste de conexão concluído com sucesso!');

    } catch (err) {
        console.error('❌ Erro ao conectar:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

testConnection();
