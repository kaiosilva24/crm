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
        console.log('Current Tag:', settings.manychat_tag_name);

        // Update to Typo
        const payload = {
            ...settings,
            manychat_tag_name: 'abandono_carrrinho' // 3 R's
        };

        console.log('Updating to "abandono_carrrinho"...');
        const update = await axios.put(`${BACKEND}/api/cart-abandonment/settings`, payload, { headers });
        console.log('New Tag:', update.data.settings.manychat_tag_name);

    } catch (e) {
        console.error('Error:', e.message);
    }
}
run();
