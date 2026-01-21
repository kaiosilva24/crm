import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BACKEND_URL = 'http://localhost:3001';
const TEST_PHONE = '5562983160896'; // +55 62 8316-0896
const TEST_EMAIL = 'teste.campanha@hotmart.com';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCampaignCheck() {
    console.log('🔍 Teste Completo - Verificação de Campanha');
    console.log(`📱 Número: ${TEST_PHONE}\n`);

    // 1. Verificar se o número existe em alguma campanha
    console.log('📊 Verificando se o número existe em alguma campanha...');
    const phoneEnd = TEST_PHONE.slice(-8); // Últimos 8 dígitos

    const { data: leads } = await supabase
        .from('leads')
        .select('id, name, phone, email, campaign_id, campaigns(name)')
        .ilike('phone', `%${phoneEnd}%`);

    if (leads && leads.length > 0) {
        console.log(`✅ Encontrado ${leads.length} lead(s) com este número:\n`);
        leads.forEach((lead, index) => {
            console.log(`${index + 1}. Lead ID: ${lead.id}`);
            console.log(`   Nome: ${lead.name}`);
            console.log(`   Telefone: ${lead.phone}`);
            console.log(`   Email: ${lead.email}`);
            console.log(`   Campanha ID: ${lead.campaign_id}`);
            console.log(`   Campanha: ${lead.campaigns?.name || 'N/A'}\n`);
        });
    } else {
        console.log('❌ Nenhum lead encontrado com este número.\n');
    }

    // 2. Verificar configuração atual
    console.log('⚙️ Verificando configuração do sistema...');
    const { data: settings } = await supabase
        .from('cart_abandonment_settings')
        .select('campaign_id, delay_minutes, is_enabled')
        .eq('id', 1)
        .single();

    console.log(`   Campanha configurada: ${settings.campaign_id || 'Nenhuma'}`);
    console.log(`   Delay: ${settings.delay_minutes} minutos`);
    console.log(`   Sistema ativo: ${settings.is_enabled ? 'Sim' : 'Não'}\n`);

    // 3. Limpar eventos anteriores
    console.log('🧹 Limpando eventos anteriores...');
    await supabase.from('cart_abandonment_events').delete().eq('contact_phone', TEST_PHONE);

    // 4. Enviar webhook
    console.log('📨 Enviando webhook de abandono de carrinho...');
    const payload = {
        event: 'CART_ABANDONMENT',
        data: {
            buyer: {
                name: 'Teste Campanha',
                email: TEST_EMAIL,
                checkout_phone: TEST_PHONE,
                phone: TEST_PHONE
            },
            product: { name: 'Produto Teste Campanha' },
            purchase: { transaction: `HP${Date.now()}` }
        }
    };

    const res = await fetch(`${BACKEND_URL}/api/cart-abandonment/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    const eventId = data.event_id;
    console.log(`✅ Evento criado: ID ${eventId}\n`);

    // 5. Login para obter token
    const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@crm.com', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    // 6. Monitorar status
    console.log('⏳ Monitorando progresso (aguardando delay + verificação)...\n');
    let completed = false;
    let attempts = 0;
    let lastStatus = '';

    while (!completed && attempts < 25) {
        await new Promise(r => setTimeout(r, 5000));
        attempts++;

        const evRes = await fetch(`${BACKEND_URL}/api/cart-abandonment/events?limit=5`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const evData = await evRes.json();
        const event = evData.events.find(e => e.id === eventId);

        if (event) {
            const status = `[${new Date().toLocaleTimeString()}] Status: ${event.status} | Msg1: ${event.first_message_sent ? '✅' : '❌'} | Msg2: ${event.second_message_sent ? '✅' : '❌'} | Na Campanha: ${event.found_in_campaign ? '✅' : '❌'}`;

            if (status !== lastStatus) {
                console.log(status);
                lastStatus = status;
            }

            if (event.status === 'completed' || event.status === 'error') {
                completed = true;

                console.log('\n--- RESULTADO FINAL ---');
                console.log(`Status: ${event.status}`);
                console.log(`Primeira Mensagem: ${event.first_message_sent ? '✅ ENVIADA' : '❌ NÃO ENVIADA'}`);
                console.log(`Segunda Mensagem: ${event.second_message_sent ? '✅ ENVIADA' : '❌ NÃO ENVIADA'}`);
                console.log(`Encontrado na Campanha: ${event.found_in_campaign ? '✅ SIM' : '❌ NÃO'}`);
                console.log(`ManyChat ID: ${event.manychat_subscriber_id || 'N/A'}`);

                if (event.error_message) {
                    console.log(`Erro: ${event.error_message}`);
                }

                // Explicação do resultado
                console.log('\n--- ANÁLISE ---');
                if (event.found_in_campaign) {
                    console.log('✅ Contato FOI encontrado na campanha configurada.');
                    console.log('   → Segunda mensagem NÃO deve ser enviada (regra de negócio).');
                    if (!event.second_message_sent) {
                        console.log('   ✅ CORRETO: Segunda mensagem não foi enviada.');
                    } else {
                        console.log('   ❌ ERRO: Segunda mensagem foi enviada quando não deveria.');
                    }
                } else {
                    console.log('❌ Contato NÃO foi encontrado na campanha configurada.');
                    console.log('   → Segunda mensagem DEVE ser enviada.');
                    if (event.second_message_sent) {
                        console.log('   ✅ CORRETO: Segunda mensagem foi enviada.');
                    } else {
                        console.log('   ❌ ERRO: Segunda mensagem não foi enviada quando deveria.');
                    }
                }
            }
        }
    }

    // 7. Buscar logs
    console.log('\n📜 Logs do evento:');
    const logRes = await fetch(`${BACKEND_URL}/api/cart-abandonment/logs?event_id=${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const logData = await logRes.json();
    const logs = logData.logs;

    logs.reverse().forEach(log => {
        const icon = log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '⚠️';
        console.log(`${icon} [${log.action_type}] ${log.message}`);
    });

    console.log('\n✅ Teste concluído!');
}

testCampaignCheck().catch(console.error);
