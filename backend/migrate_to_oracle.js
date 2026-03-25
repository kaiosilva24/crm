/**
 * ============================================================
 * MIGRAÇÃO COMPLETA v2: Supabase → Oracle PostgreSQL
 * - Salva progresso em arquivo para retomar se travar
 * - Inserção em bulk (muito mais rápido)
 * - Timeout e retry por tabela
 * - Pula tabelas já concluídas
 * ============================================================
 */

import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

const PROGRESS_FILE = './migration_progress.json';
const BATCH_SIZE = 200; // menor batch = menos risco de timeout

// ─── CONEXÕES ─────────────────────────────────────────────────
function createSourceClient() {
  return new Client({
    user: 'postgres.otgfcogtttydrmpfcukl',
    password: '#Nk552446#Nk',
    host: 'aws-1-sa-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
    query_timeout: 60000,
    statement_timeout: 60000,
  });
}

function createDestClient() {
  return new Client({
    user: 'kaio',
    password: 'Whatsapp_2024!',
    host: '157.151.26.190',
    port: 5432,
    database: 'crm_db',
    ssl: false,
    connectionTimeoutMillis: 15000,
    query_timeout: 30000,
  });
}

// ─── PROGRESSO ───────────────────────────────────────────────
function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
  } catch(e) {}
  return { completedTables: [], failedTables: [] };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ─── UTILITÁRIOS ─────────────────────────────────────────────
const sep  = () => console.log('─'.repeat(60));
const ok   = (msg) => console.log(`  ✅ ${msg}`);
const warn = (msg) => console.log(`  ⚠️  ${msg}`);
const info = (msg) => console.log(`  ℹ️  ${msg}`);
const err  = (msg) => console.log(`  ❌ ${msg}`);

// ─── LISTA DE TABELAS (respeitar FK order) ───────────────────
const TABLE_ORDER = [
  'users',
  'lead_statuses',
  'campaigns',
  'subcampaigns',
  'leads',
  'lead_campaign_groups',
  'lead_events',
  'lead_audit_logs',
  'settings',
  'api_settings',
  'whatsapp_accounts',
  'whatsapp_messages',
  'whatsapp_campaign_groups',
  'campaign_messages',
  'campaign_sending_logs',
  'manychat_settings',
  'hotmart_products',
  'hotmart_events',
  'hotmart_subscribers',
  'mirror_config',
  'mirror_campaigns',
  'cart_abandonment_settings',
  'cart_abandonment_events',
  'cart_abandonment_logs',
  'distribution_control',
  'exclusion_logs',
  'lead_sync_history',
];

