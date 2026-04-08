import pg from 'pg';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function getToken() {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const { rows } = await client.query(`SELECT manychat_api_token FROM manychat_settings WHERE manychat_api_token IS NOT NULL LIMIT 1`);
    await client.end();
    return rows[0]?.manychat_api_token;
}

async function run() {
    const token = await getToken();
    console.log(`\n🔑 Token: ${token.slice(0, 20)}...\n`);

    // Tentar vários endpoints possíveis para listar custom fields
    const endpoints = [
        '/fb/data/getFields',
        '/fb/page/getCustomFields', 
        '/fb/data/getCustomFields',
        '/fb/subscriber/getCustomFields',
        '/fb/page/getTags'  // só pra confirmar que o token funciona
    ];

    for (const ep of endpoints) {
        try {
            const response = await axios.get(`https://api.manychat.com${ep}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`\n✅ [${ep}] OK!`);
            if (response.data?.data) {
                const items = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
                items.slice(0, 20).forEach(f => {
                    console.log(`  ID: ${f.id || '?'} | Nome: "${f.name}" | Tipo: ${f.type || '?'}`);
                });
            }
        } catch (err) {
            const status = err.response?.status;
            const msg = err.response?.data?.message || err.message;
            console.log(`  ❌ [${ep}] ${status}: ${msg?.slice(0, 100)}`);
        }
    }
}

run().catch(err => console.error('Erro:', err.response?.data || err.message));
