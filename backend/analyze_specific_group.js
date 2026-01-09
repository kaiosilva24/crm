// Cole aqui o GROUP ID do grupo que você importou
// Exemplo: const GROUP_ID = '120363422585583159@g.us';

import { wappiService } from './src/services/wappiService.js';

const GROUP_ID = '120363422585583159@g.us'; // 💡 ALTERE ESTE ID

console.log(`🔎 Analisando grupo: ${GROUP_ID}\n`);

async function analyzeGroup() {
    try {
        const groupData = await wappiService.getGroupParticipants(GROUP_ID);
        const participants = groupData.participants || [];

        console.log(`📊 Total de participantes retornados pela API: ${participants.length}\n`);

        // Categorizar
        let validNumbers = 0;
        let lids = 0;
        let tooShort = 0;
        let tooLong = 0;
        let invalidFormat = 0;

        const examples = {
            valid: [],
            lids: [],
            tooShort: [],
            tooLong: [],
            invalid: []
        };

        participants.forEach(p => {
            const rawId = (typeof p === 'string') ? p : (p.id || p);
            const phone = rawId.toString().split('@')[0];
            const cleanPhone = phone.replace(/\D/g, '');

            // Detectar tipo
            if (rawId.includes('@lid') || (rawId.includes(':') && !rawId.includes('@g.us'))) {
                lids++;
                if (examples.lids.length < 3) examples.lids.push(rawId);
            } else if (cleanPhone.length < 10) {
                tooShort++;
                if (examples.tooShort.length < 3) examples.tooShort.push(`${rawId} (${cleanPhone.length} dígitos)`);
            } else if (cleanPhone.length > 15) {
                tooLong++;
                if (examples.tooLong.length < 3) examples.tooLong.push(`${rawId} (${cleanPhone.length} dígitos)`);
            } else if (!/^\d+$/.test(cleanPhone)) {
                invalidFormat++;
                if (examples.invalid.length < 3) examples.invalid.push(rawId);
            } else {
                validNumbers++;
                if (examples.valid.length < 5) examples.valid.push(cleanPhone);
            }
        });

        console.log('📋 Categorização:\n');
        console.log(`✅ Números válidos: ${validNumbers}`);
        console.log(`🔒 LIDs (Privacy): ${lids}`);
        console.log(`📏 Muito curto (<10): ${tooShort}`);
        console.log(`📏 Muito longo (>15): ${tooLong}`);
        console.log(`❌ Formato inválido: ${invalidFormat}`);

        console.log('\n🔍 Exemplos de cada categoria:\n');

        if (examples.valid.length > 0) {
            console.log('✅ Números válidos:');
            examples.valid.forEach(n => console.log(`   ${n}`));
        }

        if (examples.lids.length > 0) {
            console.log('\n🔒 LIDs:');
            examples.lids.forEach(n => console.log(`   ${n}`));
        }

        if (examples.tooShort.length > 0) {
            console.log('\n📏 Muito curto:');
            examples.tooShort.forEach(n => console.log(`   ${n}`));
        }

        if (examples.tooLong.length > 0) {
            console.log('\n📏 Muito longo:');
            examples.tooLong.forEach(n => console.log(`   ${n}`));
        }

        if (examples.invalid.length > 0) {
            console.log('\n❌ Formato inválido:');
            examples.invalid.forEach(n => console.log(`   ${n}`));
        }

        console.log(`\n📊 RESUMO:`);
        console.log(`Total na API: ${participants.length}`);
        console.log(`Que seriam importados: ${validNumbers}`);
        console.log(`Que seriam ignorados: ${lids + tooShort + tooLong + invalidFormat}`);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

analyzeGroup();
