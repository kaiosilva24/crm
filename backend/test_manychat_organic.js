/**
 * Teste: Encontrar e taggear contato orgânico 62999981718
 * 1) Resolve o ID do campo "Telefone WhatsApp" dinamicamente
 * 2) Busca o contato por phone=+5562999981718
 * 3) Se encontrado, seta o custom field com o wa_id e adiciona a tag
 * 4) Se não encontrado, mostra o diagnóstico
 */
import pg from 'pg';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const BASE = 'https://api.manychat.com';
const WA_CUSTOM_FIELD_NAME = 'Telefone WhatsApp';
const TEST_PHONE = '5562999981718'; // número completo com país
const TAG_NAME = '[LEAD]-[SONO]';

async function getToken() {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const { rows } = await client.query(`SELECT manychat_api_token FROM manychat_settings WHERE manychat_api_token IS NOT NULL LIMIT 1`);
    await client.end();
    return rows[0]?.manychat_api_token;
}

async function api(method, endpoint, data, token) {
    try {
        const cfg = { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } };
        const res = method === 'GET'
            ? await axios.get(`${BASE}${endpoint}`, { ...cfg, params: data })
            : await axios.post(`${BASE}${endpoint}`, data, cfg);
        return { ok: true, data: res.data };
    } catch (err) {
        return { ok: false, error: err.response?.data || err.message };
    }
}

async function getCustomFieldIdByName(name, token) {
    const r = await api('GET', '/fb/page/getCustomFields', {}, token);
    if (r.ok && r.data?.data) {
        const field = r.data.data.find(f => f.name.toLowerCase().trim() === name.toLowerCase().trim());
        if (field) { console.log(`  ✅ Campo "${name}" → ID real API: ${field.id}`); return field.id; }
    }
    console.log(`  ⚠️  Campo "${name}" NÃO ENCONTRADO na API do ManyChat`);
    return null;
}

async function findSubscriberById(id, token) {
    const r = await api('GET', `/fb/subscriber/getInfo`, { subscriber_id: id }, token);
    if (r.ok && r.data?.data) {
        const sub = r.data.data;
        console.log(`  📋 ID: ${id} | nome="${sub.first_name}" | phone="${sub.phone}" | wa="${sub.whatsapp_phone}" | status="${sub.status}"`);
        return sub;
    }
    return null;
}

async function run() {
    const token = await getToken();
    console.log(`\n🔑 Token: ${token.slice(0, 20)}...`);
    console.log(`📞 Número de teste: ${TEST_PHONE}\n`);
    console.log('='.repeat(60));

    // ── PASSO 1: Resolver ID do campo personalizado ──────────────
    console.log(`\n🗂️  PASSO 1: Resolver ID do campo "${WA_CUSTOM_FIELD_NAME}"`);
    const waFieldId = await getCustomFieldIdByName(WA_CUSTOM_FIELD_NAME, token);

    // ── PASSO 2: Busca por phone=+XXXX ───────────────────────────
    console.log(`\n🔍 PASSO 2: findBySystemField?phone=+${TEST_PHONE}`);
    const r1 = await api('GET', '/fb/subscriber/findBySystemField', { phone: `+${TEST_PHONE}` }, token);
    let foundId = null;

    if (r1.ok && r1.data?.data?.id) {
        foundId = r1.data.data.id;
        console.log(`  ✅ ENCONTRADO! ID: ${foundId}`);
        await findSubscriberById(foundId, token);
    } else {
        console.log(`  ⚠️  Não encontrado por phone. Resp: ${JSON.stringify(r1.error || r1.data?.data)}`);
    }

    // ── PASSO 3: Busca por custom field (se campo existir) ───────
    if (waFieldId) {
        console.log(`\n🔍 PASSO 3: findByCustomField(${waFieldId}, ${TEST_PHONE})`);
        const r2 = await api('GET', '/fb/subscriber/findByCustomField', { field_id: waFieldId, field_value: TEST_PHONE }, token);
        if (r2.ok && r2.data?.data) {
            const candidates = Array.isArray(r2.data.data) ? r2.data.data : [r2.data.data];
            const active = candidates.find(s => s.id && s.status !== 'deleted');
            if (active) {
                console.log(`  ✅ ENCONTRADO via custom field! ID: ${active.id}`);
                foundId = foundId || active.id;
            } else {
                console.log(`  ⚠️  Custom field vazio/sem resultado ativo`);
            }
        } else {
            console.log(`  ⚠️  Resp: ${JSON.stringify(r2.error || r2.data?.data)}`);
        }
    } else {
        console.log(`\n⚠️  PASSO 3: Pulado — campo "${WA_CUSTOM_FIELD_NAME}" não existe na conta ManyChat`);
    }

    // ── PASSO 4: Se temos o ID, seta o campo e adiciona a tag ────
    if (foundId) {
        console.log(`\n✅ Contato localizado! ID: ${foundId}`);

        if (waFieldId) {
            console.log(`\n📝 PASSO 4: setCustomField("${WA_CUSTOM_FIELD_NAME}", ${TEST_PHONE}) no ID ${foundId}`);
            const r4 = await api('POST', '/fb/subscriber/setCustomField', {
                subscriber_id: foundId,
                field_id: waFieldId,
                field_value: TEST_PHONE
            }, token);
            console.log(`  ${r4.ok ? '✅' : '❌'} setCustomField: ${JSON.stringify(r4.data?.status || r4.error)}`);
        }

        console.log(`\n🏷️  PASSO 5: addTag "${TAG_NAME}" no ID ${foundId}`);
        const tagsR = await api('GET', '/fb/page/getTags', {}, token);
        if (tagsR.ok && tagsR.data?.data) {
            const tag = tagsR.data.data.find(t => t.name === TAG_NAME);
            if (tag) {
                // remover primeiro para forçar re-trigger
                await api('POST', '/fb/subscriber/removeTag', { subscriber_id: foundId, tag_id: tag.id }, token);
                const r5 = await api('POST', '/fb/subscriber/addTag', { subscriber_id: foundId, tag_id: tag.id }, token);
                console.log(`  ${r5.ok ? '✅' : '❌'} addTag: ${JSON.stringify(r5.data?.status || r5.error)}`);
            } else {
                console.log(`  ⚠️  Tag "${TAG_NAME}" não encontrada — verifique o nome exato`);
            }
        }
    } else {
        console.log(`\n❌ Contato não localizado por nenhum método!`);
        console.log(`   Diagnóstico: contato orgânico com apenas wa_id interno — limitação da API ManyChat`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Teste concluído!\n');
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
