import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001';
const TEST_PHONE = '5567981720357'; // Contato que só tem WhatsApp
const TEST_NAME = 'Teste WhatsApp Only';
const TEST_EMAIL = 'teste.whatsapp@email.com';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  TESTE COM CONTATO WHATSAPP-ONLY                          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function testWhatsAppContact() {
    try {
        console.log('📱 Testando contato:', TEST_PHONE);
        console.log('   (Este contato existe apenas com whatsapp_phone)\n');

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
                    name: 'Produto Teste WhatsApp'
                },
                purchase: {
                    transaction: `TEST_WA_${Date.now()}`
                }
            }
        };

        console.log('📤 Enviando evento...');
        const response = await axios.post(
            `${BACKEND_URL}/api/cart-abandonment/webhook`,
            payload
        );

        const eventId = response.data.event_id;
        console.log('✅ Evento criado! ID:', eventId);
        console.log('\n⏳ Aguardando 8 segundos para processamento...\n');

        await new Promise(resolve => setTimeout(resolve, 8000));

        // Verificar resultado
        const { supabase } = await import('./src/database/supabase.js');

        const { data: event } = await supabase
            .from('cart_abandonment_events')
            .select('*')
            .eq('id', eventId)
            .single();

        const { data: logs } = await supabase
            .from('cart_abandonment_logs')
            .select('*')
            .eq('id', eventId)
            .order('created_at', { ascending: true });

        console.log('📊 RESULTADO:');
        console.log('   Status:', event.status);
        console.log('   Subscriber ID:', event.manychat_subscriber_id || '❌ NÃO ENCONTRADO');
        console.log('   Tag 1:', event.first_message_sent ? '✅ APLICADA' : '❌ NÃO APLICADA');
        console.log('   Tag 2:', event.second_message_sent ? '✅ APLICADA' : '⏳ Aguardando delay');

        console.log('\n📝 LOGS:');
        logs.forEach(log => {
            const icon = log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '⚠️';
            console.log(`   ${icon} [${log.action_type}] ${log.message}`);
        });

        const errors = logs.filter(l => l.status === 'error');
        if (errors.length > 0) {
            console.log('\n❌ ERROS:');
            errors.forEach(err => {
                console.log(`   • ${err.action_type}: ${err.message}`);
                if (err.error_message) {
                    console.log(`     ${err.error_message}`);
                }
            });
        } else {
            console.log('\n✅ Nenhum erro detectado!');
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

testWhatsAppContact();
