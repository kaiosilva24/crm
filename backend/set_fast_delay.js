import axios from 'axios';

const BACKEND = 'http://localhost:3001';

async function run() {
    try {
        const login = await axios.post(`${BACKEND}/api/auth/login`, {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = login.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        // Get current settings
        const current = await axios.get(`${BACKEND}/api/cart-abandonment/settings`, { headers });
        console.log('Current Delay:', current.data.settings.delay_minutes);

        // Update to 1 minute
        const update = await axios.put(`${BACKEND}/api/cart-abandonment/settings`, {
            ...current.data.settings,
            delay_minutes: 0.05 // 3 seconds for extreme speed? No, backend says (minutes * 60 * 1000). 0.1 = 6 seconds.
            // Let's safe 0.1 minute (6 seconds)
        }, { headers });

        console.log('New Delay:', update.data.settings.delay_minutes);

    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) console.log(JSON.stringify(e.response.data));
    }
}
run();
