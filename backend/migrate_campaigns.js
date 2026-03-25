import pkg from 'pg';
const { Client } = pkg;

const SRC = new Client({
  user: 'postgres.otgfcogtttydrmpfcukl', password: '#Nk552446#Nk',
  host: 'aws-1-sa-east-1.pooler.supabase.com', port: 6543,
  database: 'postgres', ssl: { rejectUnauthorized: false },
});

const DST = new Client({
  user: 'kaio', password: 'Whatsapp_2024!',
  host: '157.151.26.190', port: 5432, database: 'crm_db', ssl: false,
});

await SRC.connect();
await DST.connect();

// Ver estrutura exata de campaigns
const { rows: cols } = await SRC.query(`
  SELECT column_name, data_type, character_maximum_length, is_nullable, column_default, udt_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'campaigns'
  ORDER BY ordinal_position
`);

console.log('Colunas de campaigns:');
cols.forEach(c => console.log(`  ${c.column_name} | ${c.data_type} | default: ${c.column_default}`));

// Contar
const { rows: cnt } = await SRC.query(`SELECT COUNT(*) FROM campaigns`);
console.log('\nTotal:', cnt[0].count);

// Criar tabela manualmente com DDL seguro
await DST.query(`DROP TABLE IF EXISTS "campaigns" CASCADE`);
await DST.query(`
  CREATE TABLE "campaigns" (
    "id" SERIAL PRIMARY KEY,
    "uuid" UUID DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "whatsapp_group_id" TEXT,
    "whatsapp_group_name" TEXT,
    "auto_add_to_group" BOOLEAN DEFAULT false,
    "group_message" TEXT,
    "group_ids" TEXT,
    "settings" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
  )
`);
console.log('\n✅ Tabela campaigns criada (DDL manual)');

// Buscar dados e ver as colunas reais
const { rows: sample } = await SRC.query(`SELECT * FROM campaigns LIMIT 2`);
if (sample.length > 0) {
  console.log('Colunas reais do Supabase:', Object.keys(sample[0]).join(', '));
}

// Migrar dados adaptando as colunas
const { rows: all } = await SRC.query(`SELECT * FROM campaigns ORDER BY id`);
console.log(`\nMigrando ${all.length} campanhas...`);

for (const row of all) {
  try {
    // Colunas base que sempre existem
    await DST.query(`
      INSERT INTO campaigns (id, uuid, name, description, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING
    `, [
      row.id,
      row.uuid,
      row.name,
      row.description || null,
      row.is_active !== undefined ? row.is_active : true,
      row.created_at || new Date(),
      row.updated_at || new Date(),
    ]);

    // Adicionar colunas extras dinamicamente
    const extraCols = Object.keys(row).filter(k => !['id','uuid','name','description','is_active','created_at','updated_at'].includes(k));
    for (const col of extraCols) {
      if (row[col] === null || row[col] === undefined) continue;
      try {
        // Tentar adicionar coluna se não existe
        let val = row[col];
        if (typeof val === 'object' && !(val instanceof Date)) val = JSON.stringify(val);
        await DST.query(`
          ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS "${col}" TEXT
        `).catch(() => {});
        await DST.query(`UPDATE campaigns SET "${col}" = $1 WHERE id = $2`, [String(val), row.id]);
      } catch(e2) { /* ignorar */ }
    }

    console.log(`  ✅ campanha [${row.id}] ${row.name}`);
  } catch(e) {
    console.error(`  ❌ campanha [${row.id}]: ${e.message}`);
  }
}

// Ajustar sequência
await DST.query(`SELECT setval(pg_get_serial_sequence('"campaigns"','id'), COALESCE((SELECT MAX(id) FROM campaigns),1))`);
console.log('\n✅ Migração de campaigns concluída!');

await SRC.end();
await DST.end();