// ─── DDL ─────────────────────────────────────────────────────
async function copyTableSchema(srcClient, destClient, tableName) {
  const { rows: cols } = await srcClient.query(`
    SELECT column_name, data_type, character_maximum_length, is_nullable, column_default, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);

  if (cols.length === 0) return false;

  const colDefs = cols.map(c => {
    let type = c.data_type;
    if (type === 'character varying') type = c.character_maximum_length ? `VARCHAR(${c.character_maximum_length})` : 'TEXT';
    else if (type === 'integer' && c.column_default?.includes('nextval')) type = 'SERIAL';
    else if (type === 'bigint' && c.column_default?.includes('nextval')) type = 'BIGSERIAL';
    else if (type === 'USER-DEFINED') type = 'TEXT';
    else if (type === 'ARRAY') type = 'TEXT[]';
    else if (type === 'timestamp without time zone') type = 'TIMESTAMP';
    else if (type === 'timestamp with time zone') type = 'TIMESTAMPTZ';
    else type = type.toUpperCase();

    const nullable = c.is_nullable === 'YES' ? '' : ' NOT NULL';
    let defVal = '';
    if (c.column_default && !c.column_default.includes('nextval')) {
      let def = c.column_default.replace(/::[a-z_ ]+/gi, '');
      defVal = ` DEFAULT ${def}`;
    }
    return `  "${c.column_name}" ${type}${nullable}${defVal}`;
  });

  const { rows: pks } = await srcClient.query(`
    SELECT kcu.column_name FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public' AND tc.table_name = $1
    ORDER BY kcu.ordinal_position
  `, [tableName]);

  if (pks.length > 0) {
    colDefs.push(`  PRIMARY KEY (${pks.map(p => `"${p.column_name}"`).join(', ')})`);
  }

  const ddl = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n${colDefs.join(',\n')}\n);`;
  await destClient.query(ddl);
  return true;
}

// ─── COPIA DADOS (com bulk insert e retry) ───────────────────
async function copyTableData(tableName, progress) {
  // Pular se já concluída
  if (progress.completedTables.includes(tableName)) {
    info(`${tableName}: já migrada (pulando)`);
    return { copied: 0, errors: 0, skipped: true };
  }

  // Criar clientes novos por tabela (evita timeout de conexão)
  const SRC = createSourceClient();
  const DST = createDestClient();

  try {
    await SRC.connect();
    await DST.connect();

    // Verificar colunas
    const { rows: cols } = await SRC.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    if (cols.length === 0) return { copied: 0, errors: 0 };

    const colNames = cols.map(c => `"${c.column_name}"`).join(', ');

    // Contar total
    const { rows: countRows } = await SRC.query(`SELECT COUNT(*) FROM "${tableName}"`);
    const total = parseInt(countRows[0].count);

    if (total === 0) {
      info(`${tableName}: vazia (0 registros)`);
      progress.completedTables.push(tableName);
      saveProgress(progress);
      return { copied: 0, errors: 0 };
    }

    // Ver quantos já foram inseridos no destino
    let alreadyInserted = 0;
    try {
      const { rows: dstCount } = await DST.query(`SELECT COUNT(*) FROM "${tableName}"`);
      alreadyInserted = parseInt(dstCount[0].count);
    } catch(e) {}

    if (alreadyInserted >= total) {
      info(`${tableName}: já tem ${alreadyInserted}/${total} registros (pulando)`);
      progress.completedTables.push(tableName);
      saveProgress(progress);
      return { copied: alreadyInserted, errors: 0, skipped: true };
    }

    const startOffset = alreadyInserted > 0 ? alreadyInserted : 0;
    if (startOffset > 0) info(`${tableName}: retomando do registro ${startOffset}/${total}`);

    await DST.query(`ALTER TABLE "${tableName}" DISABLE TRIGGER ALL`).catch(() => {});

    let offset = startOffset;
    let totalCopied = alreadyInserted;
    let totalErrors = 0;

    while (offset < total) {
      const { rows } = await SRC.query(
        `SELECT ${colNames} FROM "${tableName}" ORDER BY 1 LIMIT $1 OFFSET $2`,
        [BATCH_SIZE, offset]
      );

      if (rows.length === 0) break;

      // BULK INSERT: montar um INSERT com múltiplas linhas
      try {
        const allValues = [];
        const placeholderGroups = rows.map((row, rowIdx) => {
          const rowPlaceholders = cols.map((c, colIdx) => {
            const val = row[c.column_name];
            if (val === null || val === undefined) {
              allValues.push(null);
            } else if (typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
              allValues.push(JSON.stringify(val));
            } else {
              allValues.push(val);
            }
            return `$${allValues.length}`;
          });
          return `(${rowPlaceholders.join(', ')})`;
        });

        const bulkSql = `INSERT INTO "${tableName}" (${colNames}) VALUES ${placeholderGroups.join(', ')} ON CONFLICT DO NOTHING`;
        await DST.query(bulkSql, allValues);
        totalCopied += rows.length;
      } catch (bulkErr) {
        // Fallback: inserir um por um
        for (const row of rows) {
          try {
            const values = cols.map(c => {
              const val = row[c.column_name];
              if (val === null || val === undefined) return null;
              if (typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) return JSON.stringify(val);
              return val;
            });
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            await DST.query(`INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`, values);
            totalCopied++;
          } catch (rowErr) {
            totalErrors++;
            if (totalErrors <= 3) warn(`Erro em ${tableName}: ${rowErr.message.slice(0, 80)}`);
          }
        }
      }

      offset += BATCH_SIZE;
      const pct = Math.min(100, Math.round((offset / total) * 100));
      process.stdout.write(`\r  📦 ${tableName}: ${pct}% (${Math.min(offset, total)}/${total})`);
    }

    await DST.query(`ALTER TABLE "${tableName}" ENABLE TRIGGER ALL`).catch(() => {});
    process.stdout.write('\n');

    // Marcar como concluída e salvar progresso
    progress.completedTables.push(tableName);
    saveProgress(progress);

    return { copied: totalCopied, errors: totalErrors };
  } finally {
    await SRC.end().catch(() => {});
    await DST.end().catch(() => {});
  }
}

// ─── FK E ÍNDICES ────────────────────────────────────────────
async function copyForeignKeys(srcClient, destClient) {
  const { rows: fks } = await srcClient.query(`
    SELECT tc.table_name, tc.constraint_name, kcu.column_name,
           ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
  `);
  let created = 0;
  for (const fk of fks) {
    try {
      await destClient.query(`
        ALTER TABLE "${fk.table_name}"
        ADD CONSTRAINT "${fk.constraint_name}"
        FOREIGN KEY ("${fk.column_name}")
        REFERENCES "${fk.foreign_table_name}" ("${fk.foreign_column_name}")
        ON DELETE SET NULL
      `);
      created++;
    } catch (e) {
      if (!e.message.includes('already exists')) warn(`FK ${fk.constraint_name}: ${e.message.slice(0,80)}`);
    }
  }
  return created;
}

async function copyIndexes(srcClient, destClient) {
  const { rows: idxs } = await srcClient.query(`
    SELECT indexname, indexdef FROM pg_indexes
    WHERE schemaname = 'public' AND indexname NOT LIKE '%_pkey'
  `);
  let created = 0;
  for (const idx of idxs) {
    try {
      await destClient.query(idx.indexdef);
      created++;
    } catch (e) {
      if (!e.message.includes('already exists')) warn(`Índice ${idx.indexname}: ${e.message.slice(0,80)}`);
    }
  }
  return created;
}

// ─── MAIN ────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 MIGRAÇÃO v2 SUPABASE → ORACLE PostgreSQL\n');

  const progress = loadProgress();
  if (progress.completedTables.length > 0) {
    info(`Retomando migração. Tabelas já concluídas: ${progress.completedTables.join(', ')}`);
  }

  // Conexão principal para DDL e FK
  const SRC_MAIN = createSourceClient();
  const DST_MAIN = createDestClient();
  await SRC_MAIN.connect();
  await DST_MAIN.connect();
  ok('Conexões principais estabelecidas');

  // Descobrir tabelas
  const { rows: allTables } = await SRC_MAIN.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  const existingTables = new Set(allTables.map(r => r.table_name));
  info(`${existingTables.size} tabelas encontradas no Supabase`);

  const orderedTables = [
    ...TABLE_ORDER.filter(t => existingTables.has(t)),
    ...[...existingTables].filter(t => !TABLE_ORDER.includes(t)),
  ];

  // DDL - apenas tabelas não concluídas
  sep();
  console.log('\n🏗️  Criando/verificando estrutura no Oracle...\n');
  for (const table of orderedTables) {
    if (progress.completedTables.includes(table)) {
      info(`${table}: estrutura já existe (pulando DDL)`);
      continue;
    }
    try {
      await copyTableSchema(SRC_MAIN, DST_MAIN, table);
      ok(`Tabela OK: ${table}`);
    } catch (e) {
      if (!e.message.includes('already exists')) err(`DDL ${table}: ${e.message}`);
      else info(`${table}: já existe`);
    }
  }

  await SRC_MAIN.end();
  await DST_MAIN.end();

  // Dados - conexão nova por tabela
  sep();
  console.log('\n📦 Copiando dados (conexão independente por tabela)...\n');

  let totalCopied = 0;
  let totalErrors = 0;
  const results = [];

  for (const table of orderedTables) {
    try {
      const result = await copyTableData(table, progress);
      totalCopied += result.copied || 0;
      totalErrors += result.errors || 0;
      results.push({ table, ...result });
    } catch (e) {
      err(`Erro fatal em ${table}: ${e.message}`);
      results.push({ table, copied: 0, errors: 1 });
    }
  }

  // FKs e Índices
  sep();
  console.log('\n🔗 Criando Foreign Keys e Índices...\n');
  const SRC_FK = createSourceClient();
  const DST_FK = createDestClient();
  await SRC_FK.connect();
  await DST_FK.connect();
  const fksCreated = await copyForeignKeys(SRC_FK, DST_FK);
  ok(`${fksCreated} foreign keys criadas`);
  const idxCreated = await copyIndexes(SRC_FK, DST_FK);
  ok(`${idxCreated} índices criados`);
  await SRC_FK.end();
  await DST_FK.end();

  // Limpar arquivo de progresso após sucesso
  fs.unlinkSync(PROGRESS_FILE);

  // Relatório
  sep();
  console.log('\n📊 RELATÓRIO FINAL:\n');
  console.log(`  Total registros migrados: ${totalCopied}`);
  console.log(`  Total de erros:           ${totalErrors}`);
  console.log('\n  Detalhes por tabela:');
  for (const r of results) {
    const status = r.skipped ? '⏭️ ' : r.errors === 0 ? '✅' : '⚠️ ';
    const note = r.skipped ? '(já migrada)' : `${r.copied} registros, ${r.errors} erros`;
    console.log(`  ${status} ${r.table.padEnd(38)} ${note}`);
  }

  sep();
  if (totalErrors === 0) {
    console.log('\n🎉 Migração concluída com SUCESSO! Banco Oracle está pronto.\n');
  } else {
    console.log('\n⚠️  Migração concluída com avisos. Verifique acima.\n');
  }
}

main().catch(e => {
  console.error('\n❌ ERRO FATAL:', e.message);
  process.exit(1);
});
