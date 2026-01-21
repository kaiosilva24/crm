import axios from 'axios';

const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';

async function run() {
    try {
        console.log('Verificando tags no ManyChat...\n');

        // Get all tags
        const url = `https://api.manychat.com/fb/page/getTags`;
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const tags = response.data.data;
        console.log(`Total de tags: ${tags.length}\n`);

        const tag1 = tags.find(t => t.name === 'abandono_carrinho');
        const tag2 = tags.find(t => t.name === 'abandono_carrinho_2');

        console.log('TAG 1 (abandono_carrinho):', tag1 ? `✅ Existe (ID: ${tag1.id})` : '❌ NÃO EXISTE');
        console.log('TAG 2 (abandono_carrinho_2):', tag2 ? `✅ Existe (ID: ${tag2.id})` : '❌ NÃO EXISTE');

        if (!tag1 || !tag2) {
            console.log('\n⚠️  Crie as tags faltantes no ManyChat:');
            console.log('ManyChat → Automations → Tags → Create Tag');
        }

    } catch (e) {
        console.error('Erro:', e.message);
        if (e.response) console.log(JSON.stringify(e.response.data, null, 2));
    }
}

run();
