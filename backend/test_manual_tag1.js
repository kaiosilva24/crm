import axios from 'axios';

const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';
const SUBSCRIBER_ID = '1299346751';

async function run() {
    try {
        console.log('🧪 Teste Manual: Aplicando TAG 1\n');

        const url = `https://api.manychat.com/fb/subscriber/addTagByName`;
        const payload = {
            subscriber_id: SUBSCRIBER_ID,
            tag_name: 'abandono_carrinho'
        };

        console.log('Payload:', JSON.stringify(payload, null, 2));
        console.log('');

        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ TAG 1 aplicada com sucesso!');
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (e) {
        console.error('❌ Falhou:', e.message);
        if (e.response) {
            console.log('Status:', e.response.status);
            console.log('Error:', JSON.stringify(e.response.data, null, 2));
        }
    }
}

run();
