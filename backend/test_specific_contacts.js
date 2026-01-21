import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const BACKEND_URL = 'http://localhost:3001';

const CONTACTS = [
    {
        phone: '5567981720357',
        name: 'Contato Teste 1',
        email: 'contato1.teste@email.com'
    },
    {
        phone: '5562983160896',
        name: 'Contato Teste 2',
        email: 'contato2.teste@email.com'
    }
];

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  TESTE COM CONTATOS ESPECÍFICOS                           ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function testContact(contact, index) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TESTE ${index + 1}/2: ${contact.phone}`);
    console.log('='.repeat(60));

    try {
        // Enviar evento
        console.log('\n📤 Enviando evento de abandono...');
        console.log('   Telefone:', contact.phone);
        console.log('   Nome:', contact.name);
        console.log('   Email:', contact.email);

        const payload = {
            event: 'PURCHASE_CANCELED',
            data: {
                buyer: {
                    name: contact.name,
                    email: contact.email,
                    phone: contact.phone,
                    checkout_phone: contact.phone
                },
                product: {
                    name: `Produto Teste ${index + 1}`
                },
                purchase: {
                    transaction: `TEST_CONTACT_${index + 1}_${Date.now()}`
                }
            }
        };

        const response = await axios.post(
            `${BACKEND_URL}/api/cart-abandonment/webhook`,
            payload
        );

        const eventId = response.data.event_id;
        console.log('✅ Evento criado! ID:', eventId);

        // Aguardar processamento inicial
        console.log('\n⏳ Aguardando 8 segundos para processamento inicial...');
        await new Promise(resolve => setTimeout(resolve, 8000));

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

        console.log('\n📊 RESULTADO PARCIAL (após 8s):');
        console.log('   Status:', event.status);
        console.log('   Subscriber ID:', event.manychat_subscriber_id || '⏳ Processando...');
        console.log('   Tag 1:', event.first_message_sent ? '✅ APLICADA' : '⏳ Processando...');
        console.log('   Tag 2:', event.second_message_sent ? '✅ APLICADA' : '⏳ Aguardando delay...');

        console.log('\n📝 LOGS ATÉ AGORA:');
        logs.forEach(log => {
            const icon = log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '⚠️';
            console.log(`   ${icon} [${log.action_type}] ${log.message}`);
            if (log.error_message) {
                console.log(`      ⚠️  Erro: ${log.error_message}`);
            }
        });

        // Verificar se houve erro
        const errorLogs = logs.filter(l => l.status === 'error');
        if (errorLogs.length > 0) {
            console.log('\n❌ ERROS DETECTADOS:');
            errorLogs.forEach(log => {
                console.log(`   • ${log.action_type}: ${log.message}`);
                if (log.error_message) {
                    console.log(`     Detalhes: ${log.error_message}`);
                }
            });
        }

        return {
            eventId,
            phone: contact.phone,
            status: event.status,
            subscriberId: event.manychat_subscriber_id,
            tag1: event.first_message_sent,
            tag2: event.second_message_sent,
            hasErrors: errorLogs.length > 0
        };

    } catch (error) {
        console.error('\n❌ ERRO NO TESTE:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Dados:', JSON.stringify(error.response.data, null, 2));
        }
        return {
            phone: contact.phone,
            error: error.message,
            hasErrors: true
        };
    }
}

async function runAllTests() {
    const results = [];

    for (let i = 0; i < CONTACTS.length; i++) {
        const result = await testContact(CONTACTS[i], i);
        results.push(result);

        // Pequeno delay entre testes
        if (i < CONTACTS.length - 1) {
            console.log('\n⏳ Aguardando 3 segundos antes do próximo teste...\n');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }

    // Resumo final
    console.log('\n\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  RESUMO DOS TESTES                                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    results.forEach((result, index) => {
        console.log(`TESTE ${index + 1}: ${result.phone}`);
        if (result.error) {
            console.log('   ❌ ERRO:', result.error);
        } else {
            console.log('   Event ID:', result.eventId);
            console.log('   Status:', result.status);
            console.log('   Subscriber:', result.subscriberId || 'N/A');
            console.log('   Tag 1:', result.tag1 ? '✅' : '❌');
            console.log('   Tag 2:', result.tag2 ? '✅' : '⏳ (aguardando delay)');
            console.log('   Erros:', result.hasErrors ? '❌ SIM' : '✅ NÃO');
        }
        console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  IMPORTANTE:');
    console.log('   • A segunda tag será aplicada após o delay configurado (1 minuto)');
    console.log('   • Aguarde mais ~1 minuto e verifique os eventos novamente');
    console.log('   • Use: node get_event_report.js [EVENT_ID] para ver detalhes\n');

    console.log('📋 Event IDs criados:');
    results.forEach((result, index) => {
        if (result.eventId) {
            console.log(`   ${index + 1}. ${result.phone}: Event ID ${result.eventId}`);
        }
    });
    console.log('');

    process.exit(0);
}

runAllTests();
