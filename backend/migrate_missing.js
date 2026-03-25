/**
 * Script de migração focada nas tabelas críticas que faltaram:
 * campaigns, leads, lead_statuses (checar), import_batches, schedules
 */
import pkg from 'pg';
const { Client } = pkg;

function createSRC() {
  return new Client({
    user: 'postgres.otgfcogtttydrmpfcukl',
    password: '#Nk552446#Nk',
    host: 'aws-1-sa-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
    query_timeout: 60000,
  });
}

function createDST() {
  return new Client({
    user: 'kaio',
    password: 'Whatsapp_2024!',
    host: '157.151.26.190',
    port: 5432,
    database: 'crm_db',
    ssl: false,
    connectionTimeoutMillis: 15000,
  });
}

async function getColumns(client, tableName) {
  const { rows } = await client.query(`
    SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);
  return rows;
}

async function createTable(dst, cols, tableName, pkCols) {
  const colDefs = cols.map(c => {
    let type = c.data_type;
    if (type === 'character varying') type = c.character_maximum_length ? `VARCHAR(${c.character_maximum_length})` : 'TEXT';
    else if (type === 'integer' && c.column_default?.includes('nextval')) type = 'SERIAL';
    else if (type === 'bigint' && c.column_default?.includes('nextval')) type = 'BIGSERIAL';
    else if (type === 'USER-DEFINED') type = 'TEXT';
    else if (type === 'ARRAY') type = 'TEXT[]';
    else if (type === 'timestamp without time zone') type = 'TIMESTAMP';
    else if (type === 'timestamp with time zone') type = 'TIMESTAMPTZ';
    else if (type === 'jsonb' || type === 'json') type = 'JSONB';
    else type = type.toUpperCase();

    const nullable = c.is_nullable === 'YES' ? '' : ' NOT NULL';
    let defVal = '';
    if (c.column_default && !c.column_default.includes('nextval')) {
      let def = c.column_default;
      // Fix uuid functions
      def = def.replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()');
      // Remove Postgres-specific type casts (::text, ::character varying, etc.)
      def = def.replace(/::[a-z_][a-z0-9_ ]*/gi, '');
      // Fix empty array default '{}' which breaks SQL
      if (def.trim() === "'{}'") def = "'{}'::\"text[]\"";
      // Fix empty object default '{}' for jsonb
      if (type === 'JSONB' && def.trim() === "'{}'") def = "'{}'::jsonb";
      // Skip complex defaults that may fail
      if (def.includes('(') && !def.startsWith('gen_random') && !def.startsWith('now') && !def.startsWith('NULL')) {
        def = null;
      }
      if (def) defVal = ` DEFAULT ${def}`;
    }
    return `  "${c.column_name}" ${type}${nullable}${defVal}`;
  });

  if (pkCols.length > 0) {
    colDefs.push(`  PRIMARY KEY (${pkCols.map(p => `"${p}"`).join(', ')})`);
  }

  const ddl = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n${colDefs.join(',\n')}\n)`;
  await dst.query(ddl);
}

async function migrateTable(tableName) {
  const src = createSRC();
  const dst = createDST();
  await src.connect();
  await dst.connect();

  try {
    // Verificar se já tem dados
    let existingCount = 0;
    try {
      const { rows } = await dst.query(`SELECT COUNT(*) FROM "${tableName}"`);
      existingCount = parseInt(rows[0].count);
    } catch(e) {}

    if (existingCount > 0) {
      console.log(`  ⏭️  ${tableName}: já tem ${existingCount} registros (pulando)`);
      return { copied: existingCount, errors: 0 };
    }

    // Obter colunas
    const cols = await getColumns(src, tableName);
    if (cols.length === 0) {
      console.log(`  ⚠️  ${tableName}: não encontrada no Supabase`);
      return { copied: 0, errors: 0 };
    }

    // Obter PKs
    const { rows: pks } = await src.query(`
      SELECT kcu.column_name FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public' AND tc.table_name = $1
      ORDER BY kcu.ordinal_position
    `, [tableName]);

    // Criar tabela
    await createTable(dst, cols, tableName, pks.map(p => p.column_name));
    console.log(`  🏗️  ${tableName}: tabela criada`);

    // Contar registros na origem
    const { rows: countRows } = await src.query(`SELECT COUNT(*) FROM "${tableName}"`);
    const total = parseInt(countRows[0].count);

    if (total === 0) {
      console.log(`  ℹ️  ${tableName}: vazia (0 registros)`);
      return { copied: 0, errors: 0 };
    }

    const colNames = cols.map(c => `"${c.column_name}"`).join(', ');
    const BATCH = 200;
    let offset = 0;
    let copied = 0;
    let errors = 0;

    await dst.query(`ALTER TABLE "${tableName}" DISABLE TRIGGER ALL`).catch(() => {});

    while (offset < total) {
      const { rows } = await src.query(
        `SELECT ${colNames} FROM "${tableName}" ORDER BY 1 LIMIT $1 OFFSET $2`,
        [BATCH, offset]
      );
      if (rows.length === 0) break;

      try {
        const allVals = [];
        const placeholderGroups = rows.map(row => {
          const rowPH = cols.map(c => {
            const v = row[c.column_name];
            if (v === null || v === undefined) { allVals.push(null); }
            else if (typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) { allVals.push(JSON.stringify(v)); }
            else { allVals.push(v); }
            return `$${allVals.length}`;
          });
          return `(${rowPH.join(', ')})`;
        });
        await dst.query(
          `INSERT INTO "${tableName}" (${colNames}) VALUES ${placeholderGroups.join(', ')} ON CONFLICT DO NOTHING`,
          allVals
        );
        copied += rows.length;
      } catch(bulkErr) {
        for (const row of rows) {
          try {
            const vals = cols.map(c => {
              const v = row[c.column_name];
              if (v === null || v === undefined) return null;
              if (typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) return JSON.stringify(v);
              return v;
            });
            const phs = vals.map((_, i) => `$${i+1}`).join(', ');
            await dst.query(`INSERT INTO "${tableName}" (${colNames}) VALUES (${phs}) ON CONFLICT DO NOTHING`, vals);
            copied++;
          } catch(e) { errors++; }
        }
      }

      offset += BATCH;
      process.stdout.write(`\r  📦 ${tableName}: ${Math.min(100,Math.round(offset/total*100))}% (${Math.min(offset,total)}/${total})`);
    }

    await dst.query(`ALTER TABLE "${tableName}" ENABLE TRIGGER ALL`).catch(() => {});
    process.stdout.write('\n');

    // Ajustar sequências de ID
    try {
      await dst.query(`SELECT setval(pg_get_serial_sequence('"${tableName}"','id'), COALESCE((SELECT MAX(id) FROM "${tableName}"), 1))`);
    } catch(e) {}

    return { copied, errors };
  } finally {
    await src.end().catch(() => {});
    await dst.end().catch(() => {});
  }
}

// Tabelas críticas que faltam (em ordem de dependência FK)
const MISSING_TABLES = [
  'campaigns',
  'subcampaigns',
  'leads',
  'import_batches',
  'schedules',
  'lead_events',
  'lead_audit_logs',
  'settings',
  'whatsapp_accounts',
  'whatsapp_messages',
  'campaign_messages',
  'campaign_sending_logs',
  'whatsapp_templates',
];

console.log('\n🔧 Migrando tabelas faltantes...\n');
let total = 0;
for (const table of MISSING_TABLES) {
  try {
    const res = await migrateTable(table);
    total += res.copied;
    if (res.errors > 0) console.log(`  ⚠️  ${table}: ${res.errors} erros`);
  } catch(e) {
    console.error(`  ❌ ${table}: ${e.message}`);
  }
}
console.log(`\n✅ Total adicional migrado: ${total} registros`);

// Ajustar sequências de todas as tabelas de uma vez
const fix = createDST();
await fix.connect();
const { rows: seqTables } = await fix.query(`
  SELECT t.table_name
  FROM information_schema.tables t
  JOIN information_schema.columns c ON t.table_name = c.table_name AND c.table_schema = 'public'
  WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE' AND c.column_name = 'id'
  AND c.column_default LIKE 'nextval%'
`);
for (const { table_name } of seqTables) {
  try {
    await fix.query(`SELECT setval(pg_get_serial_sequence('"${table_name}"','id'), COALESCE((SELECT MAX(id) FROM "${table_name}"),1))`);
  } catch(e) {}
}
console.log(`✅ Sequências ajustadas para ${seqTables.length} tabelas`);
await fix.end();
