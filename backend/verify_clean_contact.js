import axios from 'axios';

const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';
const SUBSCRIBER_ID = '1299346751';

async function run() {
    try {
        console.log('Verificando tags atuais...');
        const url = `https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=${SUBSCRIBER_ID}`;

        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const tags = response.data.data.tags.map(t => t.name);
        console.log('Tags ativas:', tags);

        if (tags.length === 0) {
            console.log('✅ Contato limpo! Pronto para teste.');
        } else {
            console.log('⚠️  Ainda há tags. Confirme que removeu manualmente no ManyChat.');
        }

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

run();
