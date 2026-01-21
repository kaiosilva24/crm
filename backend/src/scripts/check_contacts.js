import { supabase } from '../src/database/supabase.js';

async function checkLeads() {
    const { data, error } = await supabase
        .from('leads')
        .select('id, phone, first_name, source')
        .eq('source', 'whatsapp_group')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Erro:', error);
        return;
    }

    console.log('\n📊 Últimos 10 contatos importados dos grupos:\n');
    data.forEach((lead, i) => {
        console.log(`${i + 1}. Telefone: ${lead.phone} (${lead.phone.length} dígitos)`);
        console.log(`   Nome: ${lead.first_name}`);
        console.log('');
    });
}

checkLeads().then(() => process.exit(0));
