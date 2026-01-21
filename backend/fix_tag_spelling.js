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
        console.log('Current Tag (WRONG):', settings.manychat_tag_name);

        // Update to CORRECT spelling (2 R's, not 3)
        const payload = {
            ...settings,
            manychat_tag_name: 'abandono_carrinho' // CORRECT: 2 R's
        };

        console.log('Updating to CORRECT spelling: "abandono_carrinho"...');
        const update = await axios.put(`${BACKEND}/api/cart-abandonment/settings`, payload, { headers });
        console.log('New Tag (CORRECT):', update.data.settings.manychat_tag_name);
        console.log('✅ Tag 2 will now be: abandono_carrinho_2');

    } catch (e) {
        console.error('Error:', e.message);
    }
}
run();
