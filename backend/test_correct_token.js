/**
 * Teste com o token correto da conta ManyChat de producao
 */
import axios from 'axios';

const TOKEN = '563759373725607:5a18d5ba7dc02285e3536afb33460766';
const BASE = 'https://api.manychat.com';
const TEST_PHONE = '5562999981718';
const TAG_NAME = '[LEAD]-[SONO]';

const h = { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function get(endpoint, params = {}) {
    try {
        const r = await axios.get(`${BASE}${endpoint}`, { headers: h, params });
        return { ok: true, data: r.data };
    } catch (e) { return { ok: false, error: e.response?.data || e.message }; }
}

async function post(endpoint, data) {
    try {
        const r = await axios.post(`${BASE}${endpoint}`, data, { headers: h });
        return { ok: true, data: r.data };
    } catch (e) { return { ok: false, error: e.response?.data || e.message }; }
}

async function run() {
    console.log(`\n🔑 Token: ${TOKEN.slice(0, 25)}...`);
    console.log(`📞 Número: ${TEST_PHONE}\n`);
    console.log('='.repeat(60));

    // 1) Listar campos
    console.log('\n📋 CAMPOS PERSONALIZADOS:');
    const fields = await get('/fb/page/getCustomFields');
    if (fields.ok) {
        fields.data.data.forEach(f => console.log(`  ${f.id} → "${f.name}"`));
    } else {
        console.log('  ❌', JSON.stringify(fields.error));
    }

    // 2) Listar tags que contenham "lead" ou "sono"
    console.log('\n🏷️  TAGS (filtradas):');
    const tags = await get('/fb/page/getTags');
    if (tags.ok) {
        const all = tags.data.data;
        console.log(`  Total de tags: ${all.length}`);
        all.filter(t => t.name.toLowerCase().includes('lead') || t.name.toLowerCase().includes('sono'))
           .forEach(t => console.log(`  ${t.id} → "${t.name}"`));
        const exact = all.find(t => t.name === TAG_NAME);
        console.log(exact ? `\n  ✅ Tag "${TAG_NAME}" existe: ID ${exact.id}` : `\n  ❌ Tag "${TAG_NAME}" NÃO EXISTE`);
    }

    // 3) Buscar contato por phone
    console.log(`\n🔍 Buscando por phone=+${TEST_PHONE}:`);
    const r = await get('/fb/subscriber/findBySystemField', { phone: `+${TEST_PHONE}` });
    if (r.ok && r.data?.data?.id) {
        const sub = r.data.data;
        console.log(`  ✅ ID: ${sub.id} | nome="${sub.first_name}" | wa="${sub.whatsapp_phone}" | status="${sub.status}"`);
    } else {
        console.log(`  ⚠️  Não encontrado: ${JSON.stringify(r.error || r.data?.data)}`);
    }

    console.log('\n' + '='.repeat(60) + '\n');
}

run().catch(e => console.error('Fatal:', e.message));
