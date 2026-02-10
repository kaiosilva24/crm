/**
 * Hook customizado para gerenciar sincronização de grupos
 */

import { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function useGroupSync() {
    const [lastSync, setLastSync] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Buscar última sincronização
     */
    const fetchLastSync = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/group-sync/last-sync`);
            const data = await response.json();

            if (data.success) {
                setLastSync({
                    ...data.lastSync,
                    connectionError: data.lastSync?.connectionError || false
                });
            }
        } catch (err) {
            console.error('Erro ao buscar última sincronização:', err);
            setError(err.message);
        }
    }, []);

    /**
     * Disparar sincronização manual
     */
    const triggerSync = useCallback(async () => {
        setSyncing(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/group-sync/sync-group-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Erro na sincronização');
            }

            // Atualizar última sincronização após sucesso
            await fetchLastSync();

            return data;
        } catch (err) {
            console.error('Erro ao sincronizar:', err);
            setError(err.message);
            throw err;
        } finally {
            setSyncing(false);
        }
    }, [fetchLastSync]);

    /**
     * Formatar tempo relativo com horário de Brasília e status de conexão
     */
    const formatRelativeTime = useCallback((timestamp, connectionError = false) => {
        if (!timestamp) return 'Nunca';

        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        // Formatar horário de Brasília
        const brasiliaTime = then.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Tempo relativo
        let relativeTime;
        if (diffMins < 1) relativeTime = 'agora mesmo';
        else if (diffMins === 1) relativeTime = 'há 1 minuto';
        else if (diffMins < 60) relativeTime = `há ${diffMins} minutos`;
        else if (diffHours === 1) relativeTime = 'há 1 hora';
        else if (diffHours < 24) relativeTime = `há ${diffHours} horas`;
        else if (diffDays === 1) relativeTime = 'há 1 dia';
        else relativeTime = `há ${diffDays} dias`;

        // Adicionar status de conexão se houver erro
        const statusSuffix = connectionError ? ' [sem conexão]' : '';

        return `${relativeTime} (${brasiliaTime})${statusSuffix}`;
    }, []);

    // Buscar última sincronização ao montar
    useEffect(() => {
        fetchLastSync();
    }, [fetchLastSync]);

    // Polling: atualizar a cada 1 minuto
    useEffect(() => {
        const interval = setInterval(fetchLastSync, 60000);
        return () => clearInterval(interval);
    }, [fetchLastSync]);

    return {
        lastSync,
        syncing,
        error,
        triggerSync,
        fetchLastSync,
        formatRelativeTime
    };
}
