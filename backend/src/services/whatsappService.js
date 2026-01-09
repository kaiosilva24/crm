/**
 * WhatsApp Service usando Baileys
 * Gerencia conexões, QR codes e listagem de grupos
 */

import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import QRCode from 'qrcode';
import { supabase } from '../database/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Armazenar conexões ativas em memória
const activeConnections = new Map();

// Logger
const logger = pino({ level: 'silent' }); // Silencioso para produção

/**
 * Inicializar conexão WhatsApp com suporte a Pairing Code
 * @param {string} connectionId - ID da conexão
 * @param {boolean} usePairingCode - Se true, usa código de pareamento em vez de QR code
 * @param {string} phoneNumber - Número de telefone para pairing code (formato: 5511999999999)
 */
export async function initializeWhatsAppConnection(connectionId, usePairingCode = false, phoneNumber = null) {
    try {
        console.log(`🔄 Iniciando conexão WhatsApp: ${connectionId}`);
        console.log(`📱 Método: ${usePairingCode ? 'PAIRING CODE (Redirect+)' : 'QR CODE'}`);

        // Diretório para armazenar sessão
        const authDir = path.join(__dirname, '../../.wwebjs_auth', connectionId);
        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            logger,
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            browser: ['Recovery CRM', 'Chrome', '1.0.0'],
        });

        // Armazenar conexão ativa
        activeConnections.set(connectionId, sock);

        // Se usar pairing code, gerar código
        if (usePairingCode && phoneNumber && !state.creds.registered) {
            console.log(`📞 Gerando código de pareamento para: ${phoneNumber}`);

            // Remover caracteres não numéricos
            const cleanPhone = phoneNumber.replace(/\D/g, '');

            try {
                const code = await sock.requestPairingCode(cleanPhone);
                console.log(`🔑 CÓDIGO DE PAREAMENTO: ${code}`);

                // Salvar código no banco
                await supabase
                    .from('whatsapp_connections')
                    .update({
                        pairing_code: code,
                        pairing_phone: cleanPhone,
                        status: 'waiting_pairing',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', connectionId);

                console.log(`✅ Código salvo. Insira o código ${code} no WhatsApp do número ${phoneNumber}`);
            } catch (pairingError) {
                console.error('❌ Erro ao gerar código de pareamento:', pairingError);
                throw pairingError;
            }
        }

        // Event: QR Code ou Pairing Code
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('📱 QR Code gerado');
                const qrCodeDataURL = await QRCode.toDataURL(qr);

                // Salvar QR no banco
                await supabase
                    .from('whatsapp_connections')
                    .update({
                        qr_code: qrCodeDataURL,
                        status: 'connecting',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', connectionId);
            }

            if (connection === 'close') {
                // Verificar se o erro foi rate-limit
                const isRateLimit = lastDisconnect?.error?.message?.includes('rate-overlimit')
                    || lastDisconnect?.error?.data === 429;

                if (isRateLimit) {
                    console.log('⏰ Conexão fechada por rate-limit. NÃO reconectando automaticamente.');
                    console.log('💡 Aguarde 60 segundos e reconecte manualmente.');

                    // Atualizar status no banco
                    await supabase
                        .from('whatsapp_connections')
                        .update({
                            status: 'disconnected',
                            qr_code: null,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', connectionId);

                    activeConnections.delete(connectionId);
                    return; // NÃO reconectar
                }

                const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                    ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                    : true;

                console.log('❌ Conexão fechada. Reconectar?', shouldReconnect);

                if (shouldReconnect) {
                    setTimeout(() => initializeWhatsAppConnection(connectionId), 3000);
                } else {
                    activeConnections.delete(connectionId);

                    // Limpar sessão também ao desconectar/logout via evento
                    try {
                        const authDir = path.join(__dirname, '../../.wwebjs_auth', connectionId);
                        if (fs.existsSync(authDir)) {
                            console.log(`🗑️ Removendo sessão (evento close): ${authDir}`);
                            fs.rmSync(authDir, { recursive: true, force: true });
                        }
                    } catch (err) {
                        console.error('Erro ao remover diretório de sessão:', err);
                    }

                    await supabase
                        .from('whatsapp_connections')
                        .update({
                            status: 'disconnected',
                            qr_code: null,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', connectionId);
                }
            } else if (connection === 'open') {
                console.log('✅ Conectado ao WhatsApp!');

                // Obter informações do usuário
                const phoneNumber = sock.user?.id?.split(':')[0] || 'Desconhecido';

                await supabase
                    .from('whatsapp_connections')
                    .update({
                        status: 'connected',
                        phone_number: phoneNumber,
                        qr_code: null,
                        last_connected_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', connectionId);

                // Sincronizar grupos (com proteção contra crash)
                try {
                    await syncWhatsAppGroups(connectionId, sock);
                } catch (syncError) {
                    console.error('⚠️ Erro ao sincronizar grupos (não crítico):', syncError.message);
                    // Não propagar erro - servidor continua funcionando
                }
            }
        });

        // Event: Salvar credenciais
        sock.ev.on('creds.update', saveCreds);

        return sock;
    } catch (error) {
        console.error('❌ Erro ao inicializar WhatsApp:', error);
        throw error;
    }
}

/**
 * Sincronizar grupos do WhatsApp
 */
async function syncWhatsAppGroups(connectionId, sock) {
    try {
        console.log('🔄 Sincronizando grupos...');
        console.log('📱 Connection ID:', connectionId);
        console.log('🔌 Socket ativo:', !!sock);

        // Aguardar 2 segundos antes de buscar grupos (evitar rate-limit)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Buscar todos os grupos
        const groups = await sock.groupFetchAllParticipating();
        const groupList = Object.values(groups);

        console.log(`📊 ${groupList.length} grupos encontrados`);

        if (groupList.length === 0) {
            console.log('⚠️ Nenhum grupo encontrado no WhatsApp');
            return;
        }

        // Salvar grupos no banco (com delay entre cada um)
        for (const group of groupList) {
            console.log(`💾 Salvando grupo: ${group.subject} (${group.participants?.length || 0} participantes)`);

            const { data, error } = await supabase
                .from('whatsapp_groups')
                .upsert({
                    connection_id: connectionId,
                    group_id: group.id,
                    group_name: group.subject,
                    participant_count: group.participants?.length || 0,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'connection_id,group_id'
                });

            if (error) {
                console.error('❌ Erro ao salvar grupo:', error);
            } else {
                console.log('✅ Grupo salvo com sucesso');
            }

            // Pequeno delay entre grupos (100ms)
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('✅ Grupos sincronizados!');
    } catch (error) {
        console.error('❌ Erro ao sincronizar grupos:', error);
        console.error('Stack:', error.stack);

        // Se for rate-limit, avisar e NÃO tentar reconectar imediatamente
        if (error.message?.includes('rate-overlimit') || error.data === 429) {
            console.log('⏰ Rate limit atingido. Aguarde 60 segundos antes de tentar novamente.');
            throw error; // Propagar erro para evitar reconexão automática
        }
    }
}

/**
 * Obter conexão ativa
 */
export function getActiveConnection(connectionId) {
    return activeConnections.get(connectionId);
}

/**
 * Desconectar WhatsApp
 */
export async function disconnectWhatsApp(connectionId) {
    const sock = activeConnections.get(connectionId);
    if (sock) {
        try {
            await sock.logout();
        } catch (err) {
            console.error('Erro ao fazer logout:', err);
        }
        activeConnections.delete(connectionId);
    }

    // Limpar diretório de sessão para garantir novo QR code
    try {
        const authDir = path.join(__dirname, '../../.wwebjs_auth', connectionId);
        if (fs.existsSync(authDir)) {
            console.log(`🗑️ Removendo sessão: ${authDir}`);
            fs.rmSync(authDir, { recursive: true, force: true });
        }
    } catch (err) {
        console.error('Erro ao remover diretório de sessão:', err);
    }

    await supabase
        .from('whatsapp_connections')
        .update({
            status: 'disconnected',
            qr_code: null,
            updated_at: new Date().toISOString()
        })
        .eq('id', connectionId);
}

/**
 * Listar grupos de uma conexão
 */
export async function listGroups(connectionId) {
    const { data, error } = await supabase
        .from('whatsapp_groups')
        .select('*')
        .eq('connection_id', connectionId)
        .order('group_name');

    if (error) throw error;
    return data;
}

/**
 * Forçar sincronização de grupos
 */
export async function forceGroupSync(connectionId) {
    const sock = activeConnections.get(connectionId);
    if (!sock) {
        throw new Error('Conexão não está ativa. Tente reconectar o dispositivo.');
    }
    await syncWhatsAppGroups(connectionId, sock);
}

/**
 * Restaurar sessões ativas ao iniciar o servidor
 */
export async function restoreSessions() {
    try {
        console.log('🔄 Verificando sessões para restaurar...');

        const { data: connections, error } = await supabase
            .from('whatsapp_connections')
            .select('id, name')
            .eq('status', 'connected');

        if (error) throw error;

        console.log(`📊 Encontradas ${connections.length} conexões marcadas como ativas`);

        for (const conn of connections) {
            const authDir = path.join(__dirname, '../../.wwebjs_auth', conn.id);
            if (fs.existsSync(authDir)) {
                console.log(`🔌 Restaurando sessão: ${conn.name} (${conn.id})`);
                initializeWhatsAppConnection(conn.id).catch(err => {
                    console.error(`❌ Falha ao restaurar sessão ${conn.name}:`, err);
                });
            } else {
                console.log(`⚠️ Sessão ${conn.name} não possui arquivos de autenticação. Marcando como desconectada.`);
                await supabase
                    .from('whatsapp_connections')
                    .update({ status: 'disconnected' })
                    .eq('id', conn.id);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao restaurar sessões:', error);
    }
}
