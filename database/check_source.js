const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://crm_banco_de_dados_06xu_user:kaknOV5bi88UUIlJY9bMMgv5rydS7WCS@dpg-d5lrs5koud1c738v8upg-a.oregon-postgres.render.com/crm_banco_de_dados_06xu';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    console.log('🔍 Verificando contagem de dados na Origem...');
    try {
        const tables = ['users', 'leads', 'campaigns', 'whatsapp_connections'];

        for (const table of tables) {
            try {
                const res = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
                console.log(`📊 ${table}: ${res.rows[0].count} registros`);
            } catch (err) {
                console.log(`❌ ${table}: Erro ao ler (${err.message})`);
            }
        }
    } catch (err) {
        console.error('Erro de conexão:', err);
    } finally {
        await pool.end();
    }
}

check();
