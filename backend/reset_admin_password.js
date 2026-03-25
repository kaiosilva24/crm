import pkg from 'pg';
const { Client } = pkg;
import bcrypt from 'bcryptjs';

const c = new Client({ user:'kaio', password:'Whatsapp_2024!', host:'157.151.26.190', port:5432, database:'crm_db', ssl:false });
await c.connect();

// Redefinir senha do admin para Admin@2024
const novasenha = 'Admin@2024';
const hash = await bcrypt.hash(novasenha, 10);
await c.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'admin@crm.com']);
console.log('✅ Senha do admin redefinida!');
console.log('   Email: admin@crm.com');
console.log('   Nova senha: Admin@2024');

// Testar se funciona
const { rows } = await c.query('SELECT password_hash FROM users WHERE email = $1', ['admin@crm.com']);
const valid = await bcrypt.compare(novasenha, rows[0].password_hash);
console.log('   Verificação:', valid ? '✅ Senha OK' : '❌ Erro');

await c.end();
