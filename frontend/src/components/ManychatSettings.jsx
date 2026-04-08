import { useState, useEffect } from 'react';
import { api } from '../api';
import { Save, Activity, CheckCircle, XCircle, Zap, RefreshCw, Check, X, Calendar, AlertCircle, Download } from 'lucide-react';

export default function ManychatSettings() {
    const [automations, setAutomations] = useState([]);
    
    // Webhooks loaded from hotmart_webhook_configs
    const [webhooks, setWebhooks] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null); // 'success' | 'error' | null

    // Test Area State
    const [testLead, setTestLead] = useState({
        name: '',
        email: '',
        phone: '',
        tag: ''
    });
    const [sendingTest, setSendingTest] = useState(false);

    const [events, setEvents] = useState([]);
    const [dateFilter, setDateFilter] = useState(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        return {
            start: today,
            end: today
        };
    });

    useEffect(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        setDateFilter({
            start: today,
            end: today
        });
    }, []);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [settingsData, webhooksData, campaignsData] = await Promise.all([
                api.getManychatSettings(),
                api.getHotmartConfigs(),
                api.getCampaigns()
            ]);
            
            if (settingsData.settings) {
                setAutomations(
                    Array.isArray(settingsData.settings) 
                        ? settingsData.settings 
                        : [settingsData.settings] // For backward compat with old endpoints if needed
                );
            }

            if (webhooksData.configs) {
                setWebhooks(webhooksData.configs);
            }

            if (campaignsData) {
                 setCampaigns(Array.isArray(campaignsData) ? campaignsData : (campaignsData.campaigns || []));
            }

            // Load events initially
            await loadEvents();
        } catch (error) {
            console.error('Error loading ManyChat settings:', error);
            alert('❌ Erro ao carregar configurações do ManyChat');
        } finally {
            setLoading(false);
        }
    };

    const loadEvents = async () => {
        try {
            const data = await api.getManychatEvents({ limit: 50 });
            setEvents(data.events || []);
        } catch (error) {
            console.error('Error loading Manychat events:', error);
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
            + "Nome,Contato,Erro\n"
            + filtered.map(e => {
                const name = (e.contact_name || 'Sem nome').replace(/,/g, '');
                const phone = (e.contact_phone || '').replace(/,/g, '');
                const err = (e.error_message || 'Erro Desconhecido').replace(/,/g, ' ');
                return `${name},${phone},${err}`;
            }).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `manychat_erros_${dateFilter.start}_${dateFilter.end}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.updateManychatSettings({ settings: automations });
            alert('✅ Configurações salvas com sucesso!');
            loadData();
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('❌ Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const updateAutomation = (index, field, value) => {
        const newAutos = [...automations];
        newAutos[index][field] = value;
        setAutomations(newAutos);
    }

    const addAutomation = () => {
        setAutomations([
            ...automations, 
            {
                id: 'new_' + Date.now(),
                is_enabled: true,
                webhook_config_id: '',
                campaign_id: '',
                manychat_api_token: '',
                manychat_tag_name: '',
                manychat_custom_field_name: '',
                prepend_number: '',
                custom_name: ''
            }
        ]);
    }

    const removeAutomation = (index) => {
        if(window.confirm('Tem certeza que deseja remover esta automação?')) {
            const newAutos = [...automations];
            newAutos.splice(index, 1);
            setAutomations(newAutos);
        }
    }

    const handleTestConnection = async (token) => {
        if (!token) {
            alert('⚠️ Insira o API Token antes de testar a conexão');
            return;
        }

        setTestingConnection(true);
        setConnectionStatus(null);
        
        try {
            const response = await api.testManychatConnection(token);
            if (response.success) {
                setConnectionStatus('success');
            } else {
                setConnectionStatus('error');
            }
        } catch (error) {
            console.error('Error testing connection:', error);
            setConnectionStatus('error');
        } finally {
            setTestingConnection(false);
        }
    };

    const handleSendTestAutomation = async () => {
        if (!testLead.name || (!testLead.phone && !testLead.email)) {
             alert('⚠️ Preencha pelo menos o Nome e (Telefone ou Email) para testar a automação.');
             return;
        }

        setSendingTest(true);
        try {
             const res = await api.sendManychatTestAutomation(testLead);
             alert('✅ ' + res.message);
        } catch (error) {
             console.error('Error testing automation:', error);
             alert('❌ Erro no envio: ' + (error.message || 'Verifique se as configurações estão ativas e salvas.'));
        } finally {
             setSendingTest(false);
        }
    };

    if (loading) return <div>Carregando configurações...</div>;

    return (
        <form onSubmit={handleSave} style={{ maxWidth: 800 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2>Configurações ManyChat Automação</h2>
                <button type="button" className="btn btn-primary" onClick={addAutomation} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    + Adicionar Automação
                </button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                Configure múltiplas integrações para serem disparadas ao receber Webhooks ou eventos de Campanhas. 
                Cada regra roda individualmente. Os contatos serão pesquisados, criados ou atualizados e a respectiva tag será aplicada.
            </p>

            {automations.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: 48, marginBottom: 24 }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Nenhuma automação configurada.</p>
                    <button type="button" className="btn btn-primary" onClick={addAutomation} style={{ marginTop: 16 }}>
                        + Criar Primeira Automação
                    </button>
                </div>
            )}

            {automations.map((settings, index) => (
                <div key={settings.id || index} className="card" style={{ marginBottom: 24, position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                        <h3 style={{ margin: 0 }}>Automação #{index + 1}</h3>
                        <button type="button" className="btn btn-danger" onClick={() => removeAutomation(index)} style={{ padding: '6px 12px', fontSize: '0.875rem' }}>
                            Remover Regra
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                        
                        {/* Enable Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={settings.is_enabled}
                                    onChange={(e) => updateAutomation(index, 'is_enabled', e.target.checked)}
                                />
                                <span className="slider round"></span>
                            </label>
                            <span style={{ fontWeight: 500 }}>
                                {settings.is_enabled ? 'Automação ManyChat Ativada' : 'Automação Muitos Desativada (Pausada)'}
                            </span>
                        </div>

                        {/* Webhook Selector */}
                        <div>
                            <label className="label">Opção 1: Ouvir Eventos Deste Webhook</label>
                            <select
                                className="input"
                                value={settings.webhook_config_id || ''}
                                onChange={(e) => updateAutomation(index, 'webhook_config_id', e.target.value)}
                            >
                                <option value="">-- Ignorar Webhooks --</option>
                                {webhooks.map(webhook => (
                                    <option key={webhook.id} value={webhook.id}>
                                        Webhook #{webhook.webhook_number}
                                    </option>
                                ))}
                            </select>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                A automação ManyChat será disparada quando os leads vierem através do webhook configurado acima.
                            </p>
                        </div>

                        {/* Campaign Selector */}
                        <div>
                            <label className="label">Opção 2: Ouvir Eventos Desta Campanha Específica (Ex: GreatPages)</label>
                            <select
                                className="input"
                                value={settings.campaign_id || ''}
                                onChange={(e) => updateAutomation(index, 'campaign_id', e.target.value)}
                            >
                                <option value="">-- Ignorar Campanhas --</option>
                                {campaigns.map(camp => (
                                    <option key={camp.id} value={camp.id}>
                                        {camp.name}
                                    </option>
                                ))}
                            </select>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                A automação ManyChat será disparada quando um lead for inserido na campanha configurada (Ideal para envios Webhook GreatPages/Landing pages manuais).
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
                            {/* Prepend Number */}
                            <div>
                                <label className="label">Número Adicional de Telefone (Opcional)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={settings.prepend_number || ''}
                                    onChange={(e) => updateAutomation(index, 'prepend_number', e.target.value)}
                                    placeholder="Ex: 55"
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                    Se preenchido, o sistema concatenará este valor. Ex: forçar DDI.
                                </p>
                            </div>

                            {/* Custom Name */}
                            <div>
                                <label className="label">Nome Personalizado Sequencial (Opcional)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={settings.custom_name || ''}
                                    onChange={(e) => updateAutomation(index, 'custom_name', e.target.value)}
                                    placeholder="Ex: Lead Campanha Alfa"
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                    Se em branco enviará nome original. Ex: preencher "Teste" ➜ "Teste 1".
                                </p>
                            </div>
                        </div>

                        {/* API Token */}
                        <div style={{ marginTop: 8 }}>
                            <label className="label">ManyChat API Token</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    type="password"
                                    className="input"
                                    value={settings.manychat_api_token || ''}
                                    onChange={(e) => {
                                        updateAutomation(index, 'manychat_api_token', e.target.value);
                                        setConnectionStatus(null);
                                    }}
                                    required={settings.is_enabled}
                                    placeholder="Insira o seu API Token..."
                                    style={{ flex: 1 }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => handleTestConnection(settings.manychat_api_token)}
                                    disabled={testingConnection || !settings.manychat_api_token}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                                >
                                    <Activity size={16} />
                                    Testar
                                </button>
                            </div>
                            
                            {/* Simple visual connection status trick for the last tested index */}
                            {connectionStatus === 'success' && (
                                <p style={{ color: '#10b981', fontSize: '0.875rem', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <CheckCircle size={16} /> Conectado com sucesso!
                                </p>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16, marginTop: 8 }}>
                            {/* Tag Name */}
                            <div>
                                <label className="label">Nome da Tag (Para Disparar Automação)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={settings.manychat_tag_name || ''}
                                    onChange={(e) => updateAutomation(index, 'manychat_tag_name', e.target.value)}
                                    required={settings.is_enabled}
                                    placeholder="Ex: [LEAD]-[SONO]"
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                    A tag para forçar o disparo do evento.
                                </p>
                            </div>

                            {/* Custom Field Name */}
                            <div>
                                <label className="label">Nome do Campo Personalizado (Fallback Busca)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={settings.manychat_custom_field_name || ''}
                                    onChange={(e) => updateAutomation(index, 'manychat_custom_field_name', e.target.value)}
                                    placeholder="Ex: Telefone WhatsApp"
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                    Campo de usuário. Deixe em branco para usar "Telefone WhatsApp".
                                </p>
                            </div>
                        </div>
                        
                    </div>
                </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                    style={{ minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                    <Save size={16} />
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </div>
            
            <hr style={{ border: '1px solid var(--border)', marginBottom: 32 }} />

            <div className="card" style={{ marginBottom: 24, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <h3>🧪 Área de Teste Local</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.875rem' }}>
                    Utilize os campos abaixo para simular o recebimento de um lead e forçar o envio direto para o ManyChat, 
                    <br/>sem precisar disparar um webhook real. Atenção: <b>Salve as configurações antes de testar!</b>
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                        <label className="label">Nome do Lead</label>
                        <input
                            type="text"
                            className="input"
                            value={testLead.name}
                            onChange={(e) => setTestLead({ ...testLead, name: e.target.value })}
                            placeholder="Ex: João da Silva"
                        />
                    </div>
                    <div>
                        <label className="label">E-mail do Lead (Opcional)</label>
                        <input
                            type="email"
                            className="input"
                            value={testLead.email}
                            onChange={(e) => setTestLead({ ...testLead, email: e.target.value })}
                            placeholder="Ex: joao@email.com"
                        />
                    </div>
                    <div>
                        <label className="label">Telefone (Obrigatório para o Manychat)</label>
                        <input
                            type="text"
                            className="input"
                            value={testLead.phone}
                            onChange={(e) => setTestLead({ ...testLead, phone: e.target.value })}
                            placeholder="Ex: 5511999999999"
                        />
                    </div>
                </div>
                <div style={{ marginTop: 16 }}>
                        <label className="label">Nome da Tag (Para Teste)</label>
                        <input
                            type="text"
                            className="input"
                            value={testLead.tag}
                            onChange={(e) => setTestLead({ ...testLead, tag: e.target.value })}
                            placeholder="Se vazio, usa a tag salva nas configurações acima"
                        />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                     <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleSendTestAutomation}
                        disabled={sendingTest || (!testLead.phone && !testLead.email)}
                        style={{ minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                        <Zap size={16} />
                        {sendingTest ? 'Enviando...' : 'Disparar Automação de Teste'}
                    </button>
                </div>
            </div>

            {/* ERROR LOGS */}
            <div style={{
                marginBottom: 24,
                background: '#1e293b',
                border: '1px solid #ef4444',
                borderRadius: 8,
                padding: 24,
                position: 'relative',
                overflow: 'hidden'
            }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: 4,
                        height: '100%',
                        background: '#ef4444'
                    }} />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <AlertCircle color="#ef4444" size={24} />
                            <h3 style={{ color: '#ef4444', margin: 0 }}>Contatos com Erro</h3>
                        </div>
                        
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            {/* Date Filter */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', padding: 4, borderRadius: 6 }}>
                                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <input
                                        type="date"
                                        id="date-start-picker"
                                        value={dateFilter.start}
                                        onChange={e => setDateFilter({ ...dateFilter, start: e.target.value })}
                                        style={{ position: 'absolute', opacity: 0, width: 1, height: 1, zIndex: -1 }}
                                    />
                                    <label
                                        htmlFor="date-start-picker"
                                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', background: '#f9fafb' }}
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
                                        style={{ position: 'absolute', opacity: 0, width: 1, height: 1, zIndex: -1 }}
                                    />
                                    <label
                                        htmlFor="date-end-picker"
                                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', background: '#f9fafb' }}
                                    >
                                        <Calendar size={18} color="#3b82f6" />
                                        <span style={{ fontSize: '0.875rem', color: '#1f2937' }}>
                                            {dateFilter.end.split('-').reverse().join('/')}
                                        </span>
                                    </label>
                                </div>
                            </div>
                            <button
                                type="button"
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
                        Estes contatos falharam durante o processamento da automação para o ManyChat. Verifique o motivo abaixo.
                    </p>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '0.875rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Data</th>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Nome</th>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Contato</th>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Erro</th>
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            {/* RECENT EVENTS */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3>Eventos Recentes</h3>
                    <button
                        type="button"
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
                        Nenhum evento registrado ainda. O sistema testará a automação ou receberá webhooks para preencher esta área.
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
                                        <td style={{ padding: 8 }}>
                                            {event.status === 'success' ? (
                                                <span style={{ padding: '4px 8px', borderRadius: 4, background: '#dcfce7', color: '#16a34a', fontWeight: 500, fontSize: '0.75rem' }}>
                                                    ✅ Concluído
                                                </span>
                                            ) : event.status === 'processing' ? (
                                                <span style={{ padding: '4px 8px', borderRadius: 4, background: '#fef3c7', color: '#d97706', fontWeight: 500, fontSize: '0.75rem' }}>
                                                    ⏳ Processando
                                                </span>
                                            ) : (
                                                <span style={{ padding: '4px 8px', borderRadius: 4, background: '#fee2e2', color: '#dc2626', fontWeight: 500, fontSize: '0.75rem' }}>
                                                    ❌ Erro
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: 8 }}>
                                            {event.automation_status === 'success' ? (
                                                <Check size={16} style={{ color: '#10b981' }} />
                                            ) : (
                                                <X size={16} style={{
                                                    color: event.automation_status === 'error' ? '#ef4444' : '#6b7280'
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
        </form>
    );
}
