// Teste de lógica para início do dia em Brasília

function getBrasiliaStartOfDay() {
    // Criar data atual
    const now = new Date();

    // Converter para string no fuso de Brasília para pegar ano, mês e dia corretos em Brasília
    // Ex: se for 23:00 UTC (20:00 BRT), queremos o dia de hoje em BRT, não amanhã
    const brasiliaDateStr = now.toLocaleDateString('en-US', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    // brasiliaDateStr vem como MM/DD/YYYY
    console.log('Data em Brasília (MM/DD/YYYY):', brasiliaDateStr);

    const [month, day, year] = brasiliaDateStr.split('/');

    // Criar data baseada nos componentes de Brasília, mas definindo como meia-noite
    // Importante: criar a string em formato ISO sem Z ou offset para o Date entender como local,
    // mas precisamos forçar que esse "local" seja interpretado como Brasília.
    // Uma abordagem melhor: Montar a string ISO com o offset de Brasília (-03:00)

    // Formato ISO: YYYY-MM-DDTHH:mm:ss.sss-03:00
    // Nota: Brasília pode ter horário de verão (embora abolido recentemente, é bom garantir ou usar lib, mas nativo é melhor se possível)
    // Vamos usar uma abordagem mais robusta:

    // 1. Pegar ano, mes, dia de Brasília
    // 2. Criar um objeto Date que representa 00:00 em Brasília

    // Criar data string YYYY-MM-DD
    const yyyyMmDd = `${year}-${month}-${day}`;

    // Criar data UTC transformando 00:00 BRT em UTC
    // 00:00 BRT é 03:00 UTC
    // Podemos usar o construtor Date com string e timeZone... não, Date construtor não aceita timeZone.

    // Abordagem segura:
    // Criar data a partir da string "YYYY-MM-DDT00:00:00" e assumir que é horário local, depois ajustar? Não.

    // Vamos usar o offset fixo de -3? Não, perigoso se mudar política.

    // Melhor approach:
    // Usar setHours/setMinutes... ajustando o fuso?

    // Vamos tentar:
    const targetDate = new Date();
    const brasiliaParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    }).formatToParts(targetDate);

    const part = (type) => brasiliaParts.find(p => p.type === type).value;

    const bYear = parseInt(part('year'));
    const bMonth = parseInt(part('month')) - 1; // Meses 0-11
    const bDay = parseInt(part('day'));

    // Agora temos o dia correto em Brasília.
    // Queremos 00:00:00 desse dia em Brasília.
    // Como representar isso em um objeto Date (que é UTC por dentro)?

    // Criar uma data arbitrária e ir ajustando até bater? Ineficiente.

    // Criar uma string com offset explícito seria ideal, mas JS nativo é chato com isso.

    // Vamos usar a diferença de fuso.
    // O offset de Brasília é geralmente -180 min (-3h).
    // Mas Date.prototype.getTimezoneOffset() retorna o offset do ambiente LOCAL do servidor, não de Brasília.

    // Hack robusto:
    // Criar data UTC "YYYY-MM-DDT03:00:00Z" (assumindo UTC-3 padrão)
    // E e se for horário de verão?

    // Vamos testar:
    // Construir string: "YYYY-MM-DDT00:00:00-03:00" (se tiver certeza do offset)

    // Solução mais confiável sem libs externas (como moment-timezone):
    // 1. Crie data em UTC para 00:00 do dia em questão: new Date(Date.UTC(bYear, bMonth, bDay, 0, 0, 0));
    // 2. Adicione 3 horas (10800000 ms) para compensar o UTC-3?

    // Vamos usar o método de "shift".
    const startOfBrasiliaDay = new Date(Date.UTC(bYear, bMonth, bDay, 3, 0, 0));
    // Isso assume UTC-3 sempre.

    return startOfBrasiliaDay.toISOString();
}

console.log('Inicio do dia em Brasília (UTC):', getBrasiliaStartOfDay());

// Teste comparativo com data atual
console.log('Agora (UTC):', new Date().toISOString());

// Simulação para verificar se cobre o caso
const testDate = new Date();
// Forçar timezone do script para ver comportamento do Intl
console.log('Intl check:', new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'full', timeStyle: 'long' }).format(testDate));
