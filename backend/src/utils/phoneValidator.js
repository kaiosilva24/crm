/**
 * CORREÇÃO: Validação rigorosa para evitar números fantasmas do Baileys
 * 
 * PROBLEMA IDENTIFICADO:
 * - Baileys estava gerando 3 números que NÃO existem no grupo
 * - Números fantasmas: 5511981194533, 5512997467112, 5519984104599
 * 
 * SOLUÇÃO:
 * - Adicionar validação de formato brasileiro (DDD válido)
 * - Logging detalhado de cada conversão
 * - Rejeitar números suspeitos
 */

// DDDs válidos do Brasil (atualizado 2024)
const VALID_DDDS = new Set([
    '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
    '21', '22', '24', // RJ
    '27', '28', // ES
    '31', '32', '33', '34', '35', '37', '38', // MG
    '41', '42', '43', '44', '45', '46', // PR
    '47', '48', '49', // SC
    '51', '53', '54', '55', // RS
    '61', // DF
    '62', '64', // GO
    '63', // TO
    '65', '66', // MT
    '67', // MS
    '68', // AC
    '69', // RO
    '71', '73', '74', '75', '77', // BA
    '79', // SE
    '81', '87', // PE
    '82', // AL
    '83', // PB
    '84', // RN
    '85', '88', // CE
    '86', '89', // PI
    '91', '93', '94', // PA
    '92', '97', // AM
    '95', // RR
    '96', // AP
    '98', '99'  // MA
]);

// Blacklist de números fantasmas conhecidos que o Baileys gera incorretamente
// ⚠️ ATENÇÃO: Estes números foram REMOVIDOS da blacklist pois existem no grupo!
// O problema é que o Baileys não está conseguindo capturá-los
const PHANTOM_NUMBERS_BLACKLIST = new Set([
    // REMOVIDOS - São números válidos que existem no grupo:
    // '5511981194533',
    // '5512997467112',
    // '5519984104599'
]);

/**
 * Valida se um número de telefone é válido
 * Aceita: celulares BR, fixos BR, e números internacionais
 */
function isValidBrazilianPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;

    // Remove caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');

    // ⚠️ VERIFICAÇÃO CRÍTICA: Blacklist de números fantasmas
    if (PHANTOM_NUMBERS_BLACKLIST.has(cleaned)) {
        console.log(`🚫 NÚMERO FANTASMA NA BLACKLIST REJEITADO: ${phone}`);
        return false;
    }

    // Deve ter entre 10 e 15 dígitos (E.164)
    if (cleaned.length < 10 || cleaned.length > 15) {
        return false;
    }

    // ============================================
    // CASO 1: NÚMERO INTERNACIONAL (DDI diferente de 55)
    // ============================================
    if (cleaned.length >= 12) {
        const possibleDDI = cleaned.substring(0, 2);

        // Se não começa com 55, é internacional - ACEITAR
        if (possibleDDI !== '55') {
            console.log(`✅ Número internacional detectado (DDI ${possibleDDI}): ${phone}`);
            return true;
        }
    }

    // ============================================
    // CASO 2: NÚMERO BRASILEIRO (DDI 55 ou sem DDI)
    // ============================================
    let number = cleaned;

    // Remove DDI 55 se presente
    if (number.startsWith('55') && number.length > 11) {
        number = number.substring(2);
    }

    // Deve ter 10 ou 11 dígitos (DDD + número)
    if (number.length !== 10 && number.length !== 11) {
        return false;
    }

    // Extrair DDD (2 primeiros dígitos)
    const ddd = number.substring(0, 2);

    // Validar DDD brasileiro
    if (!VALID_DDDS.has(ddd)) {
        console.log(`❌ DDD inválido: ${ddd} no número ${phone}`);
        return false;
    }

    // Para celular (11 dígitos), o terceiro dígito deve ser 9
    if (number.length === 11) {
        const thirdDigit = number.charAt(2);
        if (thirdDigit !== '9') {
            console.log(`⚠️ Celular sem 9 (pode ser erro): ${phone}`);
            return false;
        }
    }

    // Para fixo (10 dígitos), aceitar normalmente
    if (number.length === 10) {
        console.log(`📞 Telefone fixo detectado: ${phone}`);
        return true;
    }

    return true;
}

