import axios from 'axios';

const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';
const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function findSubscriberByName(name, apiToken) {
    try {
        const cleanToken = apiToken ? apiToken.trim() : '';
        const url = `${MANYCHAT_API_BASE}/fb/subscriber/findByName?name=${encodeURIComponent(name)}`;
        console.log('Requesting:', url);

        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${cleanToken}`,
                'Content-Type': 'application/json',
            }
        });

        // Return first match
        if (response.data && response.data.data && response.data.data.length > 0) {
            console.log(`✅ Found subscriber by name: ${name} -> ${response.data.data[0].id}`);
            return response.data.data[0].id;
        }
        return null;
    } catch (error) {
        console.error('Error finding by name:', error.response?.data || error.message);
        return null;
    }
}

async function run() {
    console.log('Testing fallback...');
    const id = await findSubscriberByName('Debug WA', TOKEN);
    console.log('Final ID:', id);
}

run();
