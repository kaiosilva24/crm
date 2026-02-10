/**
 * Script para testar se o auto-sync está configurado corretamente
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('='.repeat(70));
console.log('TESTE DE CONFIGURAÇÃO DO AUTO-SYNC');
console.log('='.repeat(70));

console.log('\n📋 Variáveis de Ambiente:');
console.log(`   AUTO_SYNC_ENABLED: ${process.env.AUTO_SYNC_ENABLED}`);
console.log(`   AUTO_SYNC_INTERVAL: ${process.env.AUTO_SYNC_INTERVAL}`);

console.log('\n✅ Valores Processados:');
const enabled = process.env.AUTO_SYNC_ENABLED === 'true';
const interval = parseInt(process.env.AUTO_SYNC_INTERVAL || '30');

console.log(`   Habilitado: ${enabled}`);
console.log(`   Intervalo: ${interval} minutos`);

if (enabled) {
    const cronExpression = `*/${interval} * * * *`;
    console.log(`   Expressão Cron: ${cronExpression}`);
    console.log('\n✅ Auto-sync DEVE estar ativo!');
    console.log(`   Próxima execução: a cada ${interval} minutos`);
} else {
    console.log('\n⚠️ Auto-sync está DESABILITADO');
}

console.log('\n' + '='.repeat(70));
