/**
 * Verificar telefones atualizados
 */

import { supabase } from './src/database/supabase.js';

async function checkPhones() {
    const { data: leads } = await supabase
        .from('leads')
        .select('first_name, email, phone, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

    console.log('📊 Últimos 10 leads:\n');
    leads.forEach((l, i) => {
        const tel = l.phone || 'SEM TELEFONE';
        const len = l.phone ? l.phone.length : 0;
        console.log(`${i + 1}. ${l.first_name.padEnd(20)} - ${tel.padEnd(15)} (${len} dígitos)`);
    });

    // Contar quantos têm telefone
    const { count: withPhone } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .not('phone', 'is', null)
        .neq('phone', '');

    const { count: total } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

    console.log(`\n📈 ESTATÍSTICAS:`);
    console.log(`Total de leads: ${total}`);
    console.log(`Com telefone: ${withPhone}`);
    console.log(`Sem telefone: ${total - withPhone}`);
}

checkPhones();
