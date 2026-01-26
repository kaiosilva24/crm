import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, '..', 'database', 'migrations', '001_add_mirror_sales_source.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration:', sqlPath);
        console.log('SQL:', sql);

        const client = await pool.connect();
        try {
            await client.query(sql);
            console.log('✅ Migration applied successfully');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
