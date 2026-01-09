import { wappiService } from './src/services/wappiService.js';

console.log('🧪 Testando conexão com Whapi.Cloud...\n');

async function test() {
    try {
        // 1. Verificar credenciais
        console.log('1️⃣ Verificando credenciais...');
        const creds = await wappiService.getCredentials();
        console.log('✅ Credenciais encontradas:');
        console.log(`   Token: ${creds.token.substring(0, 10)}...`);
        console.log(`   Profile ID: ${creds.profileId}\n`);

        // 2. Testar listagem de grupos
        console.log('2️⃣ Buscando grupos do WhatsApp...');
        const groups = await wappiService.getGroups();
        console.log(`✅ ${groups.length} grupos encontrados!\n`);

        if (groups.length > 0) {
            console.log('📋 Lista de grupos:');
            groups.forEach((g, i) => {
                console.log(`   ${i + 1}. ${g.name}`);
                console.log(`      ID: ${g.id}`);
                console.log(`      Participantes: ${g.participants?.length || '?'}\n`);
            });

            // 3. Testar busca de participantes do primeiro grupo
            if (groups[0]) {
                console.log(`3️⃣ Buscando participantes do grupo "${groups[0].name}"...`);
                try {
                    const groupData = await wappiService.getGroupParticipants(groups[0].id);
                    console.log(`✅ ${groupData.participants.length} participantes encontrados!\n`);

                    console.log('👥 Primeiros 5 participantes:');
                    groupData.participants.slice(0, 5).forEach((p, i) => {
                        const id = p.id || p;
                        console.log(`   ${i + 1}. ${id}`);
                    });
                } catch (error) {
                    console.error('❌ Erro ao buscar participantes:', error.message);
                }
            }
        } else {
            console.log('⚠️  Nenhum grupo encontrado. Verifique:');
            console.log('   - WhatsApp está conectado no painel Whapi.Cloud?');
            console.log('   - Você participa de grupos no WhatsApp?');
        }

        console.log('\n✅ Teste concluído com sucesso!');

    } catch (error) {
        console.error('\n❌ ERRO no teste:');
        console.error('Mensagem:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
        console.error('\n💡 Verifique:');
        console.log('   1. Token está correto no Supabase?');
        console.log('   2. WhatsApp está conectado no painel Whapi.Cloud?');
        console.log('   3. A URL base está correta? (https://gate.whapi.cloud)');
    }
}

test();
