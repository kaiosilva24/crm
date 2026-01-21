import { supabase } from './src/database/supabase.js';

async function getBothEvents() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  RESULTADOS DOS TESTES COM CONTATOS ESPECÍFICOS           ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const eventIds = [97, 98];
    const phones = ['5567981720357', '5562983160896'];

    for (let i = 0; i < eventIds.length; i++) {
        const eventId = eventIds[i];
        const phone = phones[i];

        console.log(`\n${'='.repeat(60)}`);
        console.log(`CONTATO ${i + 1}: ${phone} (Evento ID: ${eventId})`);
        console.log('='.repeat(60));

        const { data: event } = await supabase
            .from('cart_abandonment_events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (!event) {
            console.log('❌ Evento não encontrado');
            continue;
        }

        const { data: logs } = await supabase
            .from('cart_abandonment_logs')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: true });

        console.log('\n📊 STATUS:');
        console.log('   Status:', event.status);
        console.log('   Subscriber ID:', event.manychat_subscriber_id || 'NÃO CRIADO');
        console.log('   Tag 1:', event.first_message_sent ? '✅ APLICADA' : '❌ NÃO APLICADA');
        console.log('   Tag 2:', event.second_message_sent ? '✅ APLICADA' : '❌ NÃO APLICADA');
        console.log('   Encontrado na campanha:', event.found_in_campaign ? 'SIM' : 'NÃO');

        console.log('\n📝 LOGS (' + logs.length + '):');
        logs.forEach(log => {
            const icon = log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '⚠️';
            console.log(`   ${icon} [${log.action_type}] ${log.message}`);
            if (log.error_message) {
                console.log(`      ⚠️  Erro: ${log.error_message}`);
            }
        });

        // Verificar erros
        const errors = logs.filter(l => l.status === 'error');
        if (errors.length > 0) {
            console.log('\n❌ ERROS ENCONTRADOS:');
            errors.forEach(err => {
                console.log(`   • ${err.action_type}: ${err.message}`);
                if (err.error_message) {
                    console.log(`     ${err.error_message}`);
                }
            });
        }
    }

    console.log('\n\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  RESUMO FINAL                                              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    for (let i = 0; i < eventIds.length; i++) {
        const { data: event } = await supabase
            .from('cart_abandonment_events')
            .select('*')
            .eq('id', eventIds[i])
            .single();

        const tag1 = event.first_message_sent ? '✅' : '❌';
        const tag2 = event.second_message_sent ? '✅' : '❌';

        console.log(`${i + 1}. ${phones[i]}`);
        console.log(`   Event ID: ${eventIds[i]}`);
        console.log(`   Status: ${event.status}`);
        console.log(`   Tag 1: ${tag1} | Tag 2: ${tag2}`);
        console.log(`   Subscriber: ${event.manychat_subscriber_id || 'N/A'}`);
        console.log('');
    }

    process.exit(0);
}

getBothEvents();
