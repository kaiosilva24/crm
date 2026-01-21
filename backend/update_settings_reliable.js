import axios from 'axios';

const BACKEND = 'http://localhost:3001';

async function run() {
    try {
        console.log('Logging in...');
        const login = await axios.post(`${BACKEND}/api/auth/login`, {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = login.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        // Get current
        const current = await axios.get(`${BACKEND}/api/cart-abandonment/settings`, { headers });
        const settings = current.data.settings;
        console.log('Current Delay:', settings.delay_minutes);

        // Update
        const payload = {
            ...settings,
            delay_minutes: 1 // Integer 1 minute
        };

        console.log('Updating to 1 minute...');
        const update = await axios.put(`${BACKEND}/api/cart-abandonment/settings`, payload, { headers });
        console.log('New Delay:', update.data.settings.delay_minutes);

    } catch (e) {
        console.error('Error Message:', e.message);
        console.error('Error Code:', e.code);
        if (e.response) {
            console.log('Status:', e.response.status);
            console.log('Data:', JSON.stringify(e.response.data));
        }
    }
}
run();
