import { supabase } from './src/database/supabase.js';

async function createErrorEvent() {
    console.log('Creating simulated ERROR event...');

    const { data, error } = await supabase
        .from('cart_abandonment_events')
        .insert({
            contact_name: 'Erro Simulado',
            contact_phone: '5511999999999',
            contact_email: 'erro@teste.com',
            product_name: 'Produto Teste Erro',
            status: 'error',
            error_message: 'Simulando falha no ManyChat (Tag não encontrada)',
            first_message_sent: false,
            second_message_sent: false,
            processed_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('❌ Failed to insert:', error.message);
    } else {
        console.log('✅ Simulated Error Event created:', data.id);
        console.log('Please check the Frontend to see if it appears in the "Contatos com Erro" list.');
    }
}

createErrorEvent();