/**
 * Extrai e valida número de telefone de um participante Baileys
 * RETORNA NULL se o número for suspeito/inválido
 */
function extractAndValidatePhone(participant, resolvedNumbers, participantIndex) {
    let rawPhone = null;
    let source = 'unknown';
    const originalId = participant.id;

    console.log(`\n🔍 [${participantIndex}] Processando: ${originalId.substring(0, 40)}...`);
    console.log(`  📋 Participant completo:`, JSON.stringify({
        id: participant.id,
        notify: participant.notify,
        verifiedName: participant.verifiedName,
        phoneNumber: participant.phoneNumber
    }, null, 2));

    // 1. Prioridade: resolução onWhatsApp
    if (resolvedNumbers[originalId]) {
        rawPhone = resolvedNumbers[originalId];
        source = 'onWhatsApp(LID->Number)';
        console.log(`  ✅ Resolvido via onWhatsApp: ${rawPhone}`);
    } else if (resolvedNumbers[originalId.split('@')[0] + '@s.whatsapp.net']) {
        rawPhone = resolvedNumbers[originalId.split('@')[0] + '@s.whatsapp.net'];
        source = 'onWhatsApp(JID)';
        console.log(`  ✅ Resolvido via JID: ${rawPhone}`);
    }

    // 2. Campo phoneNumber explícito
    if (!rawPhone && participant.phoneNumber) {
        rawPhone = participant.phoneNumber.replace(/\D/g, '');
        source = 'phoneNumber';
        console.log(`  📱 Campo phoneNumber: ${rawPhone}`);
    }

    // 3. Se não é LID, usar o próprio ID (COM VALIDAÇÃO!)
    if (!rawPhone && !originalId.includes('@lid')) {
        const potentialPhone = originalId.split('@')[0];

        // ⚠️ VALIDAÇÃO CRÍTICA: Verificar se parece um número válido
        if (isValidBrazilianPhone(potentialPhone)) {
            rawPhone = potentialPhone;
            source = 'id(não-LID)';
            console.log(`  ✅ ID não-LID válido: ${rawPhone}`);
        } else {
            console.log(`  ❌ ID não-LID REJEITADO (formato inválido): ${potentialPhone}`);
            return null; // REJEITAR número suspeito
        }
    }

    // 4. Última tentativa: extrair de nomes
    if (!rawPhone) {
        const notify = participant.notify || '';
        const verified = participant.verifiedName || '';
        const possiblePhone = (verified.match(/\d{10,13}/) || notify.match(/\d{10,13}/));
        if (possiblePhone) {
            rawPhone = possiblePhone[0];
            source = 'extracted(name)';
            console.log(`  📝 Extraído do nome: ${rawPhone}`);
        }
    }

    // Validação final
    if (!rawPhone) {
        console.log(`  ❌ LID irresolvível`);
        return null;
    }

    rawPhone = rawPhone.replace(/\D/g, '');

    // VALIDAÇÃO RIGOROSA: Verificar formato brasileiro
    if (!isValidBrazilianPhone(rawPhone)) {
        console.log(`  ❌ NÚMERO FANTASMA DETECTADO E REJEITADO: ${rawPhone}`);
        console.log(`  📋 Source: ${source}`);
        console.log(`  🔍 Original ID: ${originalId}`);
        console.log(`  👤 Notify: ${participant.notify || 'N/A'}`);
        console.log(`  ✓ Verified Name: ${participant.verifiedName || 'N/A'}`);
        console.log(`  📱 Phone Number field: ${participant.phoneNumber || 'N/A'}`);
        console.log(`  🚨 INVESTIGAR: Este número passou por todas as validações mas foi rejeitado!`);
        return null;
    }

    // Aceitar 10 a 15 dígitos (E.164)
    if (rawPhone.length < 10 || rawPhone.length > 15) {
        console.log(`  ❌ Tamanho inválido: ${rawPhone.length} dígitos`);
        return null;
    }

    console.log(`  ✅ VÁLIDO: ${rawPhone} (${source})`);

    return {
        phone: rawPhone,
        name: participant.notify || participant.verifiedName || rawPhone,
        source: source
    };
}

// Exportar funções
export {
    isValidBrazilianPhone,
    extractAndValidatePhone,
    VALID_DDDS
};
