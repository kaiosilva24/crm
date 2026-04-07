/**
 * test_journey.js — Verifica se a tabela lead_journey_events existe e testa inserção
 * Rodar: node backend/test_journey.js
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('✅ Conectado ao banco!\n');

        // 1. Verificar se tabela existe
        const check = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'lead_journey_events'
            ) AS exists
        `);
        const tableExists = check.rows[0].exists;
        console.log('📋 Tabela lead_journey_events existe?', tableExists ? '✅ SIM' : '❌ NÃO');

        if (!tableExists) {
            console.log('\n⚙️ Criando tabela...');
            await client.query(`
                CREATE TABLE IF NOT EXISTS lead_journey_events (
                    id SERIAL PRIMARY KEY,
                    lead_phone TEXT,
                    lead_email TEXT,
                    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
                    event_type TEXT NOT NULL,
                    event_label TEXT,
                    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
                    campaign_name TEXT,
                    seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    seller_name TEXT,
                    status_id INTEGER REFERENCES lead_statuses(id) ON DELETE SET NULL,
                    status_name TEXT,
                    utm_source   TEXT,
                    utm_medium   TEXT,
                    utm_campaign TEXT,
                    utm_content  TEXT,
                    utm_term     TEXT,
                    metadata JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_journey_phone   ON lead_journey_events(lead_phone);
                CREATE INDEX IF NOT EXISTS idx_journey_lead_id ON lead_journey_events(lead_id);
                CREATE INDEX IF NOT EXISTS idx_journey_type    ON lead_journey_events(event_type);
                CREATE INDEX IF NOT EXISTS idx_journey_created ON lead_journey_events(created_at DESC);
            `);
            console.log('✅ Tabela criada com sucesso!');
        }

        // 2. Contar eventos
        const count = await client.query('SELECT COUNT(*) FROM lead_journey_events');
        console.log(`\n📊 Total de eventos na tabela: ${count.rows[0].count}`);

        // 3. Últimos 5 eventos
        const recent = await client.query(`
            SELECT id, event_type, event_label, seller_name, status_name, created_at
            FROM lead_journey_events
            ORDER BY created_at DESC
            LIMIT 5
        `);
        if (recent.rows.length > 0) {
            console.log('\n🕐 Últimos 5 eventos:');
            recent.rows.forEach(row => {
                console.log(`  [${row.event_type}] ${row.event_label || ''} | seller: ${row.seller_name || '-'} | status: ${row.status_name || '-'} | ${row.created_at}`);
            });
        } else {
            console.log('\n⚠️ Nenhum evento encontrado ainda.');
        }

        // 4. Inserção de teste
        console.log('\n🧪 Testando inserção de evento...');
        const firstLead = await client.query('SELECT id, phone, email FROM leads LIMIT 1');
        if (firstLead.rows.length > 0) {
            const lead = firstLead.rows[0];
            await client.query(`
                INSERT INTO lead_journey_events 
                    (lead_id, lead_phone, lead_email, event_type, event_label, status_name)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [lead.id, lead.phone, lead.email, 'status_change', 'Status alterado: TESTE', 'TEST_STATUS']);
            console.log('✅ Inserção de TESTE OK! (Você verá "TESTE" na jornada do lead ID', lead.id, ')');
        } else {
            console.log('⚠️ Nenhum lead encontrado para teste.');
        }

    } catch (err) {
        console.error('❌ Erro:', err.message);
        if (err.detail) console.error('   Detail:', err.detail);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
