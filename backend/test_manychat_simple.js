import axios from 'axios';
import fs from 'fs';

const MANYCHAT_API_BASE = 'https://api.manychat.com';
const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';

async function testAndLog() {
    const log = [];

    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    // TESTE 1: Conexão
    log.push('=== TESTE 1: CONEXÃO ===');
    try {
        const response = await axios.get(`${MANYCHAT_API_BASE}/fb/page/getInfo`, { headers });
        log.push('✅ Conexão OK');
        log.push(`Page: ${response.data.data.name}`);
    } catch (error) {
        log.push('❌ Erro: ' + (error.response?.data || error.message));
    }

    // TESTE 2: Buscar subscriber
    log.push('\n=== TESTE 2: BUSCAR SUBSCRIBER ===');
    const testPhone = '5567981720357';
    try {
        const url = `${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField?field_name=phone&field_value=${encodeURIComponent(testPhone)}`;
        const response = await axios.get(url, { headers });
        log.push('✅ Encontrado: ' + response.data.data.id);
    } catch (error) {
        log.push('⚠️  Não encontrado (status: ' + error.response?.status + ')');
    }

    // TESTE 3: Criar subscriber
    log.push('\n=== TESTE 3: CRIAR SUBSCRIBER ===');

    const testCases = [
        { name: 'Com +', phone: '+5567981720357', whatsapp_phone: '+5567981720357' },
        { name: 'Sem +', phone: '5567981720357', whatsapp_phone: '5567981720357' },
        { name: 'Só whatsapp +', whatsapp_phone: '+5567981720357' },
        { name: 'Só whatsapp', whatsapp_phone: '5567981720357' }
    ];

    for (const tc of testCases) {
        const payload = {
            first_name: 'Teste',
            last_name: 'Abandono',
            email: 'teste.abandono@email.com',
            ...tc
        };
        delete payload.name;

        log.push(`\nTeste: ${tc.name}`);
        log.push(`Payload: ${JSON.stringify(payload)}`);

        try {
            const response = await axios.post(
                `${MANYCHAT_API_BASE}/fb/subscriber/createSubscriber`,
                payload,
                { headers }
            );
            log.push('✅ SUCESSO! ID: ' + response.data.data.id);
            log.push('FORMATO CORRETO ENCONTRADO!');
            break;
        } catch (error) {
            log.push(`❌ Erro ${error.response?.status}: ${JSON.stringify(error.response?.data)}`);
        }
    }

    const output = log.join('\n');
    fs.writeFileSync('manychat_test_log.txt', output);
    console.log(output);

    process.exit(0);
}

testAndLog();
