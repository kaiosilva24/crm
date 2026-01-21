import axios from 'axios';

const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';
const SUBSCRIBER_ID = '1299346751';
const TAG_NAME = 'abandono_carrinho';

async function run() {
    try {
        console.log('🧪 Teste Direto - Replicando exatamente o que o backend faz\n');

        const payload = {
            subscriber_id: SUBSCRIBER_ID,
            tag_name: TAG_NAME
        };

        console.log('Payload:', JSON.stringify(payload, null, 2));
        console.log('Token (last 10):', TOKEN.slice(-10));
        console.log('');

        const url = 'https://api.manychat.com/fb/subscriber/addTagByName';

        console.log('Enviando requisição...');
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ SUCESSO!');
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (e) {
        console.error('❌ FALHOU');
        console.error('Error message:', e.message);
        if (e.response) {
            console.error('Status:', e.response.status);
            console.error('Data:', JSON.stringify(e.response.data, null, 2));
        }
    }
}

run();
