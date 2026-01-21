import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { TrendingUp, Users, CheckCircle, Clock, MessageSquare, CheckSquare, DollarSign, UserCheck, UserX, Filter, Calendar, Phone } from 'lucide-react';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState([]);
    const [subcampaigns, setSubcampaigns] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [campaignFilter, setCampaignFilter] = useState('');
    const [subcampaignFilter, setSubcampaignFilter] = useState('');
    const { isAdmin } = useAuth();

    const loadDashboard = (campaign_id, subcampaign_id) => {
        setLoading(true);
        const params = {};
        if (campaign_id) params.campaign_id = campaign_id;
        if (subcampaign_id) params.subcampaign_id = subcampaign_id;
        api.getDashboard(params).then(setData).finally(() => setLoading(false));
    };

    const loadSchedules = () => {
        api.getSchedules({ upcoming_only: true }).then(d => setSchedules(d.schedules || [])).catch(() => { });
    };

    useEffect(() => {
        loadDashboard();
        loadSchedules();
        // Carregar campanhas para admin e vendedoras
        api.getCampaigns({ active_only: false }).then(d => setCampaigns(d.campaigns || []));
        if (isAdmin) {
            api.getSubcampaigns({}).then(d => setSubcampaigns(d.subcampaigns || [])).catch(() => { });
        }
    }, [isAdmin]);

    useEffect(() => {
        loadDashboard(campaignFilter, subcampaignFilter);
    }, [campaignFilter, subcampaignFilter]);

    // Subcampanhas filtradas pela campanha selecionada
    const filteredSubcampaigns = subcampaigns.filter(sc =>
        !campaignFilter || sc.campaign_id === parseInt(campaignFilter)
    );

    if (loading && !data) return <div className="card">Carregando...</div>;
    if (!data) return <div className="card">Erro ao carregar dados</div>;

    return (
        <div className="fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <h1 className="page-title">{isAdmin ? 'Dashboard Administrativo' : 'Meu Painel'}</h1>
                {campaigns.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Filter size={16} color="var(--text-secondary)" />
                        <select
                            className="form-select"
                            style={{ minWidth: 180 }}
                            value={campaignFilter}
                            onChange={e => { setCampaignFilter(e.target.value); setSubcampaignFilter(''); }}
                        >
                            <option value="">Todas as Campanhas</option>
                            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {isAdmin && campaignFilter && filteredSubcampaigns.length > 0 && (
                            <select
                                className="form-select"
                                style={{ minWidth: 150 }}
                                value={subcampaignFilter}
                                onChange={e => setSubcampaignFilter(e.target.value)}
                            >
                                <option value="">Campanha Original</option>
                                {filteredSubcampaigns.map(sc => (
                                    <option key={sc.id} value={sc.id} style={{ color: sc.color }}>
                                        ● {sc.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                )}
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ background: 'rgba(99,102,241,0.2)', padding: 12, borderRadius: 12 }}><Users size={24} color="#6366f1" /></div>
                        <div><div className="stat-value">{data.summary.totalLeads}</div><div className="stat-label">Total de Leads</div></div>
                    </div>
                </div>
                {isAdmin && (
                    <div className="stat-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ background: 'rgba(245,158,11,0.2)', padding: 12, borderRadius: 12 }}><Clock size={24} color="#f59e0b" /></div>
                            <div><div className="stat-value">{data.summary.today}</div><div className="stat-label">Leads Hoje</div></div>
                        </div>
                    </div>
                )}
                {!isAdmin && (
                    <div className="stat-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ background: 'rgba(245,158,11,0.2)', padding: 12, borderRadius: 12 }}><Clock size={24} color="#f59e0b" /></div>
                            <div><div className="stat-value">{data.summary.pendingLeads}</div><div className="stat-label">Pendentes</div></div>
                        </div>
                    </div>
                )}
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ background: 'rgba(16,185,129,0.2)', padding: 12, borderRadius: 12 }}><CheckCircle size={24} color="#10b981" /></div>
                        <div><div className="stat-value">{isAdmin ? data.summary.totalConversions : data.summary.conversions}</div><div className="stat-label">Conversões Onboarding</div></div>
                    </div>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ background: 'rgba(168,85,247,0.2)', padding: 12, borderRadius: 12 }}><TrendingUp size={24} color="#a855f7" /></div>
                        <div><div className="stat-value">{data.summary.conversionRate}%</div><div className="stat-label">Taxa de Onboarding</div></div>
                    </div>
                </div>
            </div>

            {/* Métricas Secundárias */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div style={{
                    background: 'var(--bg-secondary)',
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                }}>
                    <CheckSquare size={20} color="#3b82f6" />
                    <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>{data.summary.totalChecking || 0}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Em Checking</div>
                    </div>
                </div>
                <div style={{
                    background: 'var(--bg-secondary)',
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                }}>
                    <DollarSign size={20} color="#22c55e" />
                    <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e' }}>{data.summary.totalSales || 0}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Vendas Concluídas</div>
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
                {/* Group Status Card */}
                <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <div style={{ background: 'rgba(16,185,129,0.2)', padding: 10, borderRadius: 10 }}>
                            <UserCheck size={20} color="#10b981" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Status do Grupo</h3>
                    </div>

                    {/* Circular Progress */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                        <div style={{ position: 'relative', width: 120, height: 120 }}>
                            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                                {/* Background circle */}
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="50"
                                    fill="none"
                                    stroke="var(--border)"
                                    strokeWidth="10"
                                />
                                {/* Progress circle */}
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="50"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="10"
                                    strokeDasharray={`${((data.summary.inGroup / (data.summary.totalLeads || 1)) * 314)} 314`}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dasharray 0.6s ease' }}
                                />
                            </svg>
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
                                    {data.summary.totalLeads > 0 ? Math.round((data.summary.inGroup / data.summary.totalLeads) * 100) : 0}%
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>No Grupo</div>
                            </div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No Grupo</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10b981' }}>
                                        {data.summary.inGroup || 0}
                                    </span>
                                </div>
                                <div style={{
                                    height: 6,
                                    background: 'var(--border)',
                                    borderRadius: 3,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${data.summary.totalLeads > 0 ? (data.summary.inGroup / data.summary.totalLeads) * 100 : 0}%`,
                                        background: 'linear-gradient(90deg, #10b981, #059669)',
                                        transition: 'width 0.6s ease'
                                    }} />
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Fora do Grupo</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f59e0b' }}>
                                        {data.summary.outGroup || 0}
                                    </span>
                                </div>
                                <div style={{
                                    height: 6,
                                    background: 'var(--border)',
                                    borderRadius: 3,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${data.summary.totalLeads > 0 ? (data.summary.outGroup / data.summary.totalLeads) * 100 : 0}%`,
                                        background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                                        transition: 'width 0.6s ease'
                                    }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Check-in Status Card */}
                <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <div style={{ background: 'rgba(99,102,241,0.2)', padding: 10, borderRadius: 10 }}>
                            <CheckSquare size={20} color="#6366f1" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Status do Check-in</h3>
                    </div>

                    {/* Circular Progress */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                        <div style={{ position: 'relative', width: 120, height: 120 }}>
                            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                                {/* Background circle */}
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="50"
                                    fill="none"
                                    stroke="var(--border)"
                                    strokeWidth="10"
                                />
                                {/* Progress circle */}
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="50"
                                    fill="none"
                                    stroke="#6366f1"
                                    strokeWidth="10"
                                    strokeDasharray={`${((data.summary.checkInCompleted / (data.summary.totalLeads || 1)) * 314)} 314`}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dasharray 0.6s ease' }}
                                />
                            </svg>
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6366f1' }}>
                                    {data.summary.totalLeads > 0 ? Math.round((data.summary.checkInCompleted / data.summary.totalLeads) * 100) : 0}%
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Completo</div>
                            </div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Check-in Completo</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6366f1' }}>
                                        {data.summary.checkInCompleted || 0}
                                    </span>
                                </div>
                                <div style={{
                                    height: 6,
                                    background: 'var(--border)',
                                    borderRadius: 3,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${data.summary.totalLeads > 0 ? (data.summary.checkInCompleted / data.summary.totalLeads) * 100 : 0}%`,
                                        background: 'linear-gradient(90deg, #6366f1, #4f46e5)',
                                        transition: 'width 0.6s ease'
                                    }} />
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Check-in Pendente</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
                                        {data.summary.checkInPending || 0}
                                    </span>
                                </div>
                                <div style={{
                                    height: 6,
                                    background: 'var(--border)',
                                    borderRadius: 3,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${data.summary.totalLeads > 0 ? (data.summary.checkInPending / data.summary.totalLeads) * 100 : 0}%`,
                                        background: 'linear-gradient(90deg, #64748b, #475569)',
                                        transition: 'width 0.6s ease'
                                    }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {data.sellerPerformance && data.sellerPerformance.length > 0 && (
                    <div className="card">
                        <h3 style={{ marginBottom: 20 }}>📊 Performance das Vendedoras</h3>
                        <table><thead><tr><th>Vendedora</th><th>Leads</th><th>Conversões</th><th>Taxa</th></tr></thead><tbody>
                            {data.sellerPerformance.map(s => (
                                <tr key={s.id}><td>{s.name}</td><td>{s.total_leads}</td><td>{s.conversions}</td><td>{s.total_leads > 0 ? ((s.conversions / s.total_leads) * 100).toFixed(1) : 0}%</td></tr>
                            ))}
                        </tbody></table>
                    </div>
                )}

                <div className="card">
                    <h3 style={{ marginBottom: 20 }}><MessageSquare size={18} style={{ marginRight: 8 }} />Leads Recentes</h3>
                    {data.recentLeads?.length > 0 ? (
                        <table><thead><tr><th>Nome</th><th>Produto</th><th>Status</th></tr></thead><tbody>
                            {data.recentLeads.map(l => (
                                <tr key={l.uuid}><td>{l.first_name}</td><td>{l.product_name}</td><td><span className="badge" style={{ background: l.status_color + '22', color: l.status_color }}>{l.status_name}</span></td></tr>
                            ))}
                        </tbody></table>
                    ) : <p style={{ color: 'var(--text-secondary)' }}>Nenhum lead ainda</p>}
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: 20 }}>📈 Por Status</h3>
                    {data.byStatus?.map(s => (
                        <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: s.color }} />{s.name}</span>
                            <strong>{s.count}</strong>
                        </div>
                    ))}
                </div>


            </div>

            {/* Seção de Agendamentos */}
            {schedules.length > 0 && (
                <div className="card" style={{ marginTop: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <Calendar size={20} color="#6366f1" />
                        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Próximos Agendamentos</h2>
                        <span style={{
                            background: '#6366f1',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: '0.75rem',
                            fontWeight: 600
                        }}>
                            {schedules.length}
                        </span>
                    </div>
                    <div style={{ maxHeight: 200, overflowY: 'auto', display: 'grid', gap: 10 }}>
                        {schedules.map(schedule => (
                            <div
                                key={schedule.uuid}
                                style={{
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 10,
                                    padding: '12px 16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                        {schedule.leads?.first_name || 'Lead'}
                                    </div>
                                    {schedule.observation && (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {schedule.observation}
                                        </div>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: new Date(schedule.scheduled_at) < new Date() ? '#ef4444' : '#6366f1'
                                    }}>
                                        {new Date(schedule.scheduled_at).toLocaleDateString('pt-BR')}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {new Date(schedule.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                {schedule.leads?.phone && (
                                    <button
                                        onClick={() => window.open(`https://wa.me/${schedule.leads.phone.replace(/\D/g, '')}`, '_blank')}
                                        style={{
                                            background: '#25D366',
                                            border: 'none',
                                            borderRadius: 8,
                                            padding: '8px 12px',
                                            color: '#000',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6
                                        }}
                                    >
                                        <Phone size={14} /> Ligar
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
