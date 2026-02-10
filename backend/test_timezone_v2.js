// Teste de lógica para início do dia em Brasília - CORRIGIDO

function getBrasiliaStartOfDay() {
    const now = new Date();

    // Obter componentes da data no fuso de Brasília
    const options = { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(now);

    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;

    console.log(`Data em Brasília: ${day}/${month}/${year}`);

    // Criar string ISO com offset -03:00 (Brasília padrão)
    // Nota: Se houver horário de verão, isso pode variar, mas atualmente o Brasil não tem horário de verão.
    // O offset -03:00 é seguro para a maior parte do ano/casos recentes.
    const isoString = `${year}-${month}-${day}T00:00:00.000-03:00`;

    const date = new Date(isoString);
    return date.toISOString();
}

console.log('--- TESTE DE FUSO HORÁRIO ---');
const utcStart = getBrasiliaStartOfDay();
console.log('Início do dia em Brasília (UTC para query):', utcStart);

// Verificação:
// Se hoje é 10/02, 00:00 BRT
// Então deve ser 10/02, 03:00 UTC
// Resultado esperado: 2026-02-10T03:00:00.000Z
