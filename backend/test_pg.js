import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: 'postgres.otgfcogtttydrmpfcukl',
  password: '#Nk552446#Nk',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect()
  .then(() => {
    console.log('Conexão bem-sucedida pelo connection pooler!!!');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Resultado da query:', res.rows[0]);
    client.end();
  })
  .catch(err => {
    console.error('Erro de conexão:', err.message);
    client.end();
  });
