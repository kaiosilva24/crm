import axios from 'axios';

const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';
const BASE = 'https://api.manychat.com';
const TARGET_PHONE = '5567981720357';

async function run() {
    console.log('Fetching all subscribers...');
    let url = `${BASE}/fb/page/getSubscribers?limit=50`;
    let found = false;
    let page = 1;

    try {
        while (url) {
            console.log(`Page ${page}...`);
            const res = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
            });

            const users = res.data.data;
            if (!users || users.length === 0) break;

            for (const u of users) {
                // Check all possible specific fields
                const phone = u.phone || '';
                const wa = u.whatsapp_phone || '';
                const mobile = u.mobile_phone || ''; // Sometimes field name varies

                // Simple includes check
                if (phone.includes(TARGET_PHONE) || wa.includes(TARGET_PHONE) || mobile.includes(TARGET_PHONE)) {
                    console.log('✅ FOUND IN LIST!');
                    console.log(JSON.stringify(u, null, 2));
                    found = true;
                    return;
                }
            }

            // Check pagination
            // ManyChat pagination implies looking at 'meta' or logic?
            // Usually uses 'page' param or cursor. 
            // Docs: /fb/page/getSubscribers?page=1&limit=50
            // Actually I should just increment page if data > 0
            page++;
            url = `${BASE}/fb/page/getSubscribers?limit=50&page=${page}`;

            // Safety break
            if (page > 20) {
                console.log('Stopped after 20 pages (1000 users).');
                break;
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) console.log(JSON.stringify(e.response.data));
    }

    if (!found) console.log('❌ Not found in first 1000 users.');
}

run();
