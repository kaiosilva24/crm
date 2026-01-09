import { useState, useEffect } from 'react';
import { api } from '../api';
import { Copy, RefreshCw, Zap, Check, X, AlertCircle } from 'lucide-react';

export default function HotmartSettings() {
    const [settings, setSettings] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [copied, setCopied] = useState(false);

    const webhookUrl = `${window.location.origin.replace('5173', '3001')}/api/hotmart/webhook`;

    useEffect(() => {
        loadSettings();
        loadCampaigns();
        loadLogs();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await api.getHotmartSettings();
            setSettings(data.settings || {
                webhook_secret: '',
                default_campaign_id: null,
                enable_auto_import: false,
                enable_distribution: false
            });
        } catch (error) {
            console.error('Error loading Hotmart settings:', error);
        } finally {
            setLoading(false);
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

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.updateHotmartSettings(settings);
            alert('✅ Configurações salvas com sucesso!');
            loadSettings();
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('❌ Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateSecret = async () => {
        try {
            const data = await api.generateHotmartSecret();
            setSettings({ ...settings, webhook_secret: data.secret });
        } catch (error) {
            console.error('Error generating secret:', error);
            alert('❌ Erro ao gerar secret');
        }
    };

    const handleTest = async () => {
        setTesting(true);
        try {
            await api.testHotmartWebhook();
            alert('✅ Webhook de teste enviado! Verifique os logs abaixo.');
            loadLogs();
        } catch (error) {
            console.error('Error testing webhook:', error);
            alert('❌ Erro ao testar webhook');
        } finally {
            setTesting(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getStatusBadge = (status) => {
        const styles = {
            success: { bg: '#10b981', icon: Check },
            error: { bg: '#ef4444', icon: X },
            duplicate: { bg: '#f59e0b', icon: AlertCircle }
        };
        const config = styles[status] || styles.error;
        const Icon = config.icon;

        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                borderRadius: 4,
                background: config.bg,
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 600
            }}>
                <Icon size={12} />
                {status}
            </span>
        );
    };

    if (loading) {
        return <div>Carregando...</div>;
    }

    return (
        <div style={{ maxWidth: 1200 }}>
            <h2>Integração Hotmart</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                Configure a importação automática de leads da Hotmart via webhook
            </p>

            {/* Webhook URL */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3>URL do Webhook</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Configure esta URL no painel da Hotmart para receber notificações de compra
                </p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                        type="text"
                        value={webhookUrl}
                        readOnly
                        className="input"
                        style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}
                    />
                    <button
                        className="btn btn-secondary"
                        onClick={() => copyToClipboard(webhookUrl)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                </div>
            </div>

            {/* Configuration */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3>Configuração</h3>

                {/* Webhook Secret */}
                <div style={{ marginBottom: 16 }}>
                    <label className="label">Webhook Secret (opcional)</label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                        Token para validar a autenticidade dos webhooks
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            type="password"
                            value={settings.webhook_secret || ''}
                            onChange={(e) => setSettings({ ...settings, webhook_secret: e.target.value })}
                            className="input"
                            placeholder="Deixe vazio para desabilitar validação"
                            style={{ flex: 1 }}
                        />
                        <button
                            className="btn btn-secondary"
                            onClick={handleGenerateSecret}
                        >
                            Gerar
                        </button>
                    </div>
                </div>

                {/* Default Campaign */}
                <div style={{ marginBottom: 16 }}>
                    <label className="label">Campanha Padrão</label>
                    <select
                        value={settings.default_campaign_id || ''}
                        onChange={(e) => setSettings({ ...settings, default_campaign_id: parseInt(e.target.value) || null })}
                        className="input"
                    >
                        <option value="">Sem campanha</option>
                        {campaigns.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Toggles */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={settings.enable_auto_import || false}
                            onChange={(e) => setSettings({ ...settings, enable_auto_import: e.target.checked })}
                        />
                        <span>Ativar importação automática</span>
                    </label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 28, marginTop: 4 }}>
                        Leads serão criados automaticamente ao receber webhooks
                    </p>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={settings.enable_distribution || false}
                            onChange={(e) => setSettings({ ...settings, enable_distribution: e.target.checked })}
                        />
                        <span>Ativar distribuição Round-Robin</span>
                    </label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 28, marginTop: 4 }}>
                        Leads serão distribuídos automaticamente para vendedoras ativas
                    </p>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ marginTop: 8 }}
                >
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </div>

            {/* Test */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3>Testar Webhook</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Envie um webhook de teste para verificar se está funcionando
                </p>
                <button
                    className="btn btn-secondary"
                    onClick={handleTest}
                    disabled={testing}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    <Zap size={16} />
                    {testing ? 'Enviando...' : 'Enviar Webhook de Teste'}
                </button>
            </div>

            {/* Activity Log */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3>Log de Atividades</h3>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={loadLogs}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
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
                                    <th style={{ textAlign: 'left', padding: 8 }}>Evento</th>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Comprador</th>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Produto</th>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id} style={{ borderTop: '1px solid var(--border)' }}>
                                        <td style={{ padding: 8 }}>
                                            {new Date(log.created_at).toLocaleString('pt-BR')}
                                        </td>
                                        <td style={{ padding: 8 }}>{log.event_type}</td>
                                        <td style={{ padding: 8 }}>
                                            {log.buyer_name || '-'}
                                            {log.buyer_email && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {log.buyer_email}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: 8 }}>{log.product_name || '-'}</td>
                                        <td style={{ padding: 8 }}>{getStatusBadge(log.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
