/**
 * Teste de busca ManyChat por wa_id
 * Testa todos os endpoints e formatos possíveis para encontrar
 * um contato que já existe mas não é encontrado via findBySystemField
 */
import pg from 'pg';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const MANYCHAT_API_BASE = 'https://api.manychat.com';
const TEST_PHONE = '5562999981718'; // O número que deu erro

async function getTokenFromDB() {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const { rows } = await client.query(
        `SELECT manychat_api_token FROM manychat_settings WHERE manychat_api_token IS NOT NULL LIMIT 1`
    );
    await client.end();
    if (!rows[0]?.manychat_api_token) throw new Error('Token não encontrado no banco!');
    return rows[0].manychat_api_token;
}

async function testEndpoint(name, url, params, token) {
    try {
        const response = await axios.get(url, {
            params,
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        const data = response.data;
        const found = data?.data?.id || (Array.isArray(data?.data) && data.data.length > 0);
        console.log(`  ${found ? '✅' : '⚠️ '} [${name}] Status: ${data.status} | Resultado: ${JSON.stringify(data?.data)?.slice(0, 200)}`);
        return found ? data.data : null;
    } catch (err) {
        const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
        console.log(`  ❌ [${name}] ERRO: ${msg?.slice(0, 200)}`);
        return null;
    }
}

async function run() {
    console.log('\n🔑 Buscando token ManyChat no banco...');
    const token = await getTokenFromDB();
    console.log(`✅ Token obtido: ${token.slice(0, 20)}...\n`);

    const clean = TEST_PHONE.replace(/\D/g, '');
    const sem55 = clean.slice(2);      // ex: 62999981718
    const sem9  = clean.slice(0, 4) + clean.slice(5); // sem o 9: 556299981718

    console.log(`📞 Testando número: ${clean}\n`);
    console.log('='.repeat(60));

    // -- findBySystemField com vários campos e formatos --
    console.log('\n🔍 1. findBySystemField (todos os campos e formatos):');
    const fields = ['whatsapp_phone', 'phone', 'wa_id', 'wa_phone'];
    const formats = [clean, `+${clean}`, sem55, `+${sem55}`, sem9, `+${sem9}`];

    for (const field of fields) {
        for (const fmt of formats) {
            await testEndpoint(
                `${field}=${fmt}`,
                `${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField`,
                { [field]: fmt },
                token
            );
        }
    }

    // -- Busca por nome --
    console.log('\n🔍 2. findByName:');
    await testEndpoint('name=lead greatpages 9', `${MANYCHAT_API_BASE}/fb/subscriber/findByName`, { name: 'lead greatpages 9' }, token);

    // -- getSubscribers com filtro de WhatsApp --
    console.log('\n🔍 3. getSubscribers (WhatsApp opt-in):');
    await testEndpoint('has_opt_in_whatsapp=true', `${MANYCHAT_API_BASE}/fb/subscriber/getSubscribers`, { has_opt_in_whatsapp: true, count: 10 }, token);

    // -- Verificar se wa_id pode ser passado diretamente como subscriber_id --
    //    (alguns sistemas usam wa_id como int64)
    console.log('\n🔍 4. getInfo com wa_id como subscriber_id:');
    await testEndpoint(`subscriber_id=${clean}`, `${MANYCHAT_API_BASE}/fb/subscriber/getInfo`, { subscriber_id: clean }, token);
    await testEndpoint(`subscriber_id=${sem55}`, `${MANYCHAT_API_BASE}/fb/subscriber/getInfo`, { subscriber_id: sem55 }, token);

    // -- Listar tags disponíveis --
    console.log('\n🔍 5. getTags (verificar se a tag existe):');
    await testEndpoint('getTags', `${MANYCHAT_API_BASE}/fb/page/getTags`, {}, token);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Teste concluído!\n');
}

run().catch(err => {
    console.error('Erro fatal:', err.message);
    process.exit(1);
});
