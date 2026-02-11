/**
 * Serviço de Sincronização Automática de Grupos
 * Executa sincronização periódica em background
 */

import cron from 'node-cron';


const AUTO_SYNC_ENABLED = process.env.AUTO_SYNC_ENABLED === 'true';
const AUTO_SYNC_INTERVAL = parseInt(process.env.AUTO_SYNC_INTERVAL || '30'); // minutos
const API_URL = process.env.API_URL || 'http://localhost:3001';

let isRunning = false;

/**
 * Executar sincronização com retry
 */
async function runSync() {
    if (isRunning) {
        console.log('⏭️ Sincronização já em andamento, pulando...');
        return;
    }

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 60000; // 1 minuto

    try {
        isRunning = true;
        console.log('\n' + '='.repeat(70));
        console.log('🤖 SINCRONIZAÇÃO AUTOMÁTICA INICIADA');
        console.log('='.repeat(70));

        let lastError = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`\n🔄 Tentativa ${attempt}/${MAX_RETRIES}...`);

                const response = await fetch(`${API_URL}/api/group-sync/sync-group-status`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();

                if (data.success) {
                    console.log('✅ Sincronização automática concluída com sucesso!');
                    console.log(`📊 Campanhas: ${data.campaignsProcessed} | Grupos: ${data.groupsProcessed}`);
                    console.log(`👥 No grupo: ${data.inGroup} | Fora: ${data.notInGroup}`);
                    return; // Sucesso, sair do loop
                } else {
                    // Erro retornado pela API (ex: sem conexões ativas)
                    lastError = data.error;
                    console.warn(`⚠️ Tentativa ${attempt} falhou: ${data.error}`);

                    if (attempt < MAX_RETRIES) {
                        console.log(`⏳ Aguardando 1 minuto antes da próxima tentativa...`);
                        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                    }
                }

            } catch (fetchError) {
                lastError = fetchError.message;
                console.error(`❌ Erro na tentativa ${attempt}:`, fetchError.message);

                if (attempt < MAX_RETRIES) {
                    console.log(`⏳ Aguardando 1 minuto antes da próxima tentativa...`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                }
            }
        }

        // Se chegou aqui, todas as tentativas falharam
        console.error('\n' + '='.repeat(70));
        console.error('❌ SINCRONIZAÇÃO AUTOMÁTICA FALHOU APÓS 3 TENTATIVAS');
        console.error(`Último erro: ${lastError}`);
        console.error('💡 Os dados anteriores foram mantidos sem alteração');
        console.error('='.repeat(70));

    } catch (error) {
        console.error('❌ Erro crítico ao executar sincronização automática:', error.message);
    } finally {
        isRunning = false;
    }
}

/**
 * Inicializar serviço de auto-sync
 */
export function initAutoSync() {
    if (!AUTO_SYNC_ENABLED) {
        console.log('⏸️ Sincronização automática desabilitada');
        return;
    }

    console.log('🔄 Sincronização automática habilitada');
    console.log(`⏰ Intervalo: a cada ${AUTO_SYNC_INTERVAL} minutos`);

    // Criar expressão cron baseada no intervalo
    const cronExpression = `*/${AUTO_SYNC_INTERVAL} * * * *`;

    // Agendar sincronização
    cron.schedule(cronExpression, () => {
        runSync();
    });

    console.log('✅ Serviço de auto-sync inicializado');

    // Executar uma sincronização inicial após 1 minuto para verificar funcionamento imediato
    console.log('⏳ Agendando sincronização inicial para daqui a 1 minuto...');
    setTimeout(() => {
        console.log('🚀 Executando sincronização inicial pós-inicialização...');
        runSync();
    }, 60000);
}

/**
 * Executar sincronização manual (para testes)
 */
export async function triggerManualSync() {
    await runSync();
}
