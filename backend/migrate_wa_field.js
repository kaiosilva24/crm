/**
 * Script de migração em massa: preencher campo "Telefone WhatsApp" (ID: 14465258)
 * para TODOS os contatos existentes no ManyChat que têm WhatsApp
 *
 * ATENÇÃO: Faz chamadas em massa à API. Execute apenas uma vez.
 * Usa delay entre chamadas para respeitar rate limit do ManyChat.
 */
import axios from 'axios';

const TOKEN = '563759373725607:5a18d5ba7dc02285e3536afb33460766';
const BASE = 'https://api.manychat.com';
const WA_FIELD_ID = 14465258;
const DELAY_MS = 300; // delay entre cada setCustomField (evitar rate limit)

const headers = { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

let totalProcessed = 0;
let totalUpdated = 0;
let totalSkipped = 0;
let totalErrors = 0;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function get(endpoint, params = {}) {
    try {
        const r = await axios.get(`${BASE}${endpoint}`, { headers, params });
        return { ok: true, data: r.data };
    } catch (e) { return { ok: false, error: e.response?.data || e.message }; }
}

async function post(endpoint, data) {
    try {
        const r = await axios.post(`${BASE}${endpoint}`, data, { headers });
        return { ok: true, data: r.data };
    } catch (e) { return { ok: false, error: e.response?.data || e.message }; }
}

async function setWaField(subscriberId, waPhone) {
    const r = await post('/fb/subscriber/setCustomField', {
        subscriber_id: subscriberId,
        field_id: WA_FIELD_ID,
        field_value: waPhone
    });
    return r.ok;
}

async function getSubscriberPage(nextCursor = null) {
    const params = { count: 100, status: 'active' };
    if (nextCursor) params.cursor = nextCursor;
    return await get('/fb/subscriber/getSubscribers', params);
}

async function processSubscriber(sub) {
    totalProcessed++;

    // Pegar o wa_id (whatsapp_phone ou phone)
    const waPhone = sub.whatsapp_phone || sub.wa_id || null;

    if (!waPhone) {
        totalSkipped++;
        return;
    }

    // Limpar o número (remover +)
    const cleanPhone = waPhone.replace(/^\+/, '');

    // Verificar se o campo já está preenchido
    const currentVal = sub.custom_fields?.find?.(f => f.field_id === WA_FIELD_ID)?.value;
    if (currentVal === cleanPhone) {
        totalSkipped++;
        return;
    }

    const ok = await setWaField(sub.id, cleanPhone);
    if (ok) {
        totalUpdated++;
        if (totalUpdated % 10 === 0) {
            console.log(`  ✅ ${totalUpdated} atualizados | ${totalProcessed} processados | ${totalErrors} erros`);
        }
    } else {
        totalErrors++;
        console.error(`  ❌ Erro ao atualizar ID ${sub.id} (${waPhone})`);
    }

    await sleep(DELAY_MS);
}

async function run() {
    console.log('\n🚀 Iniciando migração em massa do campo "Telefone WhatsApp"...');
    console.log(`📋 Campo ID: ${WA_FIELD_ID} | Token: ${TOKEN.slice(0, 25)}...\n`);

    // Verificar se o campo existe
    const fields = await get('/fb/page/getCustomFields');
    if (!fields.ok || !fields.data?.data?.find(f => f.id === WA_FIELD_ID)) {
        console.error('❌ Campo Telefone WhatsApp (ID: ' + WA_FIELD_ID + ') não encontrado!');
        process.exit(1);
    }
    console.log('✅ Campo confirmado. Iniciando busca de contatos...\n');

    let cursor = null;
    let page = 0;

    do {
        page++;
        console.log(`📄 Buscando página ${page}${cursor ? ' (cursor: '+cursor.slice(0,20)+'...)' : ''}...`);

        const r = await getSubscriberPage(cursor);

        if (!r.ok) {
            if (r.error?.message?.includes('No more results') || JSON.stringify(r.error).includes('empty')) {
                console.log('✅ Sem mais resultados.');
                break;
            }
            console.error('❌ Erro ao buscar contatos:', JSON.stringify(r.error));
            break;
        }

        const { data } = r.data;

        if (!data || !Array.isArray(data) || data.length === 0) {
            console.log('✅ Sem mais contatos para processar.');
            break;
        }

        console.log(`   ${data.length} contatos nessa página`);

        for (const sub of data) {
            await processSubscriber(sub);
        }

        // Cursor para próxima página
        cursor = r.data?.cursor || null;

        // Se não tem cursor, acabou
        if (!cursor) break;

    } while (true);

    console.log('\n' + '='.repeat(50));
    console.log('🏁 Migração concluída!');
    console.log(`   Total processados : ${totalProcessed}`);
    console.log(`   ✅ Atualizados     : ${totalUpdated}`);
    console.log(`   ⏭️  Pulados         : ${totalSkipped}`);
    console.log(`   ❌ Erros           : ${totalErrors}`);
    console.log('='.repeat(50) + '\n');
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
