/**
 * Script de Teste para Whapi.Cloud
 * Execute: node src/tests/test_whapi.js
 */

import { whapiService } from '../services/whapiService.js';

async function main() {
    console.log('🧪 TESTANDO INTEGRAÇÃO WHAPI.CLOUD\n');
    console.log('='.repeat(50));

    try {
        // 1. Testar Conexão
        console.log('\n📡 1. Testando conexão com Whapi.Cloud...');
        const connectionTest = await whapiService.testConnection();

        if (connectionTest.success) {
            console.log('✅ Conexão bem-sucedida!');
            console.log(`   Conectado: ${connectionTest.connected}`);
            console.log(`   Número: ${connectionTest.phoneNumber}`);
        } else {
            console.error('❌ Falha na conexão:', connectionTest.error);
            return;
        }

        // 2. Listar Grupos
        console.log('\n📋 2. Listando grupos do WhatsApp...');
        const groups = await whapiService.listAllGroups();
        console.log(`✅ ${groups.length} grupos encontrados`);

        if (groups.length === 0) {
            console.log('⚠️ Nenhum grupo disponível');
            return;
        }

        // Mostrar primeiros 5 grupos
        console.log('\n📊 Primeiros grupos:');
        groups.slice(0, 5).forEach((group, index) => {
            console.log(`   ${index + 1}. ${group.name} (${group.participantCount} participantes)`);
        });

        // 3. Testar Busca de Participantes
        const testGroup = groups[0];
        console.log(`\n👥 3. Buscando participantes do grupo: ${testGroup.name}`);
        const participants = await whapiService.getGroupParticipants(testGroup.id);

        console.log(`✅ ${participants.length} participantes encontrados`);

        if (participants.length > 0) {
            console.log('\n👤 Exemplo de participantes:');
            participants.slice(0, 3).forEach((p, index) => {
                console.log(`   ${index + 1}. ${p.name || 'Sem nome'}`);
                console.log(`      Telefone: ${p.phone}`);
                console.log(`      Admin: ${p.isAdmin ? 'Sim' : 'Não'}`);
            });
        }

        // 4. Estatísticas
        console.log('\n📊 ESTATÍSTICAS:');
        console.log('='.repeat(50));
        console.log(`Total de grupos: ${groups.length}`);

        const totalParticipants = groups.reduce((sum, g) => sum + (g.participantCount || 0), 0);
        console.log(`Total estimado de participantes: ${totalParticipants}`);

        const avgPerGroup = totalParticipants / groups.length;
        console.log(`Média de participantes por grupo: ${avgPerGroup.toFixed(1)}`);

        // 5. Validação de Números
        console.log('\n🔍 5. Validando formato de números...');
        let validNumbers = 0;
        let invalidNumbers = 0;

        participants.forEach(p => {
            if (p.phone && p.phone.length >= 10 && p.phone.length <= 15) {
                validNumbers++;
            } else {
                invalidNumbers++;
            }
        });

        console.log(`✅ Números válidos: ${validNumbers}`);
        console.log(`❌ Números inválidos: ${invalidNumbers}`);

        if (invalidNumbers === 0) {
            console.log('\n🎉 PERFEITO! Todos os números estão válidos.');
            console.log('   Whapi.Cloud garante 100% de importação!');
        }

        console.log('\n' + '='.repeat(50));
        console.log('✅ TESTE CONCLUÍDO COM SUCESSO!\n');

    } catch (error) {
        console.error('\n❌ ERRO NO TESTE:', error.message);
        console.error('\nDetalhes:', error);

        if (error.message.includes('não configuradas')) {
            console.log('\n💡 DICA: Configure o Whapi.Cloud primeiro:');
            console.log('   POST /api/whatsapp-groups/whapi/settings');
            console.log('   { "apiToken": "SEU_TOKEN" }');
        }
    }
}

main();
