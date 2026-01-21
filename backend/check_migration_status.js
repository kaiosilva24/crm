import axios from 'axios';

const BACKEND = 'http://localhost:3001';

async function run() {
    try {
        console.log('Verificando configurações do banco...\n');

        const login = await axios.post(`${BACKEND}/api/auth/login`, {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = login.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        const res = await axios.get(`${BACKEND}/api/cart-abandonment/settings`, { headers });
        const settings = res.data.settings;

        console.log('📋 Configurações atuais:');
        console.log('API Token:', settings.manychat_api_token ? '✅ Configurado' : '❌ Faltando');
        console.log('TAG 1:', settings.manychat_tag_name || 'não configurado');
        console.log('TAG 2:', settings.manychat_tag_name_second || '❌ COLUNA NÃO EXISTE');
        console.log('Delay:', settings.delay_minutes, 'minutos');
        console.log('Campanha:', settings.campaign_id || 'não configurado');
        console.log('');

        if (!settings.manychat_tag_name_second) {
            console.log('⚠️  PROBLEMA: Campo manychat_tag_name_second não existe!');
            console.log('Execute o SQL no Supabase:');
            console.log(`
ALTER TABLE cart_abandonment_settings 
ADD COLUMN IF NOT EXISTS manychat_tag_name_second VARCHAR(255);

UPDATE cart_abandonment_settings 
SET manychat_tag_name_second = 'abandono_carrinho_2'
WHERE manychat_tag_name_second IS NULL;
            `);
        } else {
            console.log('✅ Migração aplicada com sucesso!');
        }

    } catch (e) {
        console.error('Erro:', e.message);
        if (e.response) console.log(JSON.stringify(e.response.data));
    }
}

run();
