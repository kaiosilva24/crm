import axios from 'axios';

const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';
const BASE = 'https://api.manychat.com';

const phone = '+5567981720357';
const email = `test.debug.${Date.now()}@example.com`;

async function tryPayload(name, payload) {
    console.log(`\nTesting: ${name}`);
    try {
        const res = await axios.post(`${BASE}/fb/subscriber/createSubscriber`, payload, {
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
        });
        console.log('✅ SUCCESS!', res.data);
    } catch (e) {
        process.stdout.write(JSON.stringify(e.response?.data || { message: e.message }));
    }
}

async function run() {
    // 1. Minimal (No opt-in)
    await tryPayload('Minimal', {
        first_name: 'Debug',
        last_name: 'Minimal',
        phone: phone
    });

    // 2. Full (Current Code)
    await tryPayload('Full/Current', {
        first_name: 'Debug',
        last_name: 'Full',
        phone: phone,
        email: email,
        has_opt_in_sms: true,
        has_opt_in_email: true,
        consent_phrase: "Debug Opt-In"
    });

    // 3. WhatsApp Phone (if phone fails)
    await tryPayload('WhatsApp Phone', {
        first_name: 'Debug',
        last_name: 'WA',
        whatsapp_phone: phone,
        has_opt_in_sms: true,
        consent_phrase: "Debug WA"
    });
}

run();
