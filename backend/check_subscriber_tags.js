import axios from 'axios';

const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';
const SUBSCRIBER_ID = '1299346751';

async function run() {
    try {
        const url = `https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=${SUBSCRIBER_ID}`;
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const data = response.data.data;
        const names = data.tags.map(t => t.name);
        console.log('ACTIVE TAGS:', JSON.stringify(names, null, 2));

        if (names.includes('abandono_carrrinho_2')) {
            console.log('✅ FOUND TYPO TAG: abandono_carrrinho_2');
        } else {
            console.log('❌ TYPO TAG MISSING');
        }

    } catch (e) {
        console.error('API Error:', e.message);
    }
}

run();
