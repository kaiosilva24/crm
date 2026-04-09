import { useState, useEffect } from 'react';
import { api } from '../api';
import { Copy, RefreshCw, Check, X, AlertCircle, Plus, Trash2, Save } from 'lucide-react';

// Componente isolado para cada card de webhook — evita re-render global ao digitar
function WebhookCard({ config, campaigns, onSave, onDelete }) {
    const baseUrl = 'https://crm.discloud.app';

    // Estado local do card (não dispara reload global ao digitar)
    const [local, setLocal] = useState({
        platform_name: config.platform_name || 'hotmart',
        campaign_id: config.campaign_id || '',
        webhook_secret: config.webhook_secret || '',
        is_enabled: config.is_enabled ?? true,
        enable_round_robin: config.enable_round_robin ?? false,
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);

    // URL dinâmica baseada no platform_name digitado
    const platformSlug = (local.platform_name || 'hotmart').trim().toLowerCase().replace(/\s+/g, '-');
    const webhookUrl = `${baseUrl}/api/webhook/gateway/${platformSlug}`;

    const handleChange = (field, value) => {
        setLocal(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(config.id, { ...local });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setSaving(false);
        }
    };

    const copyUrl = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="card" style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h4 style={{ margin: 0 }}>Webhook #{config.webhook_number}</h4>
                    {local.is_enabled
                        ? <span style={{ fontSize: '0.7rem', background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>ATIVO</span>
                        : <span style={{ fontSize: '0.7rem', background: '#6b7280', color: '#fff', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>INATIVO</span>
                    }
                </div>
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => onDelete(config.id)}
                    style={{ color: '#ef4444' }}
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Nome da Plataforma */}
            <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🏷️ Nome da Plataforma
                </label>
                <input
                    type="text"
                    className="input"
                    value={local.platform_name}
                    onChange={(e) => handleChange('platform_name', e.target.value)}
                    placeholder="Ex: looma, kiwify, hotmart, appmax..."
                    style={{ fontWeight: 600 }}
                />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Este nome aparecerá no filtro "Gateway (Origem)" na aba de Leads automaticamente.
                </p>
            </div>

            {/* URL do Webhook — muda conforme nome digitado */}
            <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🔗 URL do Webhook
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        type="text"
                        value={webhookUrl}
                        readOnly
                        className="input"
                        style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.8rem', background: 'rgba(139,92,246,0.08)', color: 'var(--accent)' }}
                    />
                    <button className="btn btn-secondary btn-sm" onClick={copyUrl}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Cole este link na plataforma de checkout. Ele muda automaticamente conforme o nome acima.
                </p>
            </div>

            {/* Campanha */}
            <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    📁 Campanha
                </label>
                <select
                    value={local.campaign_id}
                    onChange={(e) => handleChange('campaign_id', parseInt(e.target.value) || null)}
                    className="input"
                >
                    <option value="">Sem campanha</option>
                    {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* Webhook Secret */}
            <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🔑 Webhook Secret (opcional)
                </label>
                <input
                    type="text"
                    value={local.webhook_secret}
                    onChange={(e) => handleChange('webhook_secret', e.target.value)}
                    className="input"
                    placeholder="Deixe vazio para desabilitar validação"
                />
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={local.is_enabled}
                        onChange={(e) => handleChange('is_enabled', e.target.checked)}
                    />
                    <span style={{ fontSize: '0.875rem' }}>Ativo</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={local.enable_round_robin}
                        onChange={(e) => handleChange('enable_round_robin', e.target.checked)}
                    />
                    <span style={{ fontSize: '0.875rem' }}>Distribuição Round-Robin</span>
                </label>
            </div>

            {/* Botão Salvar */}
            <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 700 }}
            >
                {saving ? (
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : saved ? (
                    <Check size={16} />
                ) : (
                    <Save size={16} />
                )}
                {saving ? 'Salvando...' : saved ? 'Salvo com sucesso!' : 'Salvar Webhook'}
            </button>
        </div>
    );
}

export default function HotmartSettings() {
    const [configs, setConfigs] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            await Promise.all([loadConfigs(), loadCampaigns(), loadLogs()]);
        } finally {
            setLoading(false);
        }
    };

    const loadConfigs = async () => {
        try {
            const data = await api.getHotmartConfigs();
            setConfigs(data.configs || []);
        } catch (error) {
            console.error('Error loading webhook configs:', error);
        }
    };

    const loadCampaigns = async () => {
        try {
            const data = await api.getCampaigns();
            setCampaigns(data.campaigns || []);
        } catch (error) {
            console.error('Error loading campaigns:', error);
        }
    };

    const loadLogs = async () => {
        try {
            const data = await api.getHotmartLogs();
            setLogs(data.logs || []);
        } catch (error) {
            console.error('Error loading logs:', error);
        }
    };

    const handleCreateWebhook = async () => {
        try {
            await api.createHotmartConfig({ campaign_id: null, webhook_secret: '', platform_name: 'hotmart' });
            loadConfigs();
        } catch (error) {
            alert('❌ Erro ao criar webhook');
        }
    };

    const handleSaveConfig = async (id, updates) => {
        await api.updateHotmartConfig(id, updates);
        // Não recarrega a lista — evita reset dos inputs
    };

    const handleDeleteConfig = async (id) => {
        if (!confirm('Tem certeza que deseja deletar este webhook?')) return;
        try {
            await api.deleteHotmartConfig(id);
            loadConfigs();
        } catch (error) {
            alert('❌ Erro ao deletar webhook');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            success: { bg: '#10b981', icon: Check },
            error: { bg: '#ef4444', icon: X },
            duplicate: { bg: '#f59e0b', icon: AlertCircle }
        };
        const cfg = styles[status] || styles.error;
        const Icon = cfg.icon;
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 4, background: cfg.bg, color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>
                <Icon size={12} />{status}
            </span>
        );
    };

    if (loading) return <div>Carregando...</div>;

    return (
        <div style={{ maxWidth: 1200 }}>
            <h2>Integração Webhook</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                Configure múltiplos webhooks para receber leads de diferentes plataformas de pagamento (Hotmart, Looma, Kiwify, etc.)
            </p>

            {/* Webhook Configurations */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0 }}>Webhooks Configurados</h3>
                    <button
                        className="btn btn-primary"
                        onClick={handleCreateWebhook}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <Plus size={16} />
                        Criar Novo Webhook
                    </button>
                </div>

                {configs.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 32 }}>
                        Nenhum webhook configurado. Clique em "Criar Novo Webhook" para começar.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {configs.map(config => (
                            <WebhookCard
                                key={config.id}
                                config={config}
                                campaigns={campaigns}
                                onSave={handleSaveConfig}
                                onDelete={handleDeleteConfig}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Activity Log */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3>Log de Atividades</h3>
                    <button className="btn btn-ghost btn-sm" onClick={loadLogs} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <RefreshCw size={14} />
                        Atualizar
                    </button>
                </div>

                {logs.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 32 }}>
                        Nenhum webhook recebido ainda
                    </p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '0.875rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Data</th>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Plataforma</th>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Evento</th>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Comprador</th>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Produto</th>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => {
                                    const webhookConfig = configs.find(c => c.id === log.webhook_config_id);
                                    return (
                                        <tr key={log.id} style={{ borderTop: '1px solid var(--border)' }}>
                                            <td style={{ padding: 8 }}>{new Date(log.created_at).toLocaleString('pt-BR')}</td>
                                            <td style={{ padding: 8, textTransform: 'capitalize', fontWeight: 600, color: 'var(--accent)' }}>
                                                {webhookConfig?.platform_name || `#${webhookConfig?.webhook_number || '-'}`}
                                            </td>
                                            <td style={{ padding: 8 }}>{log.event_type}</td>
                                            <td style={{ padding: 8 }}>
                                                {log.buyer_name || '-'}
                                                {log.buyer_email && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.buyer_email}</div>}
                                            </td>
                                            <td style={{ padding: 8 }}>{log.product_name || '-'}</td>
                                            <td style={{ padding: 8 }}>{getStatusBadge(log.status)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
