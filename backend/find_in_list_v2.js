import axios from 'axios';

const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';
const BASE = 'https://api.manychat.com';
const TARGET = '5567981720357';

async function run() {
    console.log('Fetching...');
    // Try endpoint fb/subscriber/findByName as fallback if list is huge? No, name is unknown ("Test"?).

    let url = `${BASE}/fb/page/getSubscribers?limit=20`;
    let count = 0;

    try {
        while (url && count < 500) { // Limit search to 500 to avoid long runs
            const res = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
            });
            const users = res.data.data;
            if (!users || users.length === 0) break;

            console.log(`Scanning ${users.length} users...`);
            for (const u of users) {
                // Dump user if phone matches roughly
                const dump = JSON.stringify(u);
                if (dump.includes('67981720357') || dump.includes('981720357')) {
                    console.log('✅ BINGO!', dump);
                    return;
                }
            }

            count += users.length;
            // Cursor pagination?
            // "pagination": { "next_page_url": "..." } ?
            // Usually ManyChat returns "data" and "meta" or similar.
            // Documentation says: success, data, pagination.
            // pagination.next_page?
            /* 
               "pagination": {
                   "total": 123,
                   "count": 50,
                   "per_page": 50,
                   "current_page": 1,
                   "total_pages": 3,
                   "links": { "next": "URL..." }
               }
            */
            // Or cursor? Not sure without seeing response.
            // I'll check response structure from previous logs if possible? No.
            // I'll blindly check for `res.data.data` (array) which I see in my logs is standard.
            // How to get next page?
            // Typically "page" param increment matches standard Laravel/API style.

            // Wait, if I don't change the URL or page, I loop forever on page 1.
            // I must increment page.
            if (url.includes('page=')) {
                let p = parseInt(url.match(/page=(\d+)/)[1]);
                url = url.replace(`page=${p}`, `page=${p + 1}`);
            } else {
                url = `${url}&page=2`;
            }
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
    console.log(`Scanned ${count} users. Not found.`);
}

run();
