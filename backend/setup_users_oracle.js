import pkg from 'pg';
const { Client } = pkg;
import bcrypt from 'bcryptjs';

const DST = new Client({
  user: 'kaio',
  password: 'Whatsapp_2024!',
  host: '157.151.26.190',
  port: 5432,
  database: 'crm_db',
  ssl: false,
});

await DST.connect();

// Criar tabela users (estrutura do CRM)
await DST.query(`
  CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL PRIMARY KEY,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'seller',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_in_distribution" BOOLEAN DEFAULT false,
    "distribution_order" INTEGER DEFAULT 0,
    "phone" VARCHAR(50),
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
  )
`);
console.log('✅ Tabela users criada');

// Verificar se já existem usuários
const { rows: existing } = await DST.query('SELECT COUNT(*) FROM users');
if (parseInt(existing[0].count) > 0) {
  console.log(`ℹ️  Já existem ${existing[0].count} usuários no banco. Nenhum usuário adicionado.`);
} else {
  // Criar usuário admin padrão
  const adminHash = await bcrypt.hash('admin123', 10);
  const sellerHash = await bcrypt.hash('seller123', 10);

  await DST.query(`
    INSERT INTO users (name, email, password_hash, role, is_active, is_in_distribution, distribution_order)
    VALUES
      ('Administrador', 'admin@crm.com', $1, 'admin', true, false, 0),
      ('Vendedor Principal', 'vendedor@crm.com', $2, 'seller', true, true, 1)
  `, [adminHash, sellerHash]);

  console.log('✅ Usuários padrão criados:');
  console.log('   admin@crm.com  (senha: admin123)');
  console.log('   vendedor@crm.com (senha: seller123)');
}

// Mostrar usuários existentes
const { rows: users } = await DST.query('SELECT id, name, email, role, is_active FROM users ORDER BY id');
console.log('\n👥 Usuários no banco:');
users.forEach(u => console.log(`   [${u.id}] ${u.name} <${u.email}> - ${u.role} - ${u.is_active ? 'ativo' : 'inativo'}`));

await DST.end();
