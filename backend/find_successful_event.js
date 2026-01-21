import { supabase } from './src/database/supabase.js';

async function findSuccessfulEvent() {
    console.log('\n=== BUSCANDO EVENTO BEM-SUCEDIDO DE ONTEM (19/01 ~22h) ===\n');

    // Buscar eventos de ontem que foram bem-sucedidos
    const yesterday = new Date('2026-01-19T22:00:00-03:00');
    const yesterdayEnd = new Date('2026-01-19T23:59:59-03:00');

    const { data: events } = await supabase
        .from('cart_abandonment_events')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .lte('created_at', yesterdayEnd.toISOString())
        .order('created_at', { ascending: false });

    console.log(`Encontrados ${events?.length || 0} eventos entre 22h-23:59h de 19/01\n`);

    if (events && events.length > 0) {
        for (const event of events) {
            const createdAt = new Date(event.created_at);
            console.log(`\n📊 Evento ID: ${event.id}`);
            console.log(`   Criado em: ${createdAt.toLocaleString('pt-BR')}`);
            console.log(`   Status: ${event.status}`);
            console.log(`   Telefone: ${event.contact_phone}`);
            console.log(`   Nome: ${event.contact_name}`);
            console.log(`   Subscriber ID: ${event.manychat_subscriber_id || 'N/A'}`);
            console.log(`   Tag 1: ${event.first_message_sent ? '✅ ENVIADA' : '❌'}`);
            console.log(`   Tag 2: ${event.second_message_sent ? '✅ ENVIADA' : '❌'}`);

            // Se encontrou um bem-sucedido, mostrar logs
            if (event.first_message_sent || event.second_message_sent) {
                const { data: logs } = await supabase
                    .from('cart_abandonment_logs')
                    .select('*')
                    .eq('event_id', event.id)
                    .order('created_at', { ascending: true });

                console.log(`\n   📝 Logs (${logs.length}):`);
                logs.forEach(log => {
                    const icon = log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '⚠️';
                    console.log(`      ${icon} [${log.action_type}] ${log.message}`);
                });
            }
        }
    } else {
        console.log('⚠️  Nenhum evento encontrado nesse horário');
        console.log('\nBuscando eventos bem-sucedidos das últimas 24h...\n');

        const { data: recentEvents } = await supabase
            .from('cart_abandonment_events')
            .select('*')
            .or('first_message_sent.eq.true,second_message_sent.eq.true')
            .order('created_at', { ascending: false })
            .limit(5);

        if (recentEvents && recentEvents.length > 0) {
            console.log(`Encontrados ${recentEvents.length} eventos bem-sucedidos recentes:\n`);
            recentEvents.forEach(event => {
                const createdAt = new Date(event.created_at);
                console.log(`   ID ${event.id}: ${createdAt.toLocaleString('pt-BR')} - Tag1: ${event.first_message_sent ? '✅' : '❌'} Tag2: ${event.second_message_sent ? '✅' : '❌'}`);
            });
        } else {
            console.log('❌ Nenhum evento bem-sucedido encontrado nas últimas 24h');
        }
    }

    process.exit(0);
}

findSuccessfulEvent();
