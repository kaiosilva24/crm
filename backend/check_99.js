import { supabase } from './src/database/supabase.js';

async function quickCheck99() {
    const { data: event } = await supabase
        .from('cart_abandonment_events')
        .select('*')
        .eq('id', 99)
        .single();

    if (!event) {
        console.log('Evento 99 não encontrado');
        process.exit(1);
    }

    const { data: logs } = await supabase
        .from('cart_abandonment_logs')
        .select('*')
        .eq('event_id', 99)
        .order('created_at', { ascending: true });

    console.log('\n=== EVENTO 99 (5567981720357) ===\n');
    console.log('Status:', event.status);
    console.log('Subscriber ID:', event.manychat_subscriber_id || 'NÃO ENCONTRADO');
    console.log('Tag 1:', event.first_message_sent ? '✅' : '❌');
    console.log('Tag 2:', event.second_message_sent ? '✅' : '❌');

    console.log('\nLOGS:');
    logs.forEach(log => {
        const icon = log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '⚠️';
        console.log(`${icon} [${log.action_type}] ${log.message}`);
    });

    const errors = logs.filter(l => l.status === 'error');
    if (errors.length > 0) {
        console.log('\nERROS:');
        errors.forEach(err => {
            console.log(`• ${err.action_type}: ${err.message}`);
            if (err.error_message) console.log(`  ${err.error_message}`);
        });
    }

    process.exit(0);
}

quickCheck99();
