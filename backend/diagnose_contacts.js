import { wappiService } from './src/services/wappiService.js';

console.log('🔍 Diagnóstico: Verificando contatos dos grupos...\n');

async function diagnose() {
    try {
        // 1. Listar grupos
        console.log('📋 Listando grupos...');
        const groups = await wappiService.getGroups();
        console.log(`✅ ${groups.length} grupos encontrados\n`);

        // Mostrar grupos com contagem de participantes
        console.log('📊 Grupos e seus participantes:');
        console.log('─'.repeat(80));

        let totalParticipantsInList = 0;

        groups.forEach((g, i) => {
            const count = g.participants?.length || 0;
            totalParticipantsInList += count;
            console.log(`${i + 1}. ${g.name}`);
            console.log(`   Participantes (na lista): ${count}`);
            console.log(`   ID: ${g.id}\n`);
        });

        console.log('─'.repeat(80));
        console.log(`📊 Total de participantes (soma de todos grupos): ${totalParticipantsInList}\n`);

        // 2. Buscar detalhes de alguns grupos específicos
        console.log('\n🔎 Verificando detalhes de grupos específicos...\n');

        for (let i = 0; i < Math.min(3, groups.length); i++) {
            const group = groups[i];
            console.log(`\n📱 Analisando: ${group.name}`);
            console.log(`   ID: ${group.id}`);

            try {
                const details = await wappiService.getGroupParticipants(group.id);
                const participants = details.participants || [];

                console.log(`   ✅ Participantes retornados: ${participants.length}`);

                // Categorizar tipos de IDs
                let validNumbers = 0;
                let lids = 0;
                let others = 0;

                participants.forEach(p => {
                    const rawId = p.id || p;
                    if (rawId.includes('@lid') || rawId.includes(':')) {
                        lids++;
                    } else if (rawId.includes('@c.us')) {
                        validNumbers++;
                    } else {
                        others++;
                    }
                });

                console.log(`   📊 Tipos de contatos:`);
                console.log(`      ✅ Números válidos: ${validNumbers}`);
                console.log(`      🔒 LIDs (Privacy): ${lids}`);
                console.log(`      ❓ Outros: ${others}`);

                // Mostrar exemplos
                if (participants.length > 0) {
                    console.log(`\n   🔍 Primeiros 5 participantes:`);
                    participants.slice(0, 5).forEach((p, idx) => {
                        const rawId = p.id || p;
                        const phone = rawId.split('@')[0];
                        const type = rawId.includes('@lid') ? '🔒 LID' :
                            rawId.includes('@c.us') ? '✅ Válido' : '❓ Outro';
                        console.log(`      ${idx + 1}. ${type} - ${rawId.substring(0, 40)}...`);
                    });
                }

            } catch (error) {
                console.error(`   ❌ Erro ao buscar detalhes: ${error.message}`);
            }
        }

    } catch (error) {
        console.error('\n❌ Erro:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

diagnose();
