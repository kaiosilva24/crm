import 'dotenv/config';
import { supabase } from './src/database/supabase.js';

async function debugHotmartWebhook() {
    console.log('🔍 INVESTIGANDO WEBHOOK HOTMART → ALUNOS AVANÇADO\n');

    try {
        // 1. Verificar configuração do webhook Hotmart
        console.log('1️⃣ Verificando configurações de webhook Hotmart...\n');

        const { data: webhookConfigs, error: webhookError } = await supabase
            .from('hotmart_webhook_configs')
            .select('*')
            .order('webhook_number');

        if (webhookError) {
            console.error('❌ Erro ao buscar configs:', webhookError);
            return;
        }

        if (!webhookConfigs || webhookConfigs.length === 0) {
            console.log('⚠️ NENHUMA configuração de webhook Hotmart encontrada!\n');
        } else {
            console.log(`📊 Total de webhooks configurados: ${webhookConfigs.length}\n`);

            for (const config of webhookConfigs) {
                console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
                console.log(`🔗 Webhook #${config.webhook_number}`);
                console.log(`   Habilitado: ${config.is_enabled ? '✅ Sim' : '❌ Não'}`);
                console.log(`   Round-Robin: ${config.enable_round_robin ? '✅ Sim' : '❌ Não'}`);

                // Buscar nome da campanha
                const { data: campaign } = await supabase
                    .from('campaigns')
                    .select('id, name, mirror_sales_source_id')
                    .eq('id', config.campaign_id)
                    .single();

                if (campaign) {
                    console.log(`   📁 Campanha: ${campaign.name} (ID: ${campaign.id})`);

                    if (campaign.mirror_sales_source_id) {
                        console.log(`   ⚠️ ATENÇÃO: Esta campanha TEM mirror_sales_source_id = ${campaign.mirror_sales_source_id}`);
                        console.log(`   ⚠️ Isso significa que ELA está esperando espelhar de outra campanha.`);
                        console.log(`   ⚠️ Mas o webhook cria leads NESTA campanha, então não vai funcionar!`);
                    }
                } else {
                    console.log(`   ❌ Campanha ID ${config.campaign_id} não encontrada!`);
                }

                console.log(`   🌐 URL: /api/hotmart/webhook${config.webhook_number}`);
                console.log('');
            }
        }

        // 2. Verificar qual webhook aponta para "ALUNOS AVANÇADO"
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('2️⃣ Procurando webhook que aponta para ALUNOS AVANÇADO...\n');

        const alunosAvancadoWebhook = webhookConfigs?.find(w => w.campaign_id === 7);

        if (alunosAvancadoWebhook) {
            console.log('✅ ENCONTRADO!');
            console.log(`   Webhook #${alunosAvancadoWebhook.webhook_number}`);
            console.log(`   Habilitado: ${alunosAvancadoWebhook.is_enabled ? '✅ Sim' : '❌ Não'}`);
            console.log(`   URL: /api/hotmart/webhook${alunosAvancadoWebhook.webhook_number}\n`);
        } else {
            console.log('❌ NÃO ENCONTRADO!');
            console.log('   Nenhum webhook está configurado para criar leads em ALUNOS AVANÇADO.\n');
        }

        // 3. Verificar logs recentes do webhook
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('3️⃣ Verificando logs recentes de webhook Hotmart...\n');

        const { data: logs } = await supabase
            .from('hotmart_webhook_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (!logs || logs.length === 0) {
            console.log('⚠️ Nenhum log de webhook encontrado.\n');
        } else {
            console.log(`📊 Últimos ${logs.length} eventos:\n`);

            for (const log of logs) {
                console.log(`   📅 ${new Date(log.created_at).toLocaleString('pt-BR')}`);
                console.log(`   📧 ${log.buyer_email || 'N/A'}`);
                console.log(`   👤 ${log.buyer_name || 'N/A'}`);
                console.log(`   📦 ${log.product_name || 'N/A'}`);
                console.log(`   ✅ Status: ${log.status}`);
                console.log(`   🆔 Lead UUID: ${log.lead_uuid || 'N/A'}`);
                if (log.error_message) {
                    console.log(`   ❌ Erro: ${log.error_message}`);
                }
                console.log('');
            }
        }

        // 4. Verificar campanhas com mirror configurado
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('4️⃣ Campanhas que espelham compradores:\n');

        const { data: mirroringCampaigns } = await supabase
            .from('campaigns')
            .select('id, name, mirror_sales_source_id')
            .not('mirror_sales_source_id', 'is', null);

        if (!mirroringCampaigns || mirroringCampaigns.length === 0) {
            console.log('⚠️ Nenhuma campanha configurada para espelhar compradores.\n');
        } else {
            for (const camp of mirroringCampaigns) {
                const { data: source } = await supabase
                    .from('campaigns')
                    .select('name')
                    .eq('id', camp.mirror_sales_source_id)
                    .single();

                console.log(`   📁 ${camp.name}`);
                console.log(`      💰 Espelha de: ${source?.name || `ID ${camp.mirror_sales_source_id}`}`);
                console.log('');
            }
        }

        // 5. Resumo e diagnóstico
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 DIAGNÓSTICO:\n');

        if (alunosAvancadoWebhook && alunosAvancadoWebhook.is_enabled) {
            console.log('✅ Webhook configurado para ALUNOS AVANÇADO');
        } else {
            console.log('❌ Webhook NÃO configurado ou desabilitado para ALUNOS AVANÇADO');
        }

        const lp06Mirror = mirroringCampaigns?.find(c => c.id === 10);
        if (lp06Mirror && lp06Mirror.mirror_sales_source_id === 7) {
            console.log('✅ LP 06 JAN SUPER INTERESSADOS configurada para espelhar de ALUNOS AVANÇADO');
        } else {
            console.log('❌ LP 06 JAN SUPER INTERESSADOS NÃO configurada corretamente');
        }

        console.log('\n💡 Para funcionar, você precisa:');
        console.log('   1. Webhook Hotmart apontando para ALUNOS AVANÇADO (ID: 7)');
        console.log('   2. LP 06 JAN SUPER INTERESSADOS com mirror_sales_source_id = 7');
        console.log('   3. Quando webhook criar lead em ALUNOS AVANÇADO, o mirrorService será chamado');
        console.log('   4. O mirrorService vai buscar campanhas que espelham a campanha 7');
        console.log('   5. Vai encontrar LP 06 e marcar o lead como vendido lá\n');

    } catch (error) {
        console.error('❌ Erro:', error);
    }

    process.exit(0);
}

debugHotmartWebhook();
