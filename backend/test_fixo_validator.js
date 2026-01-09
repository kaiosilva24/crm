// Teste do validador de telefones fixos

import { isValidBrazilianPhone } from './src/utils/phoneValidator.js';

const FIXO = '551134840929';

console.log('\n🧪 TESTE DO VALIDADOR - Telefone Fixo\n');
console.log('='.repeat(70));
console.log(`Número: ${FIXO}`);
console.log('='.repeat(70));

console.log('\n📊 Análise:');
console.log(`Tamanho: ${FIXO.length} dígitos`);
console.log(`DDI: ${FIXO.substring(0, 2)} (Brasil)`);
console.log(`DDD: ${FIXO.substring(2, 4)} (São Paulo)`);
console.log(`Número: ${FIXO.substring(4)} (${FIXO.length - 4} dígitos)`);
console.log(`Tipo: ${FIXO.length - 2 === 10 ? 'FIXO (10 dígitos)' : 'CELULAR (11 dígitos)'}`);

console.log('\n🔬 Testando validação...\n');

const isValid = isValidBrazilianPhone(FIXO);

console.log('='.repeat(70));
if (isValid) {
    console.log('✅ RESULTADO: Número VÁLIDO');
    console.log('');
    console.log('O validador está funcionando corretamente.');
    console.log('O número fixo deveria ter sido importado.');
    console.log('');
    console.log('POSSÍVEL CAUSA:');
    console.log('- O número não existe no grupo que você sincronizou');
    console.log('- Ou foi importado com normalização diferente');
} else {
    console.log('❌ RESULTADO: Número INVÁLIDO');
    console.log('');
    console.log('PROBLEMA IDENTIFICADO:');
    console.log('O validador está rejeitando telefones fixos!');
    console.log('Precisa ajustar a validação.');
}
console.log('='.repeat(70));
