const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://crm_banco_de_dados_06xu_user:kaknOV5bi88UUIlJY9bMMgv5rydS7WCS@dpg-d5lrs5koud1c738v8upg-a.oregon-postgres.render.com/crm_banco_de_dados_06xu';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkDatabase() {
    console.log('🔍 Verificando estado do banco de dados...\n');

    try {
        // Verificar usuários
        console.log('👥 Usuários cadastrados:');
        const users = await pool.query('SELECT id, name, email, role FROM users ORDER BY id');
        if (users.rows.length === 0) {
            console.log('   ⚠️  Nenhum usuário encontrado no banco!\n');
            console.log('   💡 Você precisa criar um usuário admin primeiro.\n');
        } else {
            users.rows.forEach(u => {
                console.log(`   - ${u.name} (${u.email}) - Role: ${u.role}`);
            });
            console.log('');
        }

        // Verificar campanhas
        console.log('📊 Campanhas:');
        const campaigns = await pool.query('SELECT COUNT(*) FROM campaigns');
        console.log(`   Total: ${campaigns.rows[0].count}\n`);

        // Verificar leads
        console.log('📋 Leads:');
        const leads = await pool.query('SELECT COUNT(*) FROM leads');
        console.log(`   Total: ${leads.rows[0].count}\n`);

        // Verificar status
        console.log('🏷️  Status de leads:');
        const statuses = await pool.query('SELECT COUNT(*) FROM lead_statuses');
        console.log(`   Total: ${statuses.rows[0].count}\n`);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (users.rows.length === 0) {
            console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
            console.log('   O banco de dados está vazio (sem usuários)!\n');
            console.log('💡 SOLUÇÃO:');
            console.log('   Você tem duas opções:\n');
            console.log('   1. Migrar dados do Supabase antigo');
            console.log('   2. Criar um novo usuário admin\n');
        } else {
            console.log('\n✅ Banco de dados tem usuários!');
            console.log('   O problema pode ser na autenticação.\n');
        }

    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await pool.end();
    }
}

checkDatabase();
