import axios from 'axios';

const BACKEND = 'http://localhost:3001';

async function run() {
    try {
        console.log('🔧 Configurando Tag 2 via API...\n');

        const login = await axios.post(`${BACKEND}/api/auth/login`, {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = login.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        // Get current settings
        const current = await axios.get(`${BACKEND}/api/cart-abandonment/settings`, { headers });
        const settings = current.data.settings;

        console.log('Configurações atuais:');
        console.log('  TAG 1:', settings.manychat_tag_name || 'não configurado');
        console.log('  TAG 2:', settings.manychat_tag_name_second || '❌ NÃO CONFIGURADO');
        console.log('  Delay:', settings.delay_minutes, 'minutos\n');

        // Update with Tag 2
        const updated = {
            ...settings,
            manychat_tag_name: 'abandono_carrinho',
            manychat_tag_name_second: 'abandono_carrinho_2',
            delay_minutes: 1 // 1 minuto para teste
        };

        console.log('Aplicando nova configuração...');
        const response = await axios.put(`${BACKEND}/api/cart-abandonment/settings`, updated, { headers });

        console.log('\n✅ Configuração atualizada!');
        console.log('  TAG 1:', response.data.settings.manychat_tag_name);
        console.log('  TAG 2:', response.data.settings.manychat_tag_name_second);
        console.log('  Delay:', response.data.settings.delay_minutes, 'minutos');

    } catch (e) {
        console.error('❌ Erro:', e.message);
        if (e.response) {
            console.log('Status:', e.response.status);
            console.log('Data:', e.response.data);
        }
    }
}

run();
