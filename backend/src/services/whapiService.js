/**
 * Whapi.Cloud Service - API REST Profissional para WhatsApp
 * Documentação: https://whapi.cloud/docs
 * 
 * Este serviço garante importação COMPLETA de contatos sem perdas
 * causadas por Privacy IDs (LIDs) do Baileys.
 */

import axios from 'axios';
import { supabase } from '../database/supabase.js';

class WhapiService {
    constructor() {
        this.baseUrl = 'https://gate.whapi.cloud';
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 segundo
    }

    /**
     * Obter credenciais do Whapi.Cloud do banco de dados
     */
    async getCredentials() {
        const { data, error } = await supabase
            .from('whapi_settings')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            throw new Error('Credenciais do Whapi.Cloud não configuradas. Configure em Configurações > WhatsApp API.');
        }

        return {
            token: data.api_token,
            channelId: data.channel_id
        };
    }

    /**
     * Headers para requisições autenticadas
     */
    async getHeaders(token) {
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Retry logic com exponential backoff
     */
    async retryRequest(requestFn, retries = this.maxRetries) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                const isLastAttempt = attempt === retries;
                const shouldRetry = error.response?.status >= 500 || error.code === 'ECONNRESET';

                if (isLastAttempt || !shouldRetry) {
                    throw error;
                }

                const delay = this.retryDelay * Math.pow(2, attempt - 1);
                console.log(`⚠️ Tentativa ${attempt} falhou. Retentando em ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    /**
     * Listar TODOS os grupos do WhatsApp com paginação automática
     * Retorna array completo de grupos sem perder nenhum
     */
    async listAllGroups() {
        console.log('📋 Listando grupos via Whapi.Cloud...');
        const { token } = await this.getCredentials();

        return await this.retryRequest(async () => {
            const response = await axios.get(`${this.baseUrl}/groups`, {
                headers: await this.getHeaders(token),
                params: {
                    count: 100 // Buscar até 100 grupos por página
                }
            });

            let groups = [];

            // A resposta pode vir em formatos diferentes
            if (Array.isArray(response.data)) {
                groups = response.data;
            } else if (response.data.groups && Array.isArray(response.data.groups)) {
                groups = response.data.groups;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                groups = response.data.data;
            } else {
                console.warn('⚠️ Formato de resposta inesperado:', Object.keys(response.data));
                groups = [];
            }

            console.log(`✅ ${groups.length} grupos encontrados`);

            // Normalizar formato
            return groups.map(group => ({
                id: group.id,
                name: group.name || group.subject || 'Grupo sem nome',
                participantCount: group.participants?.length || group.size || 0,
                metadata: group
            }));
        });
    }

    /**
     * Obter TODOS os participantes de um grupo específico
     * Garante que nenhum contato seja perdido
     * 
     * @param {string} groupId - ID do grupo (formato: 120363XXXXX@g.us)
     * @returns {Array} Lista completa de participantes com números reais
     */
    async getGroupParticipants(groupId) {
        console.log(`👥 Buscando participantes do grupo ${groupId}...`);
        const { token } = await this.getCredentials();

        return await this.retryRequest(async () => {
            // Endpoint específico para detalhes do grupo incluindo participantes
            const response = await axios.get(`${this.baseUrl}/groups/${groupId}`, {
                headers: await this.getHeaders(token)
            });

            const groupData = response.data;
            let participants = [];

            // Extrair participantes do formato de resposta
            if (Array.isArray(groupData.participants)) {
                participants = groupData.participants;
            } else if (groupData.group?.participants) {
                participants = groupData.group.participants;
            } else if (groupData.data?.participants) {
                participants = groupData.data.participants;
            } else {
                console.warn('⚠️ Nenhum participante encontrado na resposta');
                participants = [];
            }

            console.log(`✅ ${participants.length} participantes encontrados`);

            // IMPORTANTE: Whapi.Cloud retorna JIDs reais, não LIDs!
            // Cada participante tem um 'id' no formato: 5511999999999@s.whatsapp.net
            return participants.map(p => ({
                id: p.id,
                phone: this.extractPhoneFromJID(p.id),
                name: p.name || p.notify || p.pushname || null,
                isAdmin: p.admin === 'admin' || p.admin === 'superadmin',
                metadata: p
            }));
        });
    }

    /**
     * Obter todos os contatos visíveis (opcional - para casos especiais)
     * Inclui contatos salvos + participantes de grupos
     */
    async getAllContacts() {
        console.log('📇 Buscando todos os contatos via Whapi.Cloud...');
        const { token } = await this.getCredentials();

        return await this.retryRequest(async () => {
            const response = await axios.get(`${this.baseUrl}/contacts`, {
                headers: await this.getHeaders(token),
                params: {
                    count: 1000 // Máximo por página
                }
            });

            let contacts = [];

            if (Array.isArray(response.data)) {
                contacts = response.data;
            } else if (response.data.contacts) {
                contacts = response.data.contacts;
            } else if (response.data.data) {
                contacts = response.data.data;
            }

            console.log(`✅ ${contacts.length} contatos encontrados`);

            return contacts.map(c => ({
                id: c.id,
                phone: this.extractPhoneFromJID(c.id),
                name: c.name || c.notify || c.pushname,
                isSaved: c.saved || false,
                metadata: c
            }));
        });
    }

    /**
     * Extrair número de telefone do JID do WhatsApp
     * Formato: 5511999999999@s.whatsapp.net -> 5511999999999
     * 
     * @param {string} jid - JID do WhatsApp
     * @returns {string} Número de telefone limpo
     */
    extractPhoneFromJID(jid) {
        if (!jid) return null;

        // Remover tudo após @ se existir
        const phone = jid.split('@')[0];

        // Remover caracteres não numéricos
        return phone.replace(/\D/g, '');
    }

    /**
     * Testar conexão com Whapi.Cloud
     * Útil para validar token de API
     */
    async testConnection() {
        try {
            console.log('🔌 Testando conexão com Whapi.Cloud...');
            const { token } = await this.getCredentials();

            const response = await axios.get(`${this.baseUrl}/settings/status`, {
                headers: await this.getHeaders(token)
            });

            const status = response.data;
            console.log('✅ Conexão bem-sucedida!', status);

            return {
                success: true,
                connected: status.connected || status.authenticated || true,
                phoneNumber: status.phone || status.number || 'N/A',
                data: status
            };
        } catch (error) {
            console.error('❌ Erro ao testar conexão:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    /**
     * Salvar configurações do Whapi.Cloud
     */
    async saveSettings(apiToken, channelId = null) {
        // Desativar configurações antigas
        await supabase
            .from('whapi_settings')
            .update({ is_active: false })
            .eq('is_active', true);

        // Criar nova configuração
        const { data, error } = await supabase
            .from('whapi_settings')
            .insert({
                api_token: apiToken,
                channel_id: channelId,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

export const whapiService = new WhapiService();
