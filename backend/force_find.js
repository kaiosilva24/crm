import axios from 'axios';

const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';
const BASE = 'https://api.manychat.com';

const raw = '5567981720357';
const variations = [
    raw,
    `+${raw}`,
    '67981720357',
    '981720357',
    '+55 67 98172-0357',
    '55 67 98172-0357',
    '55 67 981720357',
    '556798172-0357',
    '+556798172-0357',
    '(67) 98172-0357',
    '+55 (67) 98172-0357',
    '55 67 98172 0357'
];

async function check(phone) {
    try {
        let res = await axios.get(`${BASE}/fb/subscriber/findBySystemField?field_name=phone&field_value=${encodeURIComponent(phone)}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
        });
        if (res.data?.data?.id) {
            console.log(`✅ FOUND (phone): "${phone}" -> ID: ${res.data.data.id}`);
            return true;
        }
    } catch (e) { }

    try {
        let res = await axios.get(`${BASE}/fb/subscriber/findBySystemField?field_name=whatsapp_phone&field_value=${encodeURIComponent(phone)}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
        });
        if (res.data?.data?.id) {
            console.log(`✅ FOUND (whatsapp_phone): "${phone}" -> ID: ${res.data.data.id}`);
            return true;
        }
    } catch (e) { }

    return false;
}

async function run() {
    console.log(`Searching for ${raw} in ${variations.length} formats...`);
    for (const v of variations) {
        if (await check(v)) break;
    }
    console.log('Done.');
}
run();
