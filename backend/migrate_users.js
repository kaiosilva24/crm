import pkg from 'pg';
const { Client } = pkg;

const SRC = new Client({
  user: 'postgres.otgfcogtttydrmpfcukl',
  password: '#Nk552446#Nk',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

const DST = new Client({
  user: 'kaio',
  password: 'Whatsapp_2024!',
  host: '157.151.26.190',
  port: 5432,
  database: 'crm_db',
  ssl: false,
});

await SRC.connect();
await DST.connect();

// Buscar estrutura real da tabela users do CRM
const { rows: cols } = await SRC.query(`
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users'
  ORDER BY ordinal_position
`);
console.log('Colunas da tabela users:', cols.map(c => c.column_name).join(', '));

// Buscar todos os usuários
const { rows: users } = await SRC.query(`SELECT * FROM public.users ORDER BY id`);
console.log(`\nEncontrados ${users.length} usuários no Supabase:`);
users.forEach(u => {
  const safe = { ...u };
  if (safe.password_hash) safe.password_hash = safe.password_hash.slice(0,20) + '...';
  console.log(`  [${u.id}] ${u.name} <${u.email}> - ${u.role}`);
});

// Garantir que a tabela no Oracle tem a estrutura certa
await DST.query(`DROP TABLE IF EXISTS "users" CASCADE`);
await DST.query(`
  CREATE TABLE "users" (
    "id" SERIAL PRIMARY KEY,
    "uuid" UUID DEFAULT gen_random_uuid(),
    "name" VARCHAR(255),
    "email" VARCHAR(255) UNIQUE,
    "password_hash" TEXT,
    "role" VARCHAR(50) DEFAULT 'seller',
    "is_active" BOOLEAN DEFAULT true,
    "is_in_distribution" BOOLEAN DEFAULT false,
    "distribution_order" INTEGER DEFAULT 0,
    "phone" VARCHAR(50),
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
  )
`);

// Adicionar colunas extras que existem no Supabase
const colNames = cols.map(c => c.column_name);
const extraCols = colNames.filter(c => !['id','uuid','name','email','password_hash','role','is_active','is_in_distribution','distribution_order','phone','avatar_url','created_at','updated_at'].includes(c));
for (const col of extraCols) {
  const colDef = cols.find(c => c.column_name === col);
  let type = colDef.data_type;
  if (type === 'character varying') type = 'TEXT';
  else if (type === 'timestamp with time zone') type = 'TIMESTAMPTZ';
  else if (type === 'integer') type = 'INTEGER';
  else if (type === 'boolean') type = 'BOOLEAN';
  else type = 'TEXT';
  try {
    await DST.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "${col}" ${type}`);
  } catch(e) { /* ignorar se já existe */ }
}

// Inserir usuários um a um (com as colunas que existem)
let migrated = 0;
for (const user of users) {
  const keys = Object.keys(user).filter(k => colNames.includes(k));
  const vals = keys.map(k => {
    const v = user[k];
    if (v === null || v === undefined) return null;
    if (typeof v === 'object' && !(v instanceof Date)) return JSON.stringify(v);
    return v;
  });
  const cols2 = keys.map(k => `"${k}"`).join(', ');
  const placeholders = vals.map((_, i) => `$${i+1}`).join(', ');
  try {
    await DST.query(
      `INSERT INTO users (${cols2}) VALUES (${placeholders}) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, is_active = EXCLUDED.is_active`,
      vals
    );
    migrated++;
  } catch(e) {
    console.error(`  ❌ Erro em ${user.email}: ${e.message}`);
  }
}

console.log(`\n✅ ${migrated}/${users.length} usuários migrados para o Oracle!`);

// Verificar
const { rows: final } = await DST.query('SELECT id, name, email, role, is_active FROM users ORDER BY id');
console.log('\nUsuários no Oracle:');
final.forEach(u => console.log(`  [${u.id}] ${u.name} <${u.email}> - ${u.role} - ${u.is_active ? 'ativo' : 'inativo'}`));

// Atualizar sequência do ID
await DST.query(`SELECT setval(pg_get_serial_sequence('users','id'), (SELECT MAX(id) FROM users))`);
console.log('\n✅ Sequência de IDs ajustada');

await SRC.end();
await DST.end();
