
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Tentar carregar. No Windows/Node pode precisar de caminho explicito se rodar da raiz
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    console.error('Expected: SUPABASE_URL, SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMirroring() {
    console.log('--- TESTANDO LÓGICA DE ESPELHAMENTO ---');

    // 1. Verificando se a coluna existe
    console.log('1. Verificando esquema da tabela campaigns...');
    const { data: check, error: checkError } = await supabase
        .from('campaigns')
        .select('id, name, mirror_campaign_id')
        .limit(1);

    if (checkError) {
        console.error('❌ ERRO CRÍTICO: Parece que a coluna mirror_campaign_id não existe!', checkError.message);
        console.error('Detalhes:', checkError);
        return;
    }
    console.log('✅ A coluna mirror_campaign_id existe.');

    // 2. Buscar campanhas com espelhamento
    console.log('2. Buscando campanhas com espelhamento configurado...');
    const { data: campaigns, error: campError } = await supabase
        .from('campaigns')
        .select('*')
        .not('mirror_campaign_id', 'is', null);

    if (campError) {
        console.error('Erro ao buscar campanhas:', campError);
        return;
    }

    if (!campaigns || campaigns.length === 0) {
        console.log('⚠️ Nenhuma campanha com espelhamento configurado encontrada.');

        // Listar todas para ver se a coluna existe
        const { data: all } = await supabase.from('campaigns').select('id, name, mirror_campaign_id').limit(5);
        console.log('Amostra de campanhas:', all);
        return;
    }

    console.log(`✅ Encontradas ${campaigns.length} campanhas com espelhamento.`);

    for (const camp of campaigns) {
        console.log(`\n-----------------------------------`);
        console.log(`Campanha Destino: [${camp.id}] ${camp.name}`);
        console.log(`Espelha Campanha: [${camp.mirror_campaign_id}]`);

        // 2. Buscar um lead qualquer na campanha de origem para teste
        console.log(`2. Buscando 1 lead na campanha origem (${camp.mirror_campaign_id})...`);
        const { data: leads, error: leadError } = await supabase
            .from('leads')
            .select('id, first_name, phone, email, seller_id')
            .eq('campaign_id', camp.mirror_campaign_id)
            .limit(1);

        if (leadError) {
            console.error('Erro ao buscar leads:', leadError);
            continue;
        }

        if (leads.length === 0) {
            console.log('⚠️ Nenhum lead encontrado na campanha de origem.');
            continue;
        }

        const sourceLead = leads[0];
        console.log('✅ Lead de Exemplo encontrado na Origem:');
        console.log(`   - ID: ${sourceLead.id}`);
        console.log(`   - Phone: ${sourceLead.phone}`);
        console.log(`   - Email: ${sourceLead.email}`);
        console.log(`   - Seller ID: ${sourceLead.seller_id}`);

        if (!sourceLead.seller_id) {
            console.log('⚠️ Lead de origem não tem vendedora. Espelhamento não funcionaria para ele.');
            continue;
        }

        // 3. Simular busca por Phone (lógica do backend)
        if (sourceLead.phone) {
            const phoneEnd = sourceLead.phone.replace(/\D/g, '').slice(-8);
            console.log(`3. Testando busca por final de telefone: "%${phoneEnd}"`);

            const { data: foundByPhone } = await supabase
                .from('leads')
                .select('seller_id')
                .eq('campaign_id', camp.mirror_campaign_id)
                .ilike('phone', `%${phoneEnd}`)
                .limit(1);

            if (foundByPhone && foundByPhone.length > 0) {
                console.log(`   ✅ SUCESSO! Lead encontrado via ilike phone.`);
                console.log(`   ➡️ Vendedora retornada: ${foundByPhone[0].seller_id}`);
            } else {
                console.log(`   ❌ FALHA! Lead não encontrado usando a mesma lógica do backend.`);
            }
        }
    }
}

testMirroring();
