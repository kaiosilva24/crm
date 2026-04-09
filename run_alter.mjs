import('./backend/src/database/pg-adapter.js').then(({ getPool }) => getPool().query(`
ALTER TABLE hotmart_webhook_configs ADD COLUMN platform_name VARCHAR(100) DEFAULT 'hotmart';
`).then(() => { console.log('OK'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); })).catch(e => { console.error(e); process.exit(1); });
