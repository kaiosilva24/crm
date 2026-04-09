/**
 * Migração em massa via CSV exportado do ManyChat
 *
 * COMO USAR:
 * 1) No ManyChat: Contatos → selecionar tudo → Exportar CSV
 * 2) Salvar o CSV como: backend/subscribers.csv
 * 3) Rodar: node migrate_wa_field_csv.js
 *
 * O script lê o subscriber_id e whatsapp_phone do CSV e
 * preenche o campo "Telefone WhatsApp" (ID 14465258) para cada um.
 */
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TOKEN = '563759373725607:5a18d5ba7dc02285e3536afb33460766';
const BASE = 'https://api.manychat.com';
const WA_FIELD_ID = 14465258;
const CSV_FILE = path.join(__dirname, 'subscribers.csv');
const DELAY_MS = 300;

const headers = { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

let totalProcessed = 0, totalUpdated = 0, totalSkipped = 0, totalErrors = 0;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function setWaField(subscriberId, waPhone) {
    try {
        const r = await axios.post(`${BASE}/fb/subscriber/setCustomField`, {
            subscriber_id: subscriberId,
            field_id: WA_FIELD_ID,
            field_value: waPhone
        }, { headers });
        return r.data?.status === 'success';
    } catch (e) {
        console.error(`  ❌ Erro ID ${subscriberId}:`, e.response?.data?.message || e.message);
        return false;
    }
}

async function parseCsv(filePath) {
    const subscribers = [];
    const rl = createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity });

    let headerLine = null;
    let idCol = -1, waCol = -1, phoneCol = -1;

    for await (const line of rl) {
        if (!headerLine) {
            headerLine = line;
            const cols = line.toLowerCase().split(',').map(c => c.trim().replace(/"/g, ''));
            idCol = cols.findIndex(c => c.includes('id') || c === 'subscriber_id');
            waCol = cols.findIndex(c => c.includes('whatsapp') || c.includes('wa_id') || c.includes('wa phone'));
            phoneCol = waCol === -1 ? cols.findIndex(c => c.includes('phone')) : -1;
            console.log(`📋 Colunas detectadas: ID[${idCol}]="${cols[idCol]}" | WA[${waCol !== -1 ? waCol : phoneCol}]="${cols[waCol !== -1 ? waCol : phoneCol]}"`);
            continue;
        }

        const cols = line.split(',').map(c => c.trim().replace(/"/g, ''));
        const id = cols[idCol];
        const waPhone = (waCol !== -1 ? cols[waCol] : cols[phoneCol])?.replace(/^\+/, '') || '';

        if (id && waPhone) {
            subscribers.push({ id, waPhone });
        }
    }

    return subscribers;
}

async function run() {
    if (!fs.existsSync(CSV_FILE)) {
        console.error(`\n❌ Arquivo não encontrado: ${CSV_FILE}`);
        console.error(`   Exporte os contatos do ManyChat e salve como subscribers.csv na pasta backend/\n`);
        process.exit(1);
    }

    console.log(`\n🚀 Lendo CSV: ${CSV_FILE}`);
    const subscribers = await parseCsv(CSV_FILE);
    console.log(`   ${subscribers.length} contatos com WhatsApp encontrados\n`);

    if (subscribers.length === 0) {
        console.error('❌ Nenhum contato com WhatsApp encontrado no CSV. Verifique as colunas.');
        process.exit(1);
    }

    console.log('▶️  Iniciando atualização...\n');

    for (const { id, waPhone } of subscribers) {
        totalProcessed++;

        if (!waPhone || waPhone.length < 8) {
            totalSkipped++;
            continue;
        }

        const ok = await setWaField(id, waPhone);
        if (ok) {
            totalUpdated++;
            if (totalUpdated % 20 === 0 || totalUpdated === 1) {
                console.log(`  ✅ ${totalUpdated}/${subscribers.length} atualizados`);
            }
        } else {
            totalErrors++;
        }

        await sleep(DELAY_MS);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🏁 Migração concluída!');
    console.log(`   Total processados : ${totalProcessed}`);
    console.log(`   ✅ Atualizados     : ${totalUpdated}`);
    console.log(`   ⏭️  Pulados         : ${totalSkipped}`);
    console.log(`   ❌ Erros           : ${totalErrors}`);
    console.log('='.repeat(50) + '\n');
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
