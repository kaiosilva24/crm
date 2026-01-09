// Script para identificar o número fantasma 5511981194533

const PHANTOM_NUMBER = '5511981194533';

console.log('\n🔍 INVESTIGANDO NÚMERO FANTASMA\n');
console.log('='.repeat(60));
console.log(`Número suspeito: ${PHANTOM_NUMBER}`);
console.log('='.repeat(60));

// Análise do número
const cleaned = PHANTOM_NUMBER.replace(/\D/g, '');
console.log(`\nNúmero limpo: ${cleaned}`);
console.log(`Tamanho: ${cleaned.length} dígitos`);

// Verificar DDI
if (cleaned.length >= 12) {
    const ddi = cleaned.substring(0, 2);
    console.log(`DDI: ${ddi} ${ddi === '55' ? '(Brasil)' : '(Internacional)'}`);
}

// Remover DDI 55
let number = cleaned;
if (number.startsWith('55') && number.length > 11) {
    number = number.substring(2);
    console.log(`Sem DDI: ${number}`);
}

// Analisar DDD
const ddd = number.substring(0, 2);
console.log(`DDD: ${ddd}`);

// Verificar se é celular ou fixo
if (number.length === 11) {
    const thirdDigit = number.charAt(2);
    console.log(`Tipo: Celular (11 dígitos)`);
    console.log(`Terceiro dígito: ${thirdDigit} ${thirdDigit === '9' ? '✅' : '❌ (deveria ser 9)'}`);
} else if (number.length === 10) {
    console.log(`Tipo: Fixo (10 dígitos)`);
}

console.log('\n' + '='.repeat(60));
console.log('POSSÍVEIS CAUSAS:');
console.log('='.repeat(60));
console.log('1. Número foi extraído de um ID que não é LID');
console.log('2. Número foi resolvido via onWhatsApp mas está incorreto');
console.log('3. Número foi extraído do campo phoneNumber');
console.log('4. Número foi extraído do nome/notify');

console.log('\n' + '='.repeat(60));
console.log('AÇÃO RECOMENDADA:');
console.log('='.repeat(60));
console.log('Verificar logs do Baileys durante a importação para identificar');
console.log('de qual campo/método este número foi extraído.');
console.log('\nSe aparecer como "id(não-LID)", significa que o WhatsApp');
console.log('retornou este ID como participante, mas ele não existe no grupo.');
console.log('\n✅ Solução: Adicionar blacklist de números conhecidos como fantasmas');
console.log('='.repeat(60));
