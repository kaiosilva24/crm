/**
 * Script de migration — versão com log em arquivo para debug
 */

import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATABASE_URL = 'postgres://kaio:Whatsapp_2024!@157.151.26.190:5432/crm_db';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: false,
    connectionTimeoutMillis: 20000,
});

const logFile = path.resolve(__dirname, 'migration_log.txt');
const log = (msg) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    fs.appendFileSync(logFile, line + '\n');
};

fs.writeFileSync(logFile, '=== MIGRATION LOG ===\n');

async function run() {
    log('Iniciando conexao com o banco...');
    let client;
    try {
        client = await pool.connect();
        log('Conectado!');

        const sqlPath = path.resolve(__dirname, 'backend/src/database/migrations/create_lead_journey_events.sql');
        log(`Lendo SQL: ${sqlPath}`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        log('Executando SQL...');

        // Executar a migration toda de uma vez
        await client.query(sql);
        log(`  OK`);

        log('Verificando tabela...');
        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'lead_journey_events'
            ORDER BY ordinal_position
        `);
        
        if (result.rows.length > 0) {
            log(`SUCESSO! Tabela lead_journey_events tem ${result.rows.length} colunas:`);
            result.rows.forEach(c => log(`  - ${c.column_name} (${c.data_type})`));
        } else {
            log('ATENCAO: Tabela nao encontrada!');
        }

    } catch (err) {
        log(`FALHA GERAL: ${err.message}`);
        log(`Stack: ${err.stack}`);
    } finally {
        if (client) client.release();
        await pool.end();
        log('Conexao encerrada.');
    }
}

run();
