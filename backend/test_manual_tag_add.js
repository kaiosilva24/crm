import axios from 'axios';

const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';
const SUBSCRIBER_ID = '1299346751';
const TAG_NAME = 'abandono_carrrinho_2'; // Typo version

async function run() {
    try {
        console.log(`Testing tag addition: ${TAG_NAME} to ${SUBSCRIBER_ID}...`);
        const url = `https://api.manychat.com/fb/subscriber/addTagByName`;

        const payload = {
            subscriber_id: SUBSCRIBER_ID,
            tag_name: TAG_NAME
        };

        console.log('Payload:', JSON.stringify(payload, null, 2));

        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ SUCCESS');
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (e) {
        console.error('❌ FAILED');
        console.error('Error:', e.message);
        if (e.response) {
            console.log('Status:', e.response.status);
            console.log('Data:', JSON.stringify(e.response.data, null, 2));
        }
    }
}

run();
