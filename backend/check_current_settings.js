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

        const res = await axios.get(`${BACKEND}/api/cart-abandonment/settings`, { headers });
        const settings = res.data.settings;

        console.log('\n📋 Configurações Atuais:\n');
        console.log('Delay:', settings.delay_minutes, 'minutos');
        console.log('TAG 1:', settings.manychat_tag_name || 'não configurado');
        console.log('TAG 2:', settings.manychat_tag_name_second || '❌ NÃO CONFIGURADO');
        console.log('Campanha ID:', settings.campaign_id || 'não configurado');
        console.log('Sistema ativo:', settings.is_enabled ? 'SIM' : 'NÃO');
        console.log('');

        if (!settings.manychat_tag_name_second) {
            console.log('⚠️  PROBLEMA: TAG 2 não está configurada!');
            console.log('O sistema vai usar fallback: TAG 1 + "_2"');
            console.log(`Resultado: ${settings.manychat_tag_name}_2`);
        }

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

run();
