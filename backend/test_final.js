import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const BACKEND_URL = 'http://localhost:3001';
const TEST_PHONE = '5511999887766'; // Número diferente para evitar duplicata
const TEST_NAME = 'Teste Final Abandono';
const TEST_EMAIL = 'teste.final@email.com';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  TESTE FINAL - ABANDONO DE CARRINHO                       ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function runFinalTest() {
    try {
        // Enviar evento
        console.log('📤 Enviando evento de abandono...');
        console.log('   Telefone:', TEST_PHONE);
        console.log('   Nome:', TEST_NAME);
        console.log('   Email:', TEST_EMAIL);

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
                    name: 'Produto Teste Final'
                },
                purchase: {
                    transaction: `TEST_FINAL_${Date.now()}`
                }
            }
        };

        const response = await axios.post(
            `${BACKEND_URL}/api/cart-abandonment/webhook`,
            payload
        );

        const eventId = response.data.event_id;
        console.log('✅ Evento criado! ID:', eventId);

        // Aguardar processamento
        console.log('\n⏳ Aguardando 10 segundos para processamento inicial...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Verificar resultado
        const { data: event } = await supabase
            .from('cart_abandonment_events')
            .select('*')
            .eq('id', eventId)
            .single();

        const { data: logs } = await supabase
            .from('cart_abandonment_logs')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: true });

        console.log('\n📊 RESULTADO:');
        console.log('   Status:', event.status);
        console.log('   Subscriber ID:', event.manychat_subscriber_id || 'NÃO CRIADO');
        console.log('   Tag 1:', event.first_message_sent ? '✅' : '❌');
        console.log('   Tag 2:', event.second_message_sent ? '✅' : '❌');

        console.log('\n📝 LOGS:');
        logs.forEach(log => {
            const icon = log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '⚠️';
            console.log(`   ${icon} [${log.action_type}] ${log.message}`);
            if (log.error_message) {
                console.log(`      Erro: ${log.error_message}`);
            }
        });

        // Se houver erro, mostrar detalhes
        const errorLogs = logs.filter(l => l.status === 'error');
        if (errorLogs.length > 0) {
            console.log('\n❌ ERROS ENCONTRADOS:');
            errorLogs.forEach(log => {
                console.log(`\n   Ação: ${log.action_type}`);
                console.log(`   Mensagem: ${log.message}`);
                if (log.error_message) {
                    console.log(`   Detalhes: ${log.error_message}`);
                }
            });
        }

        console.log('\n╚════════════════════════════════════════════════════════════╝\n');

    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Dados:', error.response.data);
        }
    }

    process.exit(0);
}

runFinalTest();
