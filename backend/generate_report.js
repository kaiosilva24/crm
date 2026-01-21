import { supabase } from './src/database/supabase.js';
import fs from 'fs';

async function generateReport() {
    const { data: events } = await supabase
        .from('cart_abandonment_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    const event = events[0];

    const { data: logs } = await supabase
        .from('cart_abandonment_logs')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: true });

    const report = {
        event_id: event.id,
        status: event.status,
        contact_phone: event.contact_phone,
        contact_name: event.contact_name,
        contact_email: event.contact_email,
        manychat_subscriber_id: event.manychat_subscriber_id,
        first_message_sent: event.first_message_sent,
        first_message_sent_at: event.first_message_sent_at,
        second_message_sent: event.second_message_sent,
        second_message_sent_at: event.second_message_sent_at,
        found_in_campaign: event.found_in_campaign,
        created_at: event.created_at,
        logs: logs.map(log => ({
            action_type: log.action_type,
            status: log.status,
            message: log.message,
            error_message: log.error_message,
            created_at: log.created_at
        }))
    };

    fs.writeFileSync('test_report.json', JSON.stringify(report, null, 2));
    console.log('Relatório salvo em test_report.json');

    // Print summary
    console.log('\n=== RESUMO DO TESTE ===');
    console.log('Event ID:', report.event_id);
    console.log('Status:', report.status);
    console.log('Telefone:', report.contact_phone);
    console.log('Subscriber ID:', report.manychat_subscriber_id || 'NÃO ENCONTRADO');
    console.log('Primeira Tag:', report.first_message_sent ? '✅ APLICADA' : '❌ NÃO APLICADA');
    console.log('Segunda Tag:', report.second_message_sent ? '✅ APLICADA' : '❌ NÃO APLICADA');
    console.log('Total de logs:', report.logs.length);

    console.log('\n=== LOGS COM ERRO ===');
    const errorLogs = report.logs.filter(l => l.status === 'error');
    errorLogs.forEach(log => {
        console.log(`[${log.action_type}] ${log.message}`);
        if (log.error_message) {
            console.log(`  Erro: ${log.error_message}`);
        }
    });

    process.exit(0);
}

generateReport();
