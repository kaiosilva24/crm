import { supabase } from './src/database/supabase.js';

async function getAllRecentEvents() {
    console.log('\n=== TODOS OS EVENTOS RECENTES (últimas 48h) ===\n');

    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const { data: events } = await supabase
        .from('cart_abandonment_events')
        .select('*')
        .gte('created_at', twoDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

    console.log(`Total: ${events?.length || 0} eventos\n`);

    if (events && events.length > 0) {
        for (const event of events) {
            const createdAt = new Date(event.created_at);
            const tag1 = event.first_message_sent ? '✅' : '❌';
            const tag2 = event.second_message_sent ? '✅' : '❌';
            const subId = event.manychat_subscriber_id;

            console.log(`ID ${event.id} | ${createdAt.toLocaleString('pt-BR')} | ${event.status}`);
            console.log(`  ${event.contact_phone} | ${event.contact_name}`);
            console.log(`  Tag1: ${tag1} | Tag2: ${tag2} | Sub: ${subId || 'N/A'}`);
            console.log('');
        }
    }

    process.exit(0);
}

getAllRecentEvents();
