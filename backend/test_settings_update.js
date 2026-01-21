// Teste rápido de atualização de settings
import { db } from './src/database/supabase.js';

console.log('🧪 Testando atualização de settings...');

try {
    // Buscar settings atuais
    const current = await db.getApiSettings();
    console.log('📋 Settings atuais:', current);

    // Tentar atualizar
    console.log('\n📝 Tentando atualizar round_robin_enabled para false...');
    const result = await db.upsertApiSettings({ round_robin_enabled: false });
    console.log('✅ Resultado:', result);

    // Verificar
    const updated = await db.getApiSettings();
    console.log('\n📋 Settings após update:', updated);

    process.exit(0);
} catch (error) {
    console.error('❌ Erro:', error);
    console.error('Detalhes:', error.message, error.code, error.details);
    process.exit(1);
}
