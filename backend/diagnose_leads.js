import pkg from 'pg';
import fs from 'fs';
const { Client } = pkg;

const c = new Client({ user:'kaio', password:'Whatsapp_2024!', host:'157.151.26.190', port:5432, database:'crm_db', ssl:false });
await c.connect();

const { rows: cols } = await c.query(`
  SELECT column_name FROM information_schema.columns
  WHERE table_schema='public' AND table_name='leads' ORDER BY ordinal_position
`);
const colNames = cols.map(c => c.column_name);

const out = { columns: colNames };

if (colNames.includes('is_active')) {
  const { rows } = await c.query(`SELECT is_active, COUNT(*) cnt FROM leads GROUP BY is_active`);
  out.is_active_dist = rows;
}

const { rows: cnt } = await c.query(`SELECT COUNT(*) total, COUNT(campaign_id) com_camp FROM leads`);
out.total = cnt[0];

const { rows: s } = await c.query(`SELECT id, campaign_id, status_id, seller_id FROM leads WHERE campaign_id IS NOT NULL LIMIT 3`);
out.sample = s;

fs.writeFileSync('diag.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await c.end();
