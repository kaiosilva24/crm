import axios from 'axios';

async function test() {
    try {
        const payload = {
            email: "test_script_greatpages@example.com",
            name: "Test Script Lead",
            phone: "5511988887777"
        };
        console.log('Sending payload:', payload);
        const res = await axios.post('http://localhost:3001/api/webhook/greatpages', payload);
        console.log('Response:', res.data);
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

test();
