import { supabase } from './src/database/supabase.js';

async function getSettings() {
    console.log('=== CONFIGURAÇÕES DE ABANDONO DE CARRINHO ===\n');

    const { data, error } = await supabase
        .from('cart_abandonment_settings')
        .select('*')
        .eq('id', 1)
        .single();

    if (error) {
        console.error('Erro:', error);
        return;
    }

    console.log('✅ Sistema Habilitado:', data.is_enabled ? 'SIM' : 'NÃO');
    console.log('📱 Token ManyChat:', data.manychat_api_token ? '✓ Configurado' : '✗ Não configurado');
    console.log('🏷️  Tag Primeira Mensagem:', data.manychat_tag_name || 'Não configurada');
    console.log('🏷️  Tag Segunda Mensagem:', data.manychat_tag_name_second || 'Não configurada');
    console.log('⏰ Delay (minutos):', data.delay_minutes || 'Não configurado');
    console.log('📊 Campanha ID:', data.campaign_id || 'Não configurada');
    console.log('\n===========================================\n');

    process.exit(0);
}

getSettings();
