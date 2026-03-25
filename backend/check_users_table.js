import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

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

// A tabela users real do CRM está em public.whatsapp_connections -> ela tem user_id
// Primeiro, buscar a tabela correta dos usuários do CRM
// Vemos pelo código que tem: id, uuid, name, email, password_hash, role, is_active, is_in_distribution, distribution_order

// Buscar tabelas que têm coluna "role" (característica dos users do CRM)
const { rows: suspects } = await SRC.query(`
  SELECT DISTINCT c.table_name 
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' 
  AND c.column_name IN ('role', 'password_hash', 'is_in_distribution')
  ORDER BY c.table_name
`);
console.log('Tabelas com colunas de user:', suspects.map(r => r.table_name));

// Tentar cada candidata
for (const s of suspects) {
  const { rows } = await SRC.query(`SELECT * FROM "${s.table_name}" LIMIT 3`);
  if (rows.length > 0) {
    console.log(`\n=== ${s.table_name} (${rows.length} amostras) ===`);
    console.log('Colunas:', Object.keys(rows[0]).join(', '));
    rows.forEach(r => {
      // Redact password
      const safe = { ...r };
      if (safe.password_hash) safe.password_hash = '[HASH]';
      console.log(JSON.stringify(safe));
    });
  }
}

// Contar
for (const s of suspects) {
  const { rows: cnt } = await SRC.query(`SELECT COUNT(*) FROM "${s.table_name}"`);
  console.log(`\nTotal em ${s.table_name}: ${cnt[0].count}`);
}

await SRC.end();
await DST.end();
