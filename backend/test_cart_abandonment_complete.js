import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const BACKEND_URL = 'http://localhost:3001';
const TEST_PHONE = '5567981720357'; // Número de teste
const TEST_NAME = 'Teste Abandono Carrinho';
const TEST_EMAIL = 'teste.abandono@email.com';
const TEST_PRODUCT = 'Produto Teste Abandono';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  TESTE COMPLETO - ABANDONO DE CARRINHO + MANYCHAT         ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function runTest() {
    try {
        // PASSO 1: Verificar configurações
        console.log('📋 PASSO 1: Verificando configurações...\n');
        const { data: settings } = await supabase
            .from('cart_abandonment_settings')
            .select('*')
            .eq('id', 1)
            .single();

        console.log('✅ Sistema Habilitado:', settings.is_enabled ? 'SIM' : 'NÃO');
        console.log('🏷️  Tag 1:', settings.manychat_tag_name);
        console.log('🏷️  Tag 2:', settings.manychat_tag_name_second);
        console.log('⏰ Delay:', settings.delay_minutes, 'minutos');
        console.log('📊 Campanha:', settings.campaign_id);

        if (!settings.is_enabled) {
            console.log('\n❌ Sistema desabilitado! Ative nas configurações.');
            process.exit(1);
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // PASSO 2: Enviar evento de abandono
        console.log('📤 PASSO 2: Enviando evento de abandono de carrinho...\n');

        const payload = {
            event: 'PURCHASE_CANCELED',
            data: {
                buyer: {
                    name: TEST_NAME,
                    email: TEST_EMAIL,
                    phone: TEST_PHONE,
                    checkout_phone: TEST_PHONE
                },
                product: {
                    name: TEST_PRODUCT
                },
                purchase: {
                    transaction: `TEST_${Date.now()}`
                }
            }
        };

        console.log('📱 Telefone:', TEST_PHONE);
        console.log('👤 Nome:', TEST_NAME);
        console.log('📧 Email:', TEST_EMAIL);
        console.log('📦 Produto:', TEST_PRODUCT);

        const response = await axios.post(
            `${BACKEND_URL}/api/cart-abandonment/webhook`,
            payload
        );

        const eventId = response.data.event_id;
        console.log('\n✅ Evento criado com sucesso!');
        console.log('🆔 Event ID:', eventId);

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // PASSO 3: Aguardar processamento inicial
        console.log('⏳ PASSO 3: Aguardando processamento inicial (5 segundos)...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // PASSO 4: Verificar status e logs
        console.log('🔍 PASSO 4: Verificando status e logs...\n');

        // Login para obter token
        const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
            email: 'admin@crm.com',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Buscar evento
        const eventResponse = await axios.get(
            `${BACKEND_URL}/api/cart-abandonment/events?limit=1`,
            { headers }
        );

        const event = eventResponse.data.events[0];

        console.log('📊 STATUS DO EVENTO:');
        console.log('   ID:', event.id);
        console.log('   Status:', event.status);
        console.log('   Primeira mensagem enviada:', event.first_message_sent ? '✅ SIM' : '❌ NÃO');
        console.log('   Segunda mensagem enviada:', event.second_message_sent ? '✅ SIM' : '❌ NÃO');
        console.log('   Encontrado na campanha:', event.found_in_campaign ? '✅ SIM' : '❌ NÃO');
        console.log('   ManyChat Subscriber ID:', event.manychat_subscriber_id || 'Não encontrado');

        // Buscar logs
        const logsResponse = await axios.get(
            `${BACKEND_URL}/api/cart-abandonment/logs?event_id=${eventId}&limit=20`,
            { headers }
        );

        console.log('\n📝 LOGS DE PROCESSAMENTO:');
        logsResponse.data.logs.forEach(log => {
            const statusIcon = log.status === 'success' ? '✅' :
                log.status === 'error' ? '❌' : '⚠️';
            const time = new Date(log.created_at).toLocaleTimeString('pt-BR');
            console.log(`   [${time}] ${statusIcon} ${log.action_type}: ${log.message}`);
            if (log.error_message) {
                console.log(`      ❌ Erro: ${log.error_message}`);
            }
        });

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // PASSO 5: Instruções de verificação
        console.log('📱 PASSO 5: VERIFICAÇÃO NO MANYCHAT\n');
        console.log('   🔍 Telefone de teste:', TEST_PHONE);
        console.log('\n   ✅ O que verificar:');
        console.log('      1. Acesse ManyChat → Live Chat');
        console.log('      2. Busque pelo telefone:', TEST_PHONE);
        console.log('      3. Verifique se o contato foi criado/atualizado');
        console.log('      4. Verifique se a tag "' + settings.manychat_tag_name + '" foi aplicada');
        console.log('      5. Aguarde', settings.delay_minutes, 'minuto(s)');
        console.log('      6. Verifique se a tag "' + settings.manychat_tag_name_second + '" foi aplicada');

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // PASSO 6: Monitoramento contínuo
        console.log('🔄 PASSO 6: MONITORAMENTO CONTÍNUO\n');
        console.log('   ⏰ Aguardando', settings.delay_minutes, 'minuto(s) + 10 segundos para segunda tag...');
        console.log('   (Total:', (settings.delay_minutes * 60) + 10, 'segundos)\n');

        const totalWait = (settings.delay_minutes * 60 * 1000) + 10000;
        let elapsed = 0;
        const checkInterval = 15000; // Verificar a cada 15 segundos

        while (elapsed < totalWait) {
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            elapsed += checkInterval;

            // Verificar status atualizado
            const updatedEventResponse = await axios.get(
                `${BACKEND_URL}/api/cart-abandonment/events?limit=1`,
                { headers }
            );

            const updatedEvent = updatedEventResponse.data.events[0];
            const progress = Math.min(100, (elapsed / totalWait) * 100).toFixed(0);

            console.log(`   [${progress}%] Status: ${updatedEvent.status} | Tag 1: ${updatedEvent.first_message_sent ? '✅' : '⏳'} | Tag 2: ${updatedEvent.second_message_sent ? '✅' : '⏳'}`);

            if (updatedEvent.second_message_sent) {
                console.log('\n   ✅ Segunda tag aplicada com sucesso!');
                break;
            }
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // PASSO 7: Resultado final
        console.log('📊 PASSO 7: RESULTADO FINAL\n');

        const finalEventResponse = await axios.get(
            `${BACKEND_URL}/api/cart-abandonment/events?limit=1`,
            { headers }
        );

        const finalEvent = finalEventResponse.data.events[0];

        console.log('   Status Final:', finalEvent.status);
        console.log('   Primeira Tag:', finalEvent.first_message_sent ? '✅ APLICADA' : '❌ NÃO APLICADA');
        console.log('   Segunda Tag:', finalEvent.second_message_sent ? '✅ APLICADA' : '❌ NÃO APLICADA');
        console.log('   Encontrado na Campanha:', finalEvent.found_in_campaign ? '✅ SIM' : '❌ NÃO');

        // Buscar logs finais
        const finalLogsResponse = await axios.get(
            `${BACKEND_URL}/api/cart-abandonment/logs?event_id=${eventId}&limit=50`,
            { headers }
        );

        console.log('\n📝 LOGS FINAIS:');
        finalLogsResponse.data.logs.reverse().forEach(log => {
            const statusIcon = log.status === 'success' ? '✅' :
                log.status === 'error' ? '❌' : '⚠️';
            const time = new Date(log.created_at).toLocaleTimeString('pt-BR');
            console.log(`   [${time}] ${statusIcon} ${log.action_type}: ${log.message}`);
        });

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        if (finalEvent.first_message_sent && finalEvent.second_message_sent) {
            console.log('║  ✅ TESTE CONCLUÍDO COM SUCESSO!                          ║');
        } else {
            console.log('║  ⚠️  TESTE CONCLUÍDO COM AVISOS                           ║');
        }
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        console.log('📱 Verifique no ManyChat:');
        console.log('   Telefone:', TEST_PHONE);
        console.log('   Tags esperadas:', settings.manychat_tag_name, '+', settings.manychat_tag_name_second);
        console.log('');

    } catch (error) {
        console.error('\n❌ ERRO NO TESTE:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Dados:', error.response.data);
        }
        process.exit(1);
    }
}

runTest();
