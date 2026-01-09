/**
 * Script para atualizar telefones dos leads existentes da Hotmart
 * Busca o checkout_phone nos logs do webhook e atualiza os leads
 */

import { supabase } from './src/database/supabase.js';

// Função de normalização (mesma do hotmart.js)
function normalizePhone(phone) {
    if (!phone) return null;

    // Remove tudo que não é número
    let n = phone.replace(/\D/g, '');

    // Se tem menos de 10 dígitos, não é válido
    if (n.length < 10) return null;

    // Se não começa com 55 (DDI Brasil), adiciona
    if (!n.startsWith('55')) {
        n = '55' + n;
    }

    // Se tem 12 dígitos (55 + DDD + 8), adiciona o 9
    if (n.length === 12) {
        const ddd = n.substring(2, 4);
        const numero = n.substring(4);
        n = '55' + ddd + '9' + numero;
    }

    // Deve ter exatamente 13 dígitos
    if (n.length !== 13) {
        console.log(`⚠️ Telefone com tamanho inválido: ${n} (${n.length} dígitos)`);
        return null;
    }

    return n;
}

async function updateLeadsWithPhones() {
    console.log('🔄 Atualizando telefones dos leads da Hotmart...\n');

    // 1. Buscar todos os webhooks com sucesso
    const { data: logs } = await supabase
        .from('hotmart_webhook_logs')
        .select('payload, lead_uuid, buyer_email')
        .eq('status', 'success')
        .not('lead_uuid', 'is', null)
        .order('created_at', { ascending: false });

    console.log(`📊 Encontrados ${logs.length} webhooks com sucesso\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const log of logs) {
        try {
            const payload = JSON.parse(log.payload);
            const checkoutPhone = payload.data?.buyer?.checkout_phone;

            if (!checkoutPhone) {
                console.log(`⏭️ ${log.buyer_email}: Sem checkout_phone no payload`);
                skipped++;
                continue;
            }

            // Normalizar telefone
            const normalizedPhone = normalizePhone(checkoutPhone);

            if (!normalizedPhone) {
                console.log(`❌ ${log.buyer_email}: Telefone inválido (${checkoutPhone})`);
                errors++;
                continue;
            }

            // Atualizar lead
            const { error } = await supabase
                .from('leads')
                .update({ phone: normalizedPhone })
                .eq('uuid', log.lead_uuid);

            if (error) {
                console.log(`❌ ${log.buyer_email}: Erro ao atualizar - ${error.message}`);
                errors++;
            } else {
                console.log(`✅ ${log.buyer_email}: ${checkoutPhone} → ${normalizedPhone}`);
                updated++;
            }

        } catch (e) {
            console.log(`❌ Erro ao processar ${log.buyer_email}: ${e.message}`);
            errors++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO:');
    console.log(`✅ Atualizados: ${updated}`);
    console.log(`⏭️ Ignorados (sem telefone): ${skipped}`);
    console.log(`❌ Erros: ${errors}`);
    console.log('='.repeat(60));
}

updateLeadsWithPhones();
