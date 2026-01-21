import { supabase } from './src/database/supabase.js';

async function monitorEvents() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  MONITORAMENTO EM TEMPO REAL                              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const eventIds = [97, 98];
    const phones = ['5567981720357', '5562983160896'];
    const startTime = Date.now();
    const maxWait = 90000; // 90 segundos

    console.log('⏰ Monitorando por até 90 segundos...\n');

    let allCompleted = false;
    let iteration = 0;

    while (!allCompleted && (Date.now() - startTime) < maxWait) {
        iteration++;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);

        console.log(`\n[${elapsed}s] Verificação #${iteration}:`);
        console.log('─'.repeat(60));

        let completedCount = 0;

        for (let i = 0; i < eventIds.length; i++) {
            const { data: event } = await supabase
                .from('cart_abandonment_events')
                .select('*')
                .eq('id', eventIds[i])
                .single();

            const tag1 = event.first_message_sent ? '✅' : '⏳';
            const tag2 = event.second_message_sent ? '✅' : '⏳';
            const subId = event.manychat_subscriber_id || 'N/A';

            console.log(`${i + 1}. ${phones[i]}`);
            console.log(`   Status: ${event.status} | Sub: ${subId}`);
            console.log(`   Tag1: ${tag1} | Tag2: ${tag2}`);

            if (event.status === 'completed') {
                completedCount++;
            }
        }

        if (completedCount === eventIds.length) {
            allCompleted = true;
            console.log('\n✅ Todos os eventos completados!');
            break;
        }

        // Aguardar 10 segundos antes da próxima verificação
        await new Promise(resolve => setTimeout(resolve, 10000));
    }

    // Resultado final
    console.log('\n\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  RESULTADO FINAL                                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    for (let i = 0; i < eventIds.length; i++) {
        const { data: event } = await supabase
            .from('cart_abandonment_events')
            .select('*')
            .eq('id', eventIds[i])
            .single();

        const { data: logs } = await supabase
            .from('cart_abandonment_logs')
            .select('*')
            .eq('event_id', eventIds[i])
            .order('created_at', { ascending: true });

        console.log(`\n${i + 1}. ${phones[i]} (Evento ${eventIds[i]})`);
        console.log('   Status:', event.status);
        console.log('   Subscriber:', event.manychat_subscriber_id || 'NÃO CRIADO');
        console.log('   Tag 1:', event.first_message_sent ? '✅ APLICADA' : '❌ NÃO APLICADA');
        console.log('   Tag 2:', event.second_message_sent ? '✅ APLICADA' : '❌ NÃO APLICADA');

        const errors = logs.filter(l => l.status === 'error');
        if (errors.length > 0) {
            console.log('   ❌ Erros:', errors.length);
            errors.forEach(err => {
                console.log(`      • ${err.action_type}: ${err.message}`);
            });
        } else {
            console.log('   ✅ Sem erros');
        }
    }

    console.log('\n');
    process.exit(0);
}

monitorEvents();
