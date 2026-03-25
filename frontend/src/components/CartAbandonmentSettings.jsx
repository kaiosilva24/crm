import { useState, useEffect } from 'react';
import { api } from '../api';
import { Copy, RefreshCw, Check, X, AlertCircle, TestTube, Download, Calendar, ArrowRightLeft } from 'lucide-react';

export default function CartAbandonmentSettings() {
    const [settings, setSettings] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [copied, setCopied] = useState(false);

    // Advanced features state
    const [syncLoading, setSyncLoading] = useState(null); // event ID being synced
    const [selectedErrors, setSelectedErrors] = useState([]); // Selected error event IDs
    const [dateFilter, setDateFilter] = useState(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        console.log('🗓️ Initializing date filter with LOCAL date:', today);
        return {
            start: today,
            end: today
        };
    });

    // Webhooks devem sempre exibir o caminho absoluto real da produção 
    const baseUrl = 'https://crm.discloud.app';

    const webhookUrl = `${baseUrl}/api/cart-abandonment/webhook`;

    useEffect(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        console.log('🔄 Resetting date to LOCAL today:', today);
        setDateFilter({
            start: today,
            end: today
        });
    }, []);

    useEffect(() => {
        console.log('📅 Date filter changed:', dateFilter);
    }, [dateFilter]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            await Promise.all([
                loadSettings(),
                loadCampaigns(),
                loadEvents()
            ]);
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const response = await fetch(`${baseUrl}/api/cart-abandonment/settings`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setSettings(data.settings || {
                is_enabled: false,
                delay_minutes: 60,
                manychat_tag_name: 'abandono_carrinho',
                manychat_tag_name_second: 'abandono_carrinho_2'
            });
        } catch (error) {
            console.error('Error loading settings:', error);
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

    const loadEvents = async () => {
        try {
            const response = await fetch(`${baseUrl}/api/cart-abandonment/events?limit=20`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setEvents(data.events || []);
        } catch (error) {
            console.error('Error loading events:', error);
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const response = await fetch(`${baseUrl}/api/cart-abandonment/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(settings)
            });

            if (!response.ok) throw new Error('Failed to save');

            alert('✅ Configurações salvas com sucesso!');
            loadSettings();
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('❌ Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        if (!settings.manychat_api_token) {
            alert('⚠️ Insira o API Token do ManyChat primeiro');
            return;
        }

        setTesting(true);
        try {
            const response = await fetch(`${baseUrl}/api/cart-abandonment/test-connection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ api_token: settings.manychat_api_token })
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ Conexão com ManyChat estabelecida com sucesso!');
            } else {
                alert('❌ Falha ao conectar com ManyChat. Verifique o API Token.');
            }
        } catch (error) {
            console.error('Error testing connection:', error);
            alert('❌ Erro ao testar conexão');
        } finally {
            setTesting(false);
        }
    };

    const handleSync = async (eventId) => {
        setSyncLoading(eventId);
        try {
            const response = await fetch(`${baseUrl}/api/cart-abandonment/check-campaign/${eventId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success && data.found) {
                alert('✅ Contato encontrado e marcado como concluído!');
                loadEvents(); // Refresh list to remove from error view
            } else {
                alert('⚠️ Contato não encontrado na campanha configurada.');
            }
        } catch (error) {
            console.error('Error syncing:', error);
            alert('❌ Erro ao sincronizar');
        } finally {
            setSyncLoading(null);
        }
    };

    const handleBulkSync = async () => {
        if (selectedErrors.length === 0) {
            alert('⚠️ Selecione pelo menos um contato para sincronizar');
            return;
        }

        setSyncLoading('bulk');
        let successCount = 0;
        let errorCount = 0;

        for (const eventId of selectedErrors) {
            try {
                const response = await fetch(`${baseUrl}/api/cart-abandonment/check-campaign/${eventId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();

                if (data.success && data.found) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                console.error('Error syncing:', error);
                errorCount++;
            }
        }

        setSyncLoading(null);
        setSelectedErrors([]);
        loadEvents();

        alert(`✅ Sincronização concluída!\n${successCount} encontrados\n${errorCount} não encontrados`);
    };

    const toggleSelectAll = () => {
        const start = new Date(dateFilter.start + 'T00:00:00');
        const end = new Date(dateFilter.end + 'T23:59:59');

        const errorEvents = events.filter(e => {
            const date = new Date(e.created_at);
            return e.status === 'error' && date >= start && date <= end;
        });

        if (selectedErrors.length === errorEvents.length && errorEvents.length > 0) {
            setSelectedErrors([]);
        } else {
            setSelectedErrors(errorEvents.map(e => e.id));
        }
    };

    const toggleSelectError = (eventId) => {
        if (selectedErrors.includes(eventId)) {
            setSelectedErrors(selectedErrors.filter(id => id !== eventId));
        } else {
            setSelectedErrors([...selectedErrors, eventId]);
        }
    };

    const handleDownloadCSV = () => {
        const start = new Date(dateFilter.start + 'T00:00:00');
        const end = new Date(dateFilter.end + 'T23:59:59');

        const filtered = events.filter(e => {
            const date = new Date(e.created_at);
            return e.status === 'error' && date >= start && date <= end;
        });

        if (filtered.length === 0) {
            alert('Nenhum erro encontrado no período selecionado.');
            return;
        }

        const csvContent = "data:text/csv;charset=utf-8,"
            + "Nome,Contato\n"
            + filtered.map(e => {
                const name = (e.contact_name || 'Sem nome').replace(/,/g, '');
                const phone = (e.contact_phone || '').replace(/,/g, '');
                return `${name},${phone}`;
            }).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `contatos_erro_${dateFilter.start}_${dateFilter.end}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: { bg: '#6b7280', icon: AlertCircle, label: 'Pendente' },
            processing: { bg: '#3b82f6', icon: RefreshCw, label: 'Processando' },
            completed: { bg: '#10b981', icon: Check, label: 'Concluído' },
            error: { bg: '#ef4444', icon: X, label: 'Erro' },
            duplicate: { bg: '#f59e0b', icon: AlertCircle, label: 'Duplicado' }
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
                {config.label}
            </span>
        );
    };

    if (loading) {
        return <div>Carregando...</div>;
    }

    return (
        <div style={{ maxWidth: 1200 }}>
            <h2>Abandono de Carrinho</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                Configure o sistema de recuperação de carrinho abandonado com integração ao ManyChat
            </p>

            {/* Webhook URL */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3>URL do Webhook</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Configure esta URL na sua plataforma de pagamento para receber eventos de abandono de carrinho
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        type="text"
                        value={webhookUrl}
                        readOnly
                        className="input"
                        style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}
                    />
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => copyToClipboard(webhookUrl)}
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                </div>
            </div>

            {/* ManyChat Configuration */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3>Configurações ManyChat</h3>

                <div style={{ marginBottom: 16 }}>
                    <label className="label">API Token do ManyChat</label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                        Obtenha o token em: ManyChat → Settings → API
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            type="password"
                            value={settings.manychat_api_token || ''}
                            onChange={(e) => setSettings({ ...settings, manychat_api_token: e.target.value })}
                            className="input"
                            placeholder="Digite o API Token"
                            style={{ flex: 1 }}
                        />
                        <button
                            className="btn btn-secondary"
                            onClick={handleTestConnection}
                            disabled={testing}
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <TestTube size={16} />
                            {testing ? 'Testando...' : 'Testar'}
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label className="label">TAG 1 - Primeira Mensagem</label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                        TAG aplicada imediatamente após o abandono
                    </p>
                    <input
                        type="text"
                        value={settings.manychat_tag_name || 'abandono_carrinho'}
                        onChange={(e) => setSettings({ ...settings, manychat_tag_name: e.target.value })}
                        className="input"
                        placeholder="abandono_carrinho"
                    />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label className="label">TAG 2 - Segunda Mensagem</label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                        TAG aplicada após o delay configurado
                    </p>
                    <input
                        type="text"
                        value={settings.manychat_tag_name_second || 'abandono_carrinho_2'}
                        onChange={(e) => setSettings({ ...settings, manychat_tag_name_second: e.target.value })}
                        className="input"
                        placeholder="abandono_carrinho_2"
                    />
                </div>

                <div style={{
                    marginBottom: 16,
                    padding: 12,
                    borderRadius: 8,
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                    <p style={{ fontSize: '0.85rem', color: '#3b82f6', margin: 0, lineHeight: 1.6 }}>
                        💡 <strong>Novo:</strong> Agora ambas as mensagens são enviadas via API!
                        Você só precisa dos Flow IDs. O campo "Webhook URL" não é mais necessário.
                    </p>
                </div>
            </div>

            {/* Processing Configuration */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3>Configurações de Processamento</h3>

                <div style={{ marginBottom: 16 }}>
                    <label className="label">Delay (minutos)</label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                        Tempo de espera antes de verificar se o contato foi convertido
                    </p>
                    <input
                        type="number"
                        value={settings.delay_minutes || 60}
                        onChange={(e) => setSettings({ ...settings, delay_minutes: parseInt(e.target.value) })}
                        className="input"
                        min="1"
                        max="1440"
                    />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label className="label">Campanha para Verificação</label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                        Campanha onde será verificado se o contato foi convertido
                    </p>
                    <select
                        value={settings.campaign_id || ''}
                        onChange={(e) => setSettings({ ...settings, campaign_id: parseInt(e.target.value) || null })}
                        className="input"
                    >
                        <option value="">Selecione uma campanha</option>
                        {campaigns.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={settings.is_enabled || false}
                            onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
                        />
                        <span>Ativar sistema de abandono de carrinho</span>
                    </label>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleSaveSettings}
                    disabled={saving}
                >
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </div>

            {/* Error Contacts List */}
            {events.filter(e => e.status === 'error').length > 0 && (
                <div className="card" style={{ marginBottom: 24, border: '1px solid #ef4444' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertCircle size={20} color="#ef4444" />
                            <h3 style={{ margin: 0, color: '#ef4444' }}>Contatos com Erro</h3>
                            {selectedErrors.length > 0 && (
                                <span style={{
                                    fontSize: '0.875rem',
                                    color: '#6b7280',
                                    background: '#f3f4f6',
                                    padding: '2px 8px',
                                    borderRadius: 4
                                }}>
                                    {selectedErrors.length} selecionado{selectedErrors.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {/* Filters & CSV */}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                background: 'white',
                                padding: '8px 12px',
                                borderRadius: 6,
                                border: '1px solid #d1d5db',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <input
                                        type="date"
                                        id="date-start-picker"
                                        value={dateFilter.start}
                                        onChange={e => setDateFilter({ ...dateFilter, start: e.target.value })}
                                        style={{
                                            position: 'absolute',
                                            opacity: 0,
                                            width: 1,
                                            height: 1,
                                            zIndex: -1
                                        }}
                                    />
                                    <label
                                        htmlFor="date-start-picker"
                                        style={{
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '4px 8px',
                                            borderRadius: 4,
                                            border: '1px solid #d1d5db',
                                            background: '#f9fafb',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}
                                        onClick={() => document.getElementById('date-start-picker').showPicker()}
                                    >
                                        <Calendar size={18} color="#3b82f6" />
                                        <span style={{ fontSize: '0.875rem', color: '#1f2937' }}>
                                            {dateFilter.start.split('-').reverse().join('/')}
                                        </span>
                                    </label>
                                </div>
                                <span style={{ color: '#9ca3af', fontWeight: 'bold' }}>→</span>
                                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <input
                                        type="date"
                                        id="date-end-picker"
                                        value={dateFilter.end}
                                        onChange={e => setDateFilter({ ...dateFilter, end: e.target.value })}
                                        style={{
                                            position: 'absolute',
                                            opacity: 0,
                                            width: 1,
                                            height: 1,
                                            zIndex: -1
                                        }}
                                    />
                                    <label
                                        htmlFor="date-end-picker"
                                        style={{
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '4px 8px',
                                            borderRadius: 4,
                                            border: '1px solid #d1d5db',
                                            background: '#f9fafb',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}
                                        onClick={() => document.getElementById('date-end-picker').showPicker()}
                                    >
                                        <Calendar size={18} color="#3b82f6" />
                                        <span style={{ fontSize: '0.875rem', color: '#1f2937' }}>
                                            {dateFilter.end.split('-').reverse().join('/')}
                                        </span>
                                    </label>
                                </div>
                            </div>
                            {selectedErrors.length > 0 && (
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={handleBulkSync}
                                    disabled={syncLoading === 'bulk'}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}
                                >
                                    {syncLoading === 'bulk' ? (
                                        <RefreshCw size={14} className="animate-spin" />
                                    ) : (
                                        <ArrowRightLeft size={14} />
                                    )}
                                    Sincronizar Selecionados
                                </button>
                            )}
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={handleDownloadCSV}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}
                            >
                                <Download size={14} />
                                Baixar CSV
                            </button>
                        </div>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                        Estes contatos falharam durante o processamento. Verifique o motivo abaixo.
                    </p>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '0.875rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: 8, width: 40 }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedErrors.length === (() => {
                                                const start = new Date(dateFilter.start + 'T00:00:00');
                                                const end = new Date(dateFilter.end + 'T23:59:59');
                                                return events.filter(e => {
                                                    const date = new Date(e.created_at);
                                                    return e.status === 'error' && date >= start && date <= end;
                                                }).length;
                                            })() && (() => {
                                                const start = new Date(dateFilter.start + 'T00:00:00');
                                                const end = new Date(dateFilter.end + 'T23:59:59');
                                                return events.filter(e => {
                                                    const date = new Date(e.created_at);
                                                    return e.status === 'error' && date >= start && date <= end;
                                                }).length;
                                            })() > 0}
                                            onChange={toggleSelectAll}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </th>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Data</th>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Nome</th>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Contato</th>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Erro</th>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const start = new Date(dateFilter.start + 'T00:00:00');
                                    const end = new Date(dateFilter.end + 'T23:59:59');
                                    return events.filter(e => {
                                        const date = new Date(e.created_at);
                                        return e.status === 'error' && date >= start && date <= end;
                                    });
                                })().map(event => (
                                    <tr key={event.id} style={{ borderTop: '1px solid var(--border)' }}>
                                        <td style={{ padding: 8 }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedErrors.includes(event.id)}
                                                onChange={() => toggleSelectError(event.id)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </td>
                                        <td style={{ padding: 8 }}>
                                            {new Date(event.created_at).toLocaleString('pt-BR')}
                                        </td>
                                        <td style={{ padding: 8, fontWeight: 500 }}>
                                            {event.contact_name || 'Sem nome'}
                                        </td>
                                        <td style={{ padding: 8 }}>
                                            <div>{event.contact_phone || '-'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {event.contact_email}
                                            </div>
                                        </td>
                                        <td style={{ padding: 8, color: '#ef4444' }}>
                                            {event.error_message || 'Erro desconhecido'}
                                        </td>
                                        <td style={{ padding: 8 }}>
                                            {event.in_campaign === null ? (
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '2px 8px',
                                                    borderRadius: 4,
                                                    background: '#f3f4f6',
                                                    color: '#6b7280',
                                                    fontWeight: 500
                                                }}>
                                                    ⏳ Pendente
                                                </span>
                                            ) : event.in_campaign ? (
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '2px 8px',
                                                    borderRadius: 4,
                                                    background: '#dcfce7',
                                                    color: '#16a34a',
                                                    fontWeight: 500
                                                }}>
                                                    ✅ Sim
                                                </span>
                                            ) : (
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '2px 8px',
                                                    borderRadius: 4,
                                                    background: '#fee2e2',
                                                    color: '#dc2626',
                                                    fontWeight: 500
                                                }}>
                                                    ❌ Não
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: 8 }}>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleSync(event.id)}
                                                disabled={syncLoading === event.id || syncLoading === 'bulk'}
                                                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
                                                title="Verificar na Campanha"
                                            >
                                                {syncLoading === event.id ? (
                                                    <RefreshCw size={14} className="animate-spin" />
                                                ) : (
                                                    <ArrowRightLeft size={14} />
                                                )}
                                                Sincronizar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Events Log */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3>Eventos Recentes</h3>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={loadEvents}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <RefreshCw size={14} />
                        Atualizar
                    </button>
                </div>

                {events.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 32 }}>
                        Nenhum evento de abandono recebido ainda
                    </p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '0.875rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Data</th>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Contato</th>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Produto</th>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Automação Enviada</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map(event => (
                                    <tr key={event.id} style={{ borderTop: '1px solid var(--border)' }}>
                                        <td style={{ padding: 8 }}>
                                            {new Date(event.created_at).toLocaleString('pt-BR')}
                                        </td>
                                        <td style={{ padding: 8 }}>
                                            {event.contact_name || '-'}
                                            {event.contact_email && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {event.contact_email}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: 8 }}>{event.product_name || '-'}</td>
                                        <td style={{ padding: 8 }}>{getStatusBadge(event.status)}</td>
                                        <td style={{ padding: 8 }}>
                                            {event.first_message_sent ? (
                                                <Check size={16} style={{ color: '#10b981' }} />
                                            ) : (
                                                <X size={16} style={{
                                                    color: event.status === 'error' ? '#ef4444' : '#6b7280'
                                                }} />
                                            )}
                                        </td>
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
