import { supabase } from './src/database/supabase.js';
import fs from 'fs';

async function generateFinalReport() {
    const eventIds = [97, 98];
    const phones = ['5567981720357', '5562983160896'];
    const report = {
        timestamp: new Date().toISOString(),
        events: []
    };

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

        report.events.push({
            event_id: eventIds[i],
            phone: phones[i],
            status: event.status,
            subscriber_id: event.manychat_subscriber_id,
            first_message_sent: event.first_message_sent,
            second_message_sent: event.second_message_sent,
            found_in_campaign: event.found_in_campaign,
            created_at: event.created_at,
            logs: logs
        });
    }

    fs.writeFileSync('final_test_report.json', JSON.stringify(report, null, 2));

    // Print summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  RELATÓRIO FINAL - TESTES COM CONTATOS ESPECÍFICOS        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    report.events.forEach((ev, idx) => {
        console.log(`\n${idx + 1}. ${ev.phone} (Evento ${ev.event_id})`);
        console.log('   ─'.repeat(30));
        console.log('   Status:', ev.status);
        console.log('   Subscriber ID:', ev.subscriber_id || 'NÃO CRIADO');
        console.log('   Tag 1:', ev.first_message_sent ? '✅ APLICADA' : '❌ NÃO APLICADA');
        console.log('   Tag 2:', ev.second_message_sent ? '✅ APLICADA' : '❌ NÃO APLICADA');
        console.log('   Campanha:', ev.found_in_campaign ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
        console.log('   Total de logs:', ev.logs.length);

        const errors = ev.logs.filter(l => l.status === 'error');
        const successes = ev.logs.filter(l => l.status === 'success');

        console.log('   Sucessos:', successes.length);
        console.log('   Erros:', errors.length);

        if (errors.length > 0) {
            console.log('\n   ❌ ERROS:');
            errors.forEach(err => {
                console.log(`      • [${err.action_type}] ${err.message}`);
                if (err.error_message) {
                    console.log(`        ${err.error_message}`);
                }
            });
        }
    });

    console.log('\n\n📄 Relatório completo salvo em: final_test_report.json\n');

    process.exit(0);
}

generateFinalReport();
