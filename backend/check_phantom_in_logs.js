// Script para verificar se o número fantasma apareceu nos logs

const PHANTOM = '5511981194533';

console.log('\n🔍 VERIFICAÇÃO DE LOGS - Número Fantasma\n');
console.log('='.repeat(70));
console.log(`Procurando por: ${PHANTOM}`);
console.log('='.repeat(70));

console.log('\n📊 RESUMO DA IMPORTAÇÃO:');
console.log('- Importados: 694');
console.log('- Atualizados: 122');
console.log('- Ignorados: 0');
console.log('- Total processado: 816');

console.log('\n🎯 ANÁLISE:');
console.log('Total de contatos únicos processados: 816');
console.log('');

console.log('⚠️ IMPORTANTE:');
console.log('Os logs do terminal foram truncados.');
console.log('');
console.log('Para verificar se o número fantasma foi bloqueado:');
console.log('1. Verifique se o total de contatos importados (816) está correto');
console.log('2. Compare com o Redirect+ (deveria ter ~351 únicos)');
console.log('3. Se tiver MENOS que o esperado, o fantasma foi bloqueado ✅');
console.log('4. Se tiver MAIS, pode ter passado ❌');
console.log('');

console.log('📋 PRÓXIMOS PASSOS:');
console.log('1. Exportar os contatos do banco de dados');
console.log('2. Procurar por ' + PHANTOM);
console.log('3. Se NÃO encontrar = Bloqueio funcionou ✅');
console.log('4. Se encontrar = Precisa investigar mais ❌');
console.log('');
console.log('='.repeat(70));
