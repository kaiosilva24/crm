/**
 * Script para salvar payload completo da Hotmart em arquivo
 */

import { supabase } from './src/database/supabase.js';
import fs from 'fs';

async function saveHotmartPayload() {
    const { data } = await supabase
        .from('hotmart_webhook_logs')
        .select('payload, buyer_name, buyer_email, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    const payload = JSON.parse(data.payload);

    const output = {
        buyer_name: data.buyer_name,
        buyer_email: data.buyer_email,
        created_at: data.created_at,
        payload: payload
    };

    fs.writeFileSync('hotmart_payload_sample.json', JSON.stringify(output, null, 2));
    console.log('✅ Payload salvo em: hotmart_payload_sample.json');
    console.log('\n📋 Resumo:');
    console.log('Nome:', data.buyer_name);
    console.log('Email:', data.buyer_email);
    console.log('\n🔍 Procurando telefone no payload...');

    // Procurar telefone em diferentes locais
    const locations = [
        { path: 'data.buyer.phone', value: payload.data?.buyer?.phone },
        { path: 'data.buyer.checkout.phone', value: payload.data?.buyer?.checkout?.phone },
        { path: 'data.buyer.contact.phone', value: payload.data?.buyer?.contact?.phone },
        { path: 'data.purchase.buyer.phone', value: payload.data?.purchase?.buyer?.phone },
        { path: 'buyer.phone', value: payload.buyer?.phone }
    ];

    locations.forEach(loc => {
        if (loc.value) {
            console.log(`✅ ENCONTRADO em ${loc.path}:`, loc.value);
        } else {
            console.log(`❌ NÃO encontrado em ${loc.path}`);
        }
    });
}

saveHotmartPayload();
