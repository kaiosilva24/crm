import axios from 'axios';

const MANYCHAT_API_BASE = 'https://api.manychat.com';
const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';

async function testManyChat() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  TESTE DE CONEXÃO E CRIAÇÃO - MANYCHAT                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    // TESTE 1: Verificar conexão
    console.log('1️⃣  TESTANDO CONEXÃO COM MANYCHAT...\n');
    try {
        const response = await axios.get(`${MANYCHAT_API_BASE}/fb/page/getInfo`, { headers });
        console.log('✅ Conexão bem-sucedida!');
        console.log('   Page Name:', response.data.data.name);
        console.log('   Page ID:', response.data.data.id);
    } catch (error) {
        console.log('❌ Erro na conexão:', error.response?.data || error.message);
        process.exit(1);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // TESTE 2: Buscar subscriber existente
    console.log('2️⃣  BUSCANDO SUBSCRIBER EXISTENTE...\n');
    const testPhone = '5567981720357';

    try {
        const url = `${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField?field_name=phone&field_value=${encodeURIComponent(testPhone)}`;
        const response = await axios.get(url, { headers });
        console.log('✅ Subscriber encontrado!');
        console.log('   ID:', response.data.data.id);
        console.log('   Name:', response.data.data.name);
        console.log('   Phone:', response.data.data.phone);
    } catch (error) {
        if (error.response?.status === 404) {
            console.log('⚠️  Subscriber não encontrado (esperado para novo contato)');
        } else {
            console.log('❌ Erro ao buscar:', error.response?.data || error.message);
        }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // TESTE 3: Tentar criar subscriber com diferentes formatos
    console.log('3️⃣  TESTANDO CRIAÇÃO DE SUBSCRIBER...\n');

    const testCases = [
        {
            name: 'Formato 1: Com + no início',
            phone: '+5567981720357',
            whatsapp_phone: '+5567981720357'
        },
        {
            name: 'Formato 2: Sem +',
            phone: '5567981720357',
            whatsapp_phone: '5567981720357'
        },
        {
            name: 'Formato 3: Apenas whatsapp_phone com +',
            whatsapp_phone: '+5567981720357'
        },
        {
            name: 'Formato 4: Apenas whatsapp_phone sem +',
            whatsapp_phone: '5567981720357'
        }
    ];

    for (const testCase of testCases) {
        console.log(`\n📱 Testando: ${testCase.name}`);

        const payload = {
            first_name: 'Teste',
            last_name: 'Abandono',
            email: 'teste.abandono@email.com',
            ...testCase
        };

        // Remove campos undefined
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

        console.log('   Payload:', JSON.stringify(payload, null, 2));

        try {
            const response = await axios.post(
                `${MANYCHAT_API_BASE}/fb/subscriber/createSubscriber`,
                payload,
                { headers }
            );
            console.log('   ✅ SUCESSO! Subscriber criado!');
            console.log('   ID:', response.data.data.id);

            // Se funcionou, parar aqui
            console.log('\n✅ Formato correto encontrado!');
            break;

        } catch (error) {
            console.log('   ❌ Falhou:', error.response?.status);
            console.log('   Erro:', JSON.stringify(error.response?.data, null, 2));
        }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // TESTE 4: Verificar documentação de campos
    console.log('4️⃣  INFORMAÇÕES ADICIONAIS\n');
    console.log('   📚 Documentação ManyChat:');
    console.log('      https://api.manychat.com/swagger#/Subscriber/post_fb_subscriber_createSubscriber');
    console.log('\n   💡 Campos disponíveis para createSubscriber:');
    console.log('      - first_name (obrigatório)');
    console.log('      - last_name');
    console.log('      - email');
    console.log('      - phone');
    console.log('      - whatsapp_phone');
    console.log('      - has_opt_in_sms');
    console.log('      - has_opt_in_email');
    console.log('      - consent_phrase');

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  FIM DOS TESTES                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
}

testManyChat();
