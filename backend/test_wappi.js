
import axios from 'axios';

const token = '87043d04cbf75e41c1771d0dd620156b03f15ab1';
const profileId = 'ece55f82-7cf9';

async function testWappi() {
    try {
        console.log('Testing /chats/get with limit=1000...');
        const res = await axios.get(`https://wappi.pro/api/sync/chats/get`, {
            headers: { 'Authorization': token },
            params: {
                profile_id: profileId,
                show_all: true,
                limit: 1000,
                count: 1000
            }
        });
        console.log('Response Status:', res.status);

        let chats = [];
        if (Array.isArray(res.data)) chats = res.data;
        else if (res.data.dialogs) chats = res.data.dialogs;

        console.log(`Total chats returned: ${chats.length}`);

        console.log('--- ALL CHAT IDs ---');
        chats.forEach(c => {
            const id = c.id || c.chat_id || 'NO_ID';
            const isG = c.isGroup;
            console.log(`ID: ${id}, isGroup: ${isG}, Name: ${c.name || c.subject || c.fullName || 'No Name'}`);
        });

        // Count groups
        const groups = chats.filter(c => {
            const id = c.id || c.chat_id || '';
            return id.includes('@g.us') || c.isGroup;
        });
        console.log(`Total groups filter count: ${groups.length}`);

    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) {
            console.error('Data:', err.response.data);
        }
    }
}

testWappi();
