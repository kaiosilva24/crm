import axios from 'axios';
import { supabase } from '../database/supabase.js';

class WappiService {
    constructor() {
        // Whapi.Cloud base URL
        this.baseUrl = 'https://gate.whapi.cloud';
    }

    async getCredentials() {
        const { data, error } = await supabase
            .from('wappi_settings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            throw new Error('Credenciais da Whapi não configuradas.');
        }

        return { token: data.api_token, profileId: data.profile_id };
    }

    async getHeaders(token) {
        return {
            'Authorization': `Bearer ${token}`, // Whapi.Cloud usa Bearer token
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    // Listar Grupos usando Whapi.Cloud API
    async getGroups() {
        const fs = await import('fs');
        const path = await import('path');
        const logPath = path.resolve('wappi_debug.log');
        const log = (msg) => fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);

        log('getGroups called');
        try {
            const { token, profileId } = await this.getCredentials();
            log(`Credentials loaded: Token=${token?.substring(0, 5)}..., Profile=${profileId}`);

            // Whapi.Cloud endpoint para listar grupos
            const url = `${this.baseUrl}/groups`;
            log(`Fetching URL: ${url}`);

            const response = await axios.get(url, {
                headers: await this.getHeaders(token)
            });

            log(`Response status: ${response.status}`);
            log(`Response data type: ${typeof response.data}`);
            log(`Response data isArray: ${Array.isArray(response.data)}`);

            let groups = response.data || [];

            // Whapi.Cloud pode retornar { groups: [...] } ou array direto
            if (!Array.isArray(groups)) {
                log(`Response is not array. Checking common wrappers... Keys: ${Object.keys(groups).join(',')}`);
                if (Array.isArray(groups.groups)) {
                    groups = groups.groups;
                    log(`Found array in groups.groups (${groups.length} items)`);
                } else if (Array.isArray(groups.data)) {
                    groups = groups.data;
                    log(`Found array in groups.data (${groups.length} items)`);
                } else if (Array.isArray(groups.result)) {
                    groups = groups.result;
                    log(`Found array in groups.result (${groups.length} items)`);
                } else {
                    log(`WARNING: Could not find array in response. Returning empty array. Response keys: ${Object.keys(groups).join(',')}`);
                    log(`Response sample: ${JSON.stringify(groups).substring(0, 200)}`);
                    groups = [];
                }
            } else {
                log(`Response IS already an array with ${groups.length} items.`);
            }

            // Verificação adicional de segurança
            if (!Array.isArray(groups)) {
                log(`CRITICAL: groups is still not an array after processing! Type: ${typeof groups}`);
                groups = [];
            }

            log(`Found ${groups.length} groups`);

            // Normalizar retorno para Whapi.Cloud
            return groups.map(g => ({
                id: g.id || g.chat_id,
                name: g.name || g.subject || 'Grupo sem nome',
                participants: g.participants || [],
                metadata: g
            }));

        } catch (error) {
            log(`ERROR in getGroups: ${error.message}`);
            if (error.response) {
                log(`API Error Status: ${error.response.status}`);
                log(`API Error Data: ${JSON.stringify(error.response.data)}`);
            }
            console.error('Erro ao buscar grupos Whapi:', error.response?.data || error.message);
            throw new Error(`Falha ao listar grupos da Whapi. Detalhes: ${error.message}`);
        }
    }

    // Obter participantes usando Whapi.Cloud API
    async getGroupParticipants(groupId) {
        const { token } = await this.getCredentials();

        try {
            // Whapi.Cloud endpoint: GET /groups/{groupId} (retorna info completa incluindo participantes)
            const response = await axios.get(`${this.baseUrl}/groups/${groupId}`, {
                headers: await this.getHeaders(token)
            });

            // Whapi retorna objeto do grupo com participantes
            const groupData = response.data || {};
            const participants = groupData.participants || [];

            return { participants };

        } catch (error) {
            console.error(`Erro ao buscar participantes do grupo ${groupId}:`, error.response?.data || error.message);

            // Fallback: tentar obter da lista de grupos
            try {
                const groups = await this.getGroups();
                const group = groups.find(g => g.id === groupId);

                if (group && group.participants) {
                    return { participants: group.participants };
                }
            } catch (fallbackError) {
                console.error('Fallback também falhou:', fallbackError.message);
            }

            throw new Error('Grupo não encontrado ou sem participantes acessíveis');
        }
    }

    // Enviar mensagem (para referência futura ou testes)
    async sendMessage(phone, text) {
        const { token, profileId } = await this.getCredentials();

        try {
            const body = {
                profile_id: profileId,
                recipient: phone,
                body: text
            };

            const response = await axios.post(`${this.baseUrl}/message/send`, body, {
                headers: await this.getHeaders(token)
            });

            return response.data;
        } catch (error) {
            console.error('Erro ao enviar mensagem via Wappi:', error.response?.data || error.message);
            throw error;
        }
    }
}

export const wappiService = new WappiService();
