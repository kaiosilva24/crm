const { Pool } = require('pg');

// Connection string do PostgreSQL do Render
const DATABASE_URL = 'postgresql://crm_banco_de_dados_06xu_user:kaknOV5bi88UUIlJY9bMMgv5rydS7WCS@dpg-d5lrs5koud1c738v8upg-a.oregon-postgres.render.com/crm_banco_de_dados_06xu';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function setupRoles() {
    console.log('🔧 Configurando roles no PostgreSQL do Render...\n');

    try {
        // Testar conexão
        await pool.query('SELECT NOW()');
        console.log('✅ Conectado ao PostgreSQL!\n');

        // Criar roles
        console.log('📝 Criando roles...');
        await pool.query('CREATE ROLE anon NOLOGIN');
        console.log('   ✅ Role "anon" criada');

        await pool.query('CREATE ROLE service_role NOLOGIN');
        console.log('   ✅ Role "service_role" criada\n');

        // Permissões para anon
        console.log('🔐 Configurando permissões para "anon"...');
        await pool.query('GRANT USAGE ON SCHEMA public TO anon');
        await pool.query('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon');
        await pool.query('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon');
        await pool.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon`);
        await pool.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon`);
        console.log('   ✅ Permissões configuradas\n');

        // Permissões para service_role
        console.log('🔐 Configurando permissões para "service_role"...');
        await pool.query('GRANT ALL ON SCHEMA public TO service_role');
        await pool.query('GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role');
        await pool.query('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role');
        await pool.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role`);
        await pool.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role`);
        console.log('   ✅ Permissões configuradas\n');

        // Verificar roles criadas
        const result = await pool.query(`SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'service_role')`);
        console.log('✅ Roles verificadas:');
        result.rows.forEach(row => console.log(`   - ${row.rolname}`));

        console.log('\n🎉 Configuração concluída com sucesso!');
        console.log('\n📝 Próximo passo: Atualizar backend para usar PostgREST\n');

    } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('⚠️  Roles já existem, pulando criação...');
            console.log('✅ Configuração já estava completa!\n');
        } else {
            console.error('❌ Erro:', err.message);
            throw err;
        }
    } finally {
        await pool.end();
    }
}

setupRoles();
