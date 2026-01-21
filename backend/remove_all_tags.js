import axios from 'axios';

const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';
const SUBSCRIBER_ID = '1299346751';

async function run() {
    try {
        console.log('Removendo todas as tags do contato...\n');

        // Get current tags
        const url = `https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=${SUBSCRIBER_ID}`;
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const tags = response.data.data.tags;
        console.log(`Tags atuais: ${tags.map(t => t.name).join(', ')}`);

        // Remove each tag
        for (const tag of tags) {
            console.log(`Removendo: ${tag.name}...`);
            await axios.post(`https://api.manychat.com/fb/subscriber/removeTagByName`, {
                subscriber_id: SUBSCRIBER_ID,
                tag_name: tag.name
            }, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
        }

        console.log('\n✅ Todas as tags removidas!');
        console.log('Contato limpo e pronto para teste final.');

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

run();
