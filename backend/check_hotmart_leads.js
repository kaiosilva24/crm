/**
 * Script para verificar leads de teste do Hotmart
 */

import { supabase } from './src/database/supabase.js';

async function checkHotmartLeads() {
    console.log('🔍 Verificando leads de teste do Hotmart...\n');

    try {
        // 1. Buscar leads que começam com "Teste"
        console.log('1️⃣ Leads que COMEÇAM com "Teste":');
        const { data: startsWithTest, error: error1 } = await supabase
            .from('leads')
            .select('uuid, first_name, email, phone, campaign_id, seller_id, created_at')
            .or('first_name.ilike.Teste%,email.ilike.teste%')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error1) {
            console.error('❌ Erro:', error1.message);
        } else {
            console.log(`Encontrados: ${startsWithTest?.length || 0}`);
            if (startsWithTest && startsWithTest.length > 0) {
                console.table(startsWithTest);
            } else {
                console.log('Nenhum lead encontrado que COMEÇA com "Teste"\n');
            }
        }

        // 2. Buscar leads que CONTÊM "teste" (em qualquer lugar)
        console.log('\n2️⃣ Leads que CONTÊM "teste" (em qualquer lugar):');
        const { data: containsTest, error: error2 } = await supabase
            .from('leads')
            .select('uuid, first_name, email, phone, campaign_id, seller_id, created_at')
            .or('first_name.ilike.%teste%,email.ilike.%teste%')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error2) {
            console.error('❌ Erro:', error2.message);
        } else {
            console.log(`Encontrados: ${containsTest?.length || 0}`);
            if (containsTest && containsTest.length > 0) {
                console.table(containsTest);
            } else {
                console.log('Nenhum lead encontrado que CONTÉM "teste"\n');
            }
        }

        // 3. Buscar últimos 5 leads criados (independente do nome)
        console.log('\n3️⃣ Últimos 5 leads criados (qualquer nome):');
        const { data: recentLeads, error: error3 } = await supabase
            .from('leads')
            .select('uuid, first_name, email, phone, campaign_id, seller_id, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error3) {
            console.error('❌ Erro:', error3.message);
        } else {
            console.log(`Total: ${recentLeads?.length || 0}`);
            if (recentLeads && recentLeads.length > 0) {
                console.table(recentLeads);
            }
        }

        // 4. Verificar logs do Hotmart
        console.log('\n4️⃣ Últimos webhooks do Hotmart:');
        const { data: logs, error: error4 } = await supabase
            .from('hotmart_webhook_logs')
            .select('id, event_type, status, buyer_name, buyer_email, lead_uuid, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error4) {
            console.error('❌ Erro:', error4.message);
        } else {
            console.log(`Total de webhooks: ${logs?.length || 0}`);
            if (logs && logs.length > 0) {
                console.table(logs);
            } else {
                console.log('Nenhum webhook registrado\n');
            }
        }

        // 5. Verificar se os UUIDs dos logs existem na tabela leads
        if (logs && logs.length > 0) {
            console.log('\n5️⃣ Verificando se os leads dos webhooks existem:');
            for (const log of logs) {
                if (log.lead_uuid) {
                    const { data: lead, error } = await supabase
                        .from('leads')
                        .select('uuid, first_name, email')
                        .eq('uuid', log.lead_uuid)
                        .single();

                    if (error) {
                        console.log(`❌ Lead ${log.lead_uuid}: NÃO ENCONTRADO (${error.message})`);
                    } else if (lead) {
                        console.log(`✅ Lead ${log.lead_uuid}: ${lead.first_name} (${lead.email})`);
                    } else {
                        console.log(`❌ Lead ${log.lead_uuid}: NÃO EXISTE`);
                    }
                }
            }
        }

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

checkHotmartLeads();
