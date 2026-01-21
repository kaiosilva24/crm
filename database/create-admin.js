const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const DATABASE_URL = 'postgresql://crm_banco_de_dados_06xu_user:kaknOV5bi88UUIlJY9bMMgv5rydS7WCS@dpg-d5lrs5koud1c738v8upg-a.oregon-postgres.render.com/crm_banco_de_dados_06xu';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function createAdminUser() {
    console.log('👤 Criando usuário admin...\n');

    const email = 'admin@crm.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await pool.query(`
            INSERT INTO users (name, email, password, role, is_active)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, email, role
        `, ['Admin', email, hashedPassword, 'admin', true]);

        console.log('✅ Usuário admin criado com sucesso!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 CREDENCIAIS DE LOGIN:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   Email: ${email}`);
        console.log(`   Senha: ${password}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('🔐 IMPORTANTE: Altere a senha após o primeiro login!\n');

    } catch (err) {
        if (err.message.includes('duplicate key')) {
            console.log('⚠️  Usuário admin já existe!\n');
            console.log('   Email: admin@crm.com');
            console.log('   Senha: admin123\n');
        } else {
            console.error('❌ Erro:', err.message);
            throw err;
        }
    } finally {
        await pool.end();
    }
}

createAdminUser();
