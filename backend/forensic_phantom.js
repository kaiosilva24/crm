/**
 * INVESTIGAÇÃO: Origem do Número Fantasma 5511981194533
 * 
 * Este script simula diferentes cenários de como o Baileys
 * pode estar gerando este número fantasma.
 */

const PHANTOM = '5511981194533';

console.log('\n🔬 INVESTIGAÇÃO FORENSE DO NÚMERO FANTASMA\n');
console.log('='.repeat(70));
console.log(`Número: ${PHANTOM}`);
console.log('='.repeat(70));

// Análise do número
console.log('\n📊 ANÁLISE DO NÚMERO:');
console.log('-'.repeat(70));
console.log(`Tamanho: ${PHANTOM.length} dígitos`);
console.log(`DDI: ${PHANTOM.substring(0, 2)} (Brasil)`);
console.log(`DDD: ${PHANTOM.substring(2, 4)} (São Paulo)`);
console.log(`Número: ${PHANTOM.substring(4)}`);
console.log(`3º dígito após DDD: ${PHANTOM.charAt(4)} ${PHANTOM.charAt(4) === '9' ? '✅ (celular)' : '❌ (fixo?)'}`);

// Possíveis formatos de ID do WhatsApp
console.log('\n🔍 POSSÍVEIS FORMATOS DE ID DO WHATSAPP:');
console.log('-'.repeat(70));

const possibleIds = [
    `${PHANTOM}@s.whatsapp.net`,
    `${PHANTOM}@c.us`,
    `${PHANTOM}@lid`,
    `${PHANTOM.substring(2)}@s.whatsapp.net`, // Sem DDI
    `55${PHANTOM}@s.whatsapp.net`, // Com DDI duplicado
];

possibleIds.forEach((id, i) => {
    console.log(`${i + 1}. ${id}`);
});

// Cenários de origem
console.log('\n🎯 CENÁRIOS POSSÍVEIS DE ORIGEM:');
console.log('-'.repeat(70));

const scenarios = [
    {
        name: 'Cenário 1: ID Direto',
        description: 'O participante tem ID = 5511981194533@s.whatsapp.net',
        likelihood: '⭐⭐⭐⭐⭐ (MAIS PROVÁVEL)',
        reason: 'Baileys pega o ID diretamente sem validar se existe',
        solution: 'Verificar se este ID realmente existe no grupo via groupMetadata'
    },
    {
        name: 'Cenário 2: Resolução onWhatsApp Incorreta',
        description: 'onWhatsApp() retornou este número para um LID',
        likelihood: '⭐⭐⭐',
        reason: 'API pode ter retornado número errado',
        solution: 'Verificar logs de onWhatsApp para este número'
    },
    {
        name: 'Cenário 3: Campo phoneNumber',
        description: 'Participante tem phoneNumber = "5511981194533"',
        likelihood: '⭐⭐',
        reason: 'Campo explícito mas pode estar desatualizado',
        solution: 'Verificar se campo phoneNumber existe e está correto'
    },
    {
        name: 'Cenário 4: Extraído do Nome',
        description: 'Nome/notify contém este número',
        likelihood: '⭐',
        reason: 'Improvável mas possível',
        solution: 'Verificar campos notify e verifiedName'
    },
    {
        name: 'Cenário 5: Cache/Sessão Antiga',
        description: 'Número estava no grupo mas saiu',
        likelihood: '⭐⭐⭐⭐',
        reason: 'Baileys pode estar usando cache desatualizado',
        solution: 'Limpar sessão e reconectar'
    }
];

scenarios.forEach((scenario, i) => {
    console.log(`\n${i + 1}. ${scenario.name}`);
    console.log(`   Descrição: ${scenario.description}`);
    console.log(`   Probabilidade: ${scenario.likelihood}`);
    console.log(`   Razão: ${scenario.reason}`);
    console.log(`   Solução: ${scenario.solution}`);
});

// Testes de validação
console.log('\n✅ TESTES DE VALIDAÇÃO:');
console.log('-'.repeat(70));

const tests = [
    { test: 'Tamanho', result: PHANTOM.length >= 10 && PHANTOM.length <= 15 ? '✅ PASSA' : '❌ FALHA' },
    { test: 'DDI Brasil (55)', result: PHANTOM.startsWith('55') ? '✅ PASSA' : '❌ FALHA' },
    { test: 'DDD Válido (11)', result: PHANTOM.substring(2, 4) === '11' ? '✅ PASSA' : '❌ FALHA' },
    { test: 'Celular (9 após DDD)', result: PHANTOM.charAt(4) === '9' ? '✅ PASSA' : '❌ FALHA' },
    { test: 'Apenas números', result: /^\d+$/.test(PHANTOM) ? '✅ PASSA' : '❌ FALHA' }
];

tests.forEach(t => {
    console.log(`${t.test.padEnd(25)} ${t.result}`);
});

console.log('\n⚠️ CONCLUSÃO PRELIMINAR:');
console.log('='.repeat(70));
console.log('O número 5511981194533 PASSA em todas as validações técnicas,');
console.log('mas NÃO EXISTE no grupo real.');
console.log('');
console.log('Isso indica que:');
console.log('1. O Baileys está retornando este ID em groupMetadata.participants');
console.log('2. O número é tecnicamente válido (formato correto)');
console.log('3. MAS o contato não está realmente no grupo');
console.log('');
console.log('PRÓXIMO PASSO:');
console.log('Executar uma importação real e capturar os logs completos');
console.log('para ver exatamente de onde este número está vindo.');
console.log('='.repeat(70));
console.log('');
