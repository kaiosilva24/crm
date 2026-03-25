import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

const DST = new Client({
  user: 'kaio', password: 'Whatsapp_2024!',
  host: '157.151.26.190', port: 5432, database: 'crm_db', ssl: false,
});
await DST.connect();

const { rows: tables } = await DST.query(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name
`);

const result = [];
for (const t of tables) {
  const { rows } = await DST.query(`SELECT COUNT(*) FROM "${t.table_name}"`);
  result.push({ table: t.table_name, count: parseInt(rows[0].count) });
}

fs.writeFileSync('oracle_status.json', JSON.stringify(result, null, 2));
console.log('Salvo em oracle_status.json');
console.log('TABELAS COM ZERO REGISTROS (faltando migrar):');
result.filter(r => r.count === 0).forEach(r => console.log(' -', r.table));
console.log('\nTABELAS COM DADOS:');
result.filter(r => r.count > 0).forEach(r => console.log(` ✅ ${r.table}: ${r.count}`));

await DST.end();
