import axios from 'axios';

const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';
const SUBSCRIBER_ID = '1299346751';
const TAG_NAME = 'abandono_carrinho'; // Existing tag

async function run() {
    try {
        console.log(`Testing with EXISTING tag: ${TAG_NAME}...`);
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

        console.log('✅ Tag application SUCCESSFUL');
        console.log('This confirms the API works when the tag EXISTS in ManyChat');

    } catch (e) {
        console.error('❌ Failed even with existing tag:', e.message);
        if (e.response) console.log(JSON.stringify(e.response.data, null, 2));
    }
}

run();
