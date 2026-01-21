import axios from 'axios';

const MANYCHAT_API_BASE = 'https://api.manychat.com';
const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';

async function testCreateWithOptIn() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  TESTE DE CRIAÇÃO COM OPT-IN CORRETO                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    // Teste com todos os campos obrigatórios
    const payload = {
        first_name: 'Teste',
        last_name: 'Abandono Carrinho',
        email: 'teste.abandono@email.com',
        phone: '+5567981720357',
        whatsapp_phone: '+5567981720357',
        has_opt_in_sms: true,
        has_opt_in_email: true,
        consent_phrase: 'Cart Abandonment Test'
    };

    console.log('📋 Payload:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');

    try {
        const response = await axios.post(
            `${MANYCHAT_API_BASE}/fb/subscriber/createSubscriber`,
            payload,
            { headers }
        );

        console.log('✅ SUCESSO! Subscriber criado!');
        console.log('   ID:', response.data.data.id);
        console.log('   Name:', response.data.data.name);
        console.log('   Phone:', response.data.data.phone);
        console.log('   WhatsApp:', response.data.data.whatsapp_phone);
        console.log('');

        // Salvar ID para uso posterior
        console.log('🆔 Subscriber ID:', response.data.data.id);

    } catch (error) {
        console.log('❌ Erro:', error.response?.status);
        console.log('   Detalhes:', JSON.stringify(error.response?.data, null, 2));
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  FIM DO TESTE                                              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    process.exit(0);
}

testCreateWithOptIn();
