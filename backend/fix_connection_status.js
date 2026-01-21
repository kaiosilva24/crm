/**
 * Atualizar status da conexão WhatsApp para 'connected'
 */

import { supabase } from './src/database/supabase.js';

async function updateConnectionStatus() {
    const connectionId = '2c2c8f01-62bc-43b1-b531-1346582a3b25';

    console.log('🔄 Atualizando status da conexão...');

    const { data, error } = await supabase
        .from('whatsapp_connections')
        .update({
            status: 'connected',
            updated_at: new Date().toISOString()
        })
        .eq('id', connectionId)
        .select();

    if (error) {
        console.error('❌ Erro:', error);
    } else {
        console.log('✅ Status atualizado:', data);
    }
}

updateConnectionStatus();
