import fs from 'fs';

const content = fs.readFileSync('frontend/src/pages/Settings.jsx', 'utf-8');

const startMarker = '// ==============================\n// GREATPAGES SETTINGS TAB\n// ==============================';
const endMarker = '// ==============================\n// WHATSAPP TEMPLATES TAB (ADMIN VIEW)\n// ==============================';

const newCode = `// ==============================
// GREATPAGES SETTINGS TAB
// ==============================
function GreatPagesSettings() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    
    // Novo Estado de Integrações Múltiplas
    const [integrations, setIntegrations] = useState([]);

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const [baseUrl, setBaseUrl] = useState(
        isLocal ? "" : \`\${window.location.protocol}//\${window.location.host}\`
    );

    const [greatPagesLogs, setGreatPagesLogs] = useState([]);
    const [savingUrl, setSavingUrl] = useState(false);
    const [urlSaved, setUrlSaved] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const apiSettings = await api.getApiSettings();
                setSettings(apiSettings);
                
                // Load integrations
                setIntegrations(apiSettings.greatpages_integrations || []);

                if (isLocal && apiSettings.greatpages_ngrok_url) {
                    setBaseUrl(apiSettings.greatpages_ngrok_url);
                }

                // Se não houver integrações e existir a default antiga, migramos visualmente
                if ((!apiSettings.greatpages_integrations || apiSettings.greatpages_integrations.length === 0) && apiSettings.greatpages_default_campaign_id) {
                     setIntegrations([{
                         id: 'migrated_default',
                         name: 'Integração Principal (Legado)',
                         campaign_id: String(apiSettings.greatpages_default_campaign_id)
                     }]);
                }

                const campsData = await api.getCampaigns({ active_only: true });
                setCampaigns(campsData.campaigns || []);
            } catch (e) {
                console.error('Erro ao carregar settings:', e);
            } finally {
                setLoading(false);
            }
        };
        load();

        const fetchLogs = async () => {
            try {
                const data = await api.getGreatPagesLogs();
                if (data && data.logs) setGreatPagesLogs(data.logs);
            } catch (e) {
                console.error('Error fetching GreatPages logs', e);
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    const toggleSetting = async (key, value) => {
        try {
            await api.updateApiSettings({ [key]: value });
            setSettings({ ...settings, [key]: value });
        } catch (e) {
            console.error('Erro ao atualizar configuração:', e);
            alert('Erro ao atualizar configuração');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('URL Copiada!');
    };

    const addIntegration = () => {
        setIntegrations([
            ...integrations,
            { id: 'new_' + Date.now(), name: '', campaign_id: '' }
        ]);
    };

    const updateIntegration = (index, field, value) => {
        const newInts = [...integrations];
        newInts[index][field] = value;
        setIntegrations(newInts);
    };

    const removeIntegration = (index) => {
        if(window.confirm('Tem certeza que deseja remover esta integração do GreatPages?')) {
            const newInts = [...integrations];
            newInts.splice(index, 1);
            setIntegrations(newInts);
        }
    };

    if (loading) return <div className="card">Carregando...</div>;

    const baseWebhookUrl = \`\${baseUrl}/api/webhook/greatpages\`;

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0 }}><Plug size={20} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} /> Integração GreatPages</h3>
                <button type="button" className="btn btn-primary" onClick={addIntegration} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    + Adicionar Integração
                </button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                Receba leads automaticamente das suas landing pages criadas no GreatPages via Webhook. Crie quantas configurações precisar e atribua campanhas diferentes.
            </p>

            <div style={{ marginBottom: 24, padding: 16, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <h4 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RefreshCw size={18} />
                    Configurações Globais de Distribuição
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={settings?.round_robin_enabled !== false}
                            onChange={e => toggleSetting('round_robin_enabled', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                    <span style={{ fontWeight: 500 }}>Distribuição Automática (Round-Robin)</span>
                </div>
            </div>

            {integrations.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: 48, marginBottom: 24 }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Nenhuma integração GreatPages configurada.</p>
                    <button type="button" className="btn btn-primary" onClick={addIntegration} style={{ marginTop: 16 }}>
                        + Criar Primeira Integração
                    </button>
                </div>
            )}

            {integrations.map((intg, index) => {
                let currentWebhookUrl = baseWebhookUrl;
                if (intg.campaign_id) {
                    const matchedCamp = campaigns.find(c => c.id == intg.campaign_id);
                    if (matchedCamp && matchedCamp.uuid) {
                        currentWebhookUrl += \`?campaign=\${matchedCamp.uuid}\`;
                    }
                }

                return (
                    <div key={intg.id || index} className="card" style={{ marginBottom: 24, padding: 20, border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                            <h4 style={{ margin: 0, color: 'var(--accent)' }}>Integração #{index + 1}</h4>
                            <button type="button" className="btn btn-danger" onClick={() => removeIntegration(index)} style={{ padding: '6px 12px', fontSize: '0.875rem' }}>
                                Remover Regra
                            </button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div>
                                <label className="label">Nome de Identificação</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={intg.name || ''}
                                    onChange={(e) => updateIntegration(index, 'name', e.target.value)}
                                    placeholder="Ex: LP Captura Black Friday"
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>Nome para uso interno.</p>
                            </div>
                            
                            <div>
                                <label className="label">Campanha do Lead</label>
                                <select
                                    className="input"
                                    value={intg.campaign_id || ''}
                                    onChange={(e) => updateIntegration(index, 'campaign_id', e.target.value)}
                                >
                                    <option value="">-- Sem Campanha Específica (Global) --</option>
                                    {campaigns.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>Leads desta URL entrarão nesta campanha.</p>
                            </div>
                        </div>

                        <div style={{
                            padding: 16,
                            borderRadius: 8,
                            background: 'var(--bg-primary)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                        }}>
                            <label className="label" style={{ color: '#6366f1', fontWeight: 600 }}>URL do Webhook para esta Integração</label>
                            
                            {!baseUrl && isLocal ? (
                                <p style={{ color: '#ca8a04', fontSize: '0.85rem' }}>⚠️ Salve a URL do ngrok nas configurações abaixo.</p>
                            ) : (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input 
                                        readOnly 
                                        value={currentWebhookUrl} 
                                        className="input"
                                        style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.85rem', background: 'var(--bg-secondary)' }} 
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => copyToClipboard(currentWebhookUrl)}
                                    >
                                        <Copy size={16} /> Copiar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            <div style={{ marginBottom: 32 }}>
                <button
                    className="btn btn-primary"
                    onClick={async () => {
                        setSavingUrl(true);
                        try {
                            const configToSave = {
                                greatpages_integrations: integrations
                            };

                            console.log('💾 Salvando integrações do GreatPages:', configToSave);
                            await api.updateApiSettings(configToSave);

                            setSettings({
                                ...settings,
                                ...configToSave
                            });

                            setUrlSaved(true);
                            setTimeout(() => setUrlSaved(false), 3000);
                        } catch (err) {
                            console.error('❌ Erro ao salvar configurações:', err);
                            alert('❌ Erro ao salvar configurações: ' + err.message);
                        } finally {
                            setSavingUrl(false);
                        }
                    }}
                    disabled={savingUrl}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 24px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        background: urlSaved ? '#10b981' : undefined,
                        minWidth: 200
                    }}
                >
                    {urlSaved ? (
                        <>
                            <Check size={20} />
                            Integrações Salvas!
                        </>
                    ) : savingUrl ? (
                        <>
                            <RefreshCw size={20} className="spinning" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Salvar Regras
                        </>
                    )}
                </button>
            </div>

            {/* SEÇÃO UTM — Configuração de Rastreamento */}
            <div style={{ marginBottom: 24, padding: 16, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <h4 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    📣 Rastreamento UTM (Meta Ads / Google Ads)
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                    O Meta Ads entrega automaticamente os parâmetros UTM no payload do webhook do GreatPages.
                    O CRM já os captura nos campos abaixo. Configure os nomes dos parâmetros conforme sua conta do Meta.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
                    {[
                        { key: 'utm_source', label: 'utm_source', desc: 'Plataforma (ex: facebook)', example: 'facebook' },
                        { key: 'utm_medium', label: 'utm_medium', desc: 'Tipo de tráfego (ex: cpc)', example: 'paid' },
                        { key: 'utm_campaign', label: 'utm_campaign', desc: 'Nome da campanha no Meta', example: 'LP11ABRIL26-Vendas' },
                        { key: 'utm_content', label: 'utm_content', desc: 'Anúncio específico', example: 'Video-Depoimento-1' },
                        { key: 'utm_term', label: 'utm_term', desc: 'Conjunto de anúncios', example: 'Conjunto-Interesses-01' },
                    ].map(({ key, label, desc, example }) => (
                        <div key={key}>
                            <label className="form-label" style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#6366f1' }}>
                                {label}
                            </label>
                            <input
                                className="form-input"
                                readOnly
                                value={key}
                                style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'var(--bg-primary)', cursor: 'default' }}
                            />
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', display: 'block', marginTop: 4 }}>
                                {desc} — ex: <em>{example}</em>
                            </small>
                        </div>
                    ))}
                </div>

                <div style={{ padding: 12, borderRadius: 6, background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <p style={{ fontSize: '0.8rem', color: '#6366f1', margin: 0, lineHeight: 1.6 }}>
                        💡 <strong>Como funciona:</strong> Ao criar um anúncio no Meta Ads, adicione os parâmetros UTM na URL de destino da landing page GreatPages.
                        O GreatPages os repassa no payload do webhook e o CRM os armazena automaticamente na <strong>Jornada do Lead</strong>,
                        permitindo rastrear de qual campanha, conjunto e anúncio cada lead veio.
                    </p>
                    <div style={{ marginTop: 10, padding: 10, background: 'rgba(0,0,0,0.15)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.75rem', color: '#a5b4fc', wordBreak: 'break-all' }}>
                        {\`https://suapagina.com/?utm_source=facebook&utm_medium=paid\`}<br />
                        {\`&utm_campaign=NomeDaCampanha&utm_content=NomeDoAnuncio&utm_term=NomeDoConjunto\`}
                    </div>
                </div>
            </div>

            {isLocal && (
                <div style={{ marginBottom: 24, padding: 16, borderRadius: 8, background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <RefreshCw size={18} color="#ca8a04" />
                        <h4 style={{ margin: 0, color: '#ca8a04', fontSize: '0.95rem', fontWeight: 600 }}>
                            ⚠️ Configuração de Desenvolvimento (Ngrok)
                        </h4>
                    </div>
                    <input
                        className="input"
                        style={{ borderColor: '#fde047' }}
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="Ex: https://0b081c480a0e.ngrok-free.app"
                    />
                    <div style={{ marginTop: 8 }}>
                         <button className="btn btn-secondary btn-sm" onClick={async () => {
                             await api.updateApiSettings({ greatpages_ngrok_url: baseUrl });
                             alert('Ngrok URL Salva!');
                         }}>
                             Salvar Ngrok URL
                         </button>
                    </div>
                </div>
            )}

            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={18} />
                    Como configurar no GreatPages:
                </h4>
                <ol style={{ paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.8 }}>
                    <li>Acesse o <strong>editor da sua página</strong> no GreatPages.</li>
                    <li>Clique no <strong>formulário</strong> onde deseja capturar os leads.</li>
                    <li>No menu lateral, vá em <strong>Integrações</strong> → <strong>Webhook</strong>.</li>
                    <li>Cole a <strong>URL copiada de uma das suas integrações acima</strong> no campo "URL do Webhook".</li>
                    <li>Selecione o método <strong>POST</strong>.</li>
                </ol>
            </div>

            <div style={{ marginTop: 24 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <History size={20} />
                    Logs de Atividade (Últimos Leads Recebidos)
                </h4>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    {greatPagesLogs.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Nenhum lead recebido do GreatPages ainda.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '8px 16px' }}>Lead</th>
                                    <th style={{ padding: '8px 16px' }}>Contato</th>
                                    <th style={{ padding: '8px 16px' }}>Campanha</th>
                                    <th style={{ padding: '8px 16px' }}>Recebido em</th>
                                </tr>
                            </thead>
                            <tbody>
                                {greatPagesLogs.map((log, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '8px 16px' }}>{log.first_name || 'Sem nome'}</td>
                                        <td style={{ padding: '8px 16px' }}>{log.email || log.phone || '-'}</td>
                                        <td style={{ padding: '8px 16px' }}>
                                            {log.campaign_name ? (
                                                <span style={{
                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                    color: '#6366f1',
                                                    padding: '2px 8px',
                                                    borderRadius: 4,
                                                    fontSize: '0.8rem'
                                                }}>
                                                    {log.campaign_name}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Sem campanha</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '8px 16px', color: 'var(--text-secondary)' }}>
                                            {log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

\n`;

const parts = content.split(startMarker);
const before = parts[0];
const after = parts[1].split(endMarker)[1];

let finalBefore = before;
if (!finalBefore.includes('Save,')) {
    finalBefore = finalBefore.replace('Copy,', 'Copy, Save,');
}

const finalContent = finalBefore + newCode + endMarker + after;
fs.writeFileSync('frontend/src/pages/Settings.jsx', finalContent);
console.log('File successfully updated.');
