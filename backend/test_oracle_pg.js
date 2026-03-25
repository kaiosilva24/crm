import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: 'kaio',
  password: 'Whatsapp_2024!',
  host: '157.151.26.190',
  port: 5432,
  database: 'crm_db',
  ssl: false,
  connectionTimeoutMillis: 10000,
});

async function testConnection() {
  try {
    console.log('Conectando ao servidor Oracle...');
    await client.connect();
    console.log('✅ Conexão bem-sucedida!');
    
    const timeRes = await client.query('SELECT NOW() as now');
    console.log('🕐 Hora do servidor:', timeRes.rows[0].now);

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesRes.rows.length === 0) {
      console.log('📋 Banco de dados crm_db está VAZIO (sem tabelas ainda). Pronto para receber a importação!');
    } else {
      console.log(`📋 Tabelas existentes no crm_db (${tablesRes.rows.length}):`);
      tablesRes.rows.forEach(r => console.log('  -', r.table_name));
    }
    
    await client.end();
  } catch (err) {
    console.error('❌ Erro de conexão:', err.message);
    await client.end().catch(() => {});
  }
}

testConnection();
