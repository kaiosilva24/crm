import pkg from 'pg';
const { Client } = pkg;
const c = new Client({ user:'kaio', password:'Whatsapp_2024!', host:'157.151.26.190', port:5432, database:'crm_db', ssl:false });
await c.connect();
const { rows } = await c.query('SELECT id, name, email, role, is_active, password_hash IS NOT NULL as has_hash FROM users ORDER BY id');
console.log('\nUsuários disponíveis no banco Oracle:\n');
rows.forEach(r => {
  console.log(`  ID: ${r.id}`);
  console.log(`  Nome: ${r.name}`);
  console.log(`  Email: ${r.email}`);
  console.log(`  Role: ${r.role}`);
  console.log(`  Ativo: ${r.is_active}`);
  console.log(`  Tem senha: ${r.has_hash}`);
  console.log('');
});
await c.end();
