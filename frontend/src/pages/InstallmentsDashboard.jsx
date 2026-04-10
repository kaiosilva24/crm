import { useState, useEffect } from 'react';
import { api } from '../api';
import { CreditCard, Calendar, TrendingUp, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import '../index.css';

export default function Recorrencias() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [showHistorical, setShowHistorical] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.getInstallmentsAnalytics();
            setData(res);
            setError(null);
        } catch (err) {
            setError(err.message || 'Erro ao carregar dados de recorrências');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <RefreshCw className="spin" size={32} style={{ marginBottom: 16 }} />
                <h3>Carregando dados financeiros...</h3>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
                <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle /> Erro
                </h3>
                <p>{error}</p>
                <button className="btn btn-primary" onClick={fetchData} style={{ marginTop: '16px' }}>Tentar novamente</button>
            </div>
        );
    }

    if (!data) return null;

    const { live_summary, historical_summary, revenue_forecast, by_product, plans } = data;

    // Filtra os planos baseados no toggle de histórico
    const displayedPlans = showHistorical 
        ? plans 
        : plans.filter(p => !p.is_historical);

    const formatCurrency = (value) => 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr));
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2><RefreshCw size={24} style={{ marginRight: 8, verticalAlign: '-3px' }} /> Parcelamento Inteligente</h2>
                    <p style={{ color: 'var(--text-color-light)', marginTop: '4px' }}>Visão geral de receitas recorrentes ativas.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--background-color)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <input 
                            type="checkbox" 
                            checked={showHistorical} 
                            onChange={(e) => setShowHistorical(e.target.checked)} 
                            style={{ margin: 0 }}
                        />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-color-light)' }}>
                            Incluir migração do CSV (Histórico)
                        </span>
                    </label>
                    <button className="btn btn-ghost" onClick={fetchData} title="Atualizar">
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* CARDS DE RESUMO GERAL AO VIVO */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div className="card stat-card" style={{ padding: '20px' }}>
                    <div className="stat-header">
                        <span className="stat-title">Planos Ativos (Ao vivo)</span>
                        <Layers size={20} color="var(--primary-color)" />
                    </div>
                    <div className="stat-value">{live_summary.active_plans}</div>
                    <div className="stat-desc" style={{ color: 'var(--text-color-light)' }}>+ {live_summary.completed_plans} finalizados</div>
                </div>

                <div className="card stat-card" style={{ padding: '20px' }}>
                    <div className="stat-header">
                        <span className="stat-title">Previsão 30 Dias</span>
                        <Calendar size={20} color="#10b981" />
                    </div>
                    <div className="stat-value" style={{ color: '#10b981' }}>
                        {formatCurrency(revenue_forecast.next_30_days)}
                    </div>
                    <div className="stat-desc">Valor bruto estimado</div>
                </div>

                <div className="card stat-card" style={{ padding: '20px' }}>
                    <div className="stat-header">
                        <span className="stat-title">Contrato Bruto Restante</span>
                        <CreditCard size={20} color="#8b5cf6" />
                    </div>
                    <div className="stat-value">{formatCurrency(live_summary.gross_expected_total)}</div>
                    <div className="stat-desc">Só planos ao vivo</div>
                </div>

                <div className="card stat-card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
                    <div className="stat-header">
                        <span className="stat-title">Líquido Restante</span>
                        <TrendingUp size={20} color="#3b82f6" />
                    </div>
                    <div className="stat-value">{formatCurrency(live_summary.net_expected_total)}</div>
                    <div className="stat-desc">Após taxas / coprodução</div>
                </div>
            </div>

            {/* SEÇÃO HISTÓRICA CONDICIONAL */}
            {showHistorical && (
                <div className="card" style={{ borderLeft: '4px solid #f59e0b', padding: '16px 20px', background: '#fffbeb' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', margin: '0 0 12px' }}>
                        <AlertCircle size={20} /> Total Histórico & Ao Vivo
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: '#92400e' }}>Todos Planos Ativos</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{live_summary.active_plans + historical_summary.active_plans}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: '#92400e' }}>Bruto Futuro Completo</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{formatCurrency(revenue_forecast.total_remaining_gross)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: '#92400e' }}>Líquido Futuro Completo</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{formatCurrency(revenue_forecast.total_remaining_net)}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* RENDIMENTO POR PRODUTO */}
            <div className="card table-container">
                <h3 style={{ padding: '16px 20px', margin: 0, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Rendimento por Produto
                </h3>
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Ativos</th>
                                <th>Bruto Pendente</th>
                                <th>Líquido Pendente</th>
                            </tr>
                        </thead>
                        <tbody>
                            {by_product.map(prod => (
                                <tr key={prod.product}>
                                    <td style={{ fontWeight: 500 }}>{prod.product}</td>
                                    <td>{prod.active_plans}</td>
                                    <td>{formatCurrency(prod.gross_remaining)}</td>
                                    <td>{formatCurrency(prod.net_remaining)}</td>
                                </tr>
                            ))}
                            {by_product.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-color-light)' }}>
                                        Nenhum evento registrado ainda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* LISTA DE PLANOS DETALHADA */}
            <div className="card table-container">
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Listagem de Compradores</h3>
                    <span className="badge badge-primary">{displayedPlans.length} leads</span>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Produto</th>
                                <th>Progresso</th>
                                <th>Bruto Pendente</th>
                                <th>Líquido Pendente</th>
                                <th>Próxima Parcela</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedPlans.map(p => (
                                <tr key={p.id} style={{ opacity: p.status === 'completed' ? 0.6 : 1 }}>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {p.lead_name || 'Sem nome'}
                                                {p.is_historical && <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '2px 4px' }}>CSV</span>}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-color-light)' }}>
                                                {p.lead_email}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.9rem' }}>
                                        {p.product}
                                        {p.has_coproduction && <div style={{ fontSize: '0.75rem', color: '#8b5cf6', marginTop: '2px' }}>Co-produção</div>}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>{p.progress}</span>
                                            <div style={{ width: '40px', background: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ 
                                                    height: '100%', 
                                                    background: p.status === 'completed' ? '#10b981' : '#8b5cf6',
                                                    width: `${(p.installments_paid / p.total_installments) * 100}%` 
                                                }} />
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-color-light)', marginTop: '2px' }}>
                                            R$ {p.gross_monthly}/mês
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 500 }}>
                                        {p.status === 'completed' ? '—' : formatCurrency(p.gross_remaining)}
                                    </td>
                                    <td style={{ color: 'var(--text-color-light)' }}>
                                        {p.status === 'completed' ? '—' : formatCurrency(p.net_remaining)}
                                    </td>
                                    <td style={{ fontSize: '0.9rem' }}>
                                        {p.status === 'completed' ? 'Quitado' : formatDate(p.next_expected_at)}
                                    </td>
                                    <td>
                                        <span className={`badge badge-${p.status === 'active' ? 'primary' : 'success'}`}>
                                            {p.status === 'active' ? 'Ativo' : 'Concluído'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {displayedPlans.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-color-light)' }}>
                                        Nenhum registro encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
