import axios from 'axios';

const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';
const SUBSCRIBER_ID = '1299346751'; // From screenshot
const TAG_NAME = 'abandono_carrinho'; // Default

async function run() {
    try {
        console.log(`Adding tag '${TAG_NAME}' to ${SUBSCRIBER_ID}...`);
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

        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));

    } catch (e) {
        console.error('API Error:', e.message);
        if (e.response) {
            console.log('ManyChat Error Body:', JSON.stringify(e.response.data, null, 2));
        }
    }
}

run();
