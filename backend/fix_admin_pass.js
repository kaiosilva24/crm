import pkg from 'pg';
import bcrypt from 'bcryptjs';
const { Client } = pkg;

const c = new Client({ user:'kaio', password:'Whatsapp_2024!', host:'157.151.26.190', port:5432, database:'crm_db', ssl:false });
await c.connect();

// Redefinir para admin123
const hash = await bcrypt.hash('admin123', 10);
await c.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'admin@crm.com']);

// Verificar
const { rows } = await c.query('SELECT password_hash FROM users WHERE email = $1', ['admin@crm.com']);
const valid = await bcrypt.compare('admin123', rows[0].password_hash);
console.log('✅ Senha admin123 definida:', valid ? 'OK' : 'ERRO');
await c.end();
