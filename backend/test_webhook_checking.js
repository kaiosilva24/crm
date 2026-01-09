
// const fetch = require('node-fetch'); // Native in Node 18+

async function testWebhook() {
    const url = 'http://localhost:3001/api/webhook/checking';
    const payload = {
        email: 'binasrenata@gmail.com',
        phone: '', // Forms might send empty phone
        checking: true
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Status Code:', response.status);
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

testWebhook();
