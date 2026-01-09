/**
 * Script para verificar webhooks da Hotmart e identificar problema com telefones
 */

import { supabase } from './src/database/supabase.js';

async function checkHotmartWebhooks() {
    console.log('🔍 Verificando webhooks da Hotmart...\n');

    // 1. Verificar últimos webhooks
    const { data: logs } = await supabase
        .from('hotmart_webhook_logs')
        .select('payload, buyer_name, buyer_email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log('📥 Últimos 5 webhooks recebidos:\n');
    logs.forEach((log, i) => {
        console.log(`${i + 1}. ${log.buyer_name} (${log.created_at})`);
        console.log(`   Email: ${log.buyer_email}`);

        try {
            const payload = JSON.parse(log.payload);
            const phone = payload.data?.buyer?.phone;
            console.log(`   Telefone no payload: ${phone || '❌ NÃO TEM'}`);
            console.log(`   Estrutura do payload:`, JSON.stringify(payload, null, 2).substring(0, 300));
        } catch (e) {
            console.log(`   Erro ao parsear payload: ${e.message}`);
        }
        console.log('');
    });

    // 2. Verificar últimos leads criados
    const { data: leads } = await supabase
        .from('leads')
        .select('first_name, email, phone, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log('\n👥 Últimos 5 leads criados:\n');
    leads.forEach((l, i) => {
        console.log(`${i + 1}. ${l.first_name}`);
        console.log(`   Email: ${l.email}`);
        console.log(`   Telefone: ${l.phone || '❌ SEM TELEFONE'}`);
        console.log('');
    });
}

checkHotmartWebhooks();
