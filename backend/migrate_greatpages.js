import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  await client.connect();
  console.log('Connected to DB.');
  try {
    const result = await client.query(`
      ALTER TABLE api_settings 
      ADD COLUMN IF NOT EXISTS greatpages_integrations JSONB DEFAULT '[]'::jsonb;
    `);
    console.log('Successfully added greatpages_integrations to api_settings.');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await client.end();
    console.log('Connection closed.');
  }
}

run();
