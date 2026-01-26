import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkColumn() {
    try {
        const client = await pool.connect();
        try {
            const res = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'campaigns' AND column_name = 'mirror_sales_source_id';
            `);

            if (res.rows.length > 0) {
                console.log('✅ Column mirror_sales_source_id exists!');
                console.log('Type:', res.rows[0].data_type);
            } else {
                console.log('❌ Column mirror_sales_source_id DOES NOT exist.');
            }
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error checking column:', err);
    } finally {
        await pool.end();
    }
}

checkColumn();
