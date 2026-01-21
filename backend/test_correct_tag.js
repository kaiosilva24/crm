import axios from 'axios';

const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';
const SUBSCRIBER_ID = '1299346751';
const TAG_NAME = 'abandono_carrinho_2'; // CORRECT spelling (2 R's)

async function run() {
    try {
        console.log(`Testing CORRECT tag: ${TAG_NAME}...`);
        const url = `https://api.manychat.com/fb/subscriber/addTagByName`;

        const response = await axios.post(url, {
            subscriber_id: SUBSCRIBER_ID,
            tag_name: TAG_NAME
        }, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Tag added successfully!');
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (e) {
        console.error('❌ Failed:', e.message);
        if (e.response) {
            console.log('Error:', JSON.stringify(e.response.data, null, 2));
        }
    }
}

run();
