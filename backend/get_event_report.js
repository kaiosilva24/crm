import { supabase } from './src/database/supabase.js';
import fs from 'fs';

async function getEventReport(eventId) {
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

    fs.writeFileSync(`event_${eventId}_report.json`, JSON.stringify(report, null, 2));

    console.log(`\n=== EVENTO ${eventId} ===`);
    console.log('Status:', report.status);
    console.log('Subscriber ID:', report.manychat_subscriber_id || 'NÃO ENCONTRADO');
    console.log('Tag 1:', report.first_message_sent ? '✅ APLICADA' : '❌ NÃO APLICADA');
    console.log('Tag 2:', report.second_message_sent ? '✅ APLICADA' : '❌ NÃO APLICADA');
    console.log('\nLogs:', report.logs.length);
    report.logs.forEach(log => {
        const icon = log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '⚠️';
        console.log(`${icon} [${log.action_type}] ${log.message}`);
        if (log.error_message) console.log(`   Erro: ${log.error_message}`);
    });

    process.exit(0);
}

const eventId = process.argv[2] || 94;
getEventReport(eventId);
