import { findSubscriberByCustomField } from './src/services/manychatService.js';
import { supabase } from './src/database/supabase.js';

async function testCustomFieldSearch() {
    console.log('=== TESTE DE BUSCA VIA CUSTOM FIELD ===\n');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // Custom Field "phone" ID: 12655372
    const fieldId = 12655372;
    const phoneToTest = "5562983160896";

    console.log(`Buscando telefone: ${phoneToTest}`);
    console.log(`Field ID: ${fieldId}`);

    // A função findSubscriberByCustomField já testa múltiplos formatos (com e sem +)
    // graças à atualização anterior.

    const subscriberId = await findSubscriberByCustomField(fieldId, phoneToTest, token);

    if (subscriberId) {
        console.log(`\n✅ SUCESSO! ID Encontrado: ${subscriberId}`);
    } else {
        console.log(`\n❌ FALHA! Contato não encontrado por Custom Field.`);
        console.log(`Nota: Se o contato não tiver o Custom Field "phone" preenchido, a busca falhará.`);
        console.log(`Isso acontece se o contato entrou mas a automação do ManyChat não salvou o WhatsApp no campo phone.`);
    }
}

testCustomFieldSearch();
