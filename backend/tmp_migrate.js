import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

async function migrate() {
    const pool = new Pool({ 
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

    try {
        console.log('Running migration on manychat_settings...');
        
        await pool.query(`ALTER TABLE manychat_settings ADD COLUMN IF NOT EXISTS campaign_id INTEGER;`);
        await pool.query(`ALTER TABLE manychat_settings ADD COLUMN IF NOT EXISTS prepend_number VARCHAR(10);`);
        await pool.query(`ALTER TABLE manychat_settings ADD COLUMN IF NOT EXISTS custom_name VARCHAR(100);`);
        await pool.query(`ALTER TABLE manychat_settings ADD COLUMN IF NOT EXISTS name_counter INTEGER DEFAULT 1;`);
        
        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
