import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
    AreaChart, Area
} from 'recharts';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n, currency = 'BRL') =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(n || 0);
const fmtInt = (n) => new Intl.NumberFormat('pt-BR').format(n || 0);

const SOURCE_ICONS = {
    instagram: '📸', facebook: '👥', google: '🔍', youtube: '▶️',
    tiktok: '🎵', email: '📧', whatsapp: '💬', organic: '🌿',
    'direto / sem utm': '🔗', default: '🌐'
};
const getSourceIcon = (s) => SOURCE_ICONS[(s || '').toLowerCase()] || SOURCE_ICONS.default;

const formatSourceLabel = (raw) => {
    if (!raw || String(raw).toLowerCase() === 'null') return 'Direto / Sem UTM';
    const lower = String(raw).toLowerCase();
    if (lower === 'direto / sem utm') return 'Direto / Sem UTM';
    if (lower === 'ig' || lower === 'instagram') return 'Instagram';
    if (lower === 'fb' || lower === 'facebook' || lower === 'fb_ads' || lower === 'meta_ads') return 'Facebook/Meta';
    if (lower === 'yt' || lower === 'youtube') return 'YouTube';
    if (lower === 'tt' || lower === 'tiktok') return 'TikTok';
    if (lower === 'organico') return 'Orgânico';
    if (lower === 'an') return 'GreatPages';
    return String(raw).charAt(0).toUpperCase() + String(raw).slice(1);
};

const PLATFORM_COLORS = {
    hotmart: '#f97316', looma: '#6366f1', kiwify: '#10b981',
    eduzz: '#3b82f6', monetizze: '#ec4899', default: '#94a3b8'
};
const getPlatformColor = (p) => PLATFORM_COLORS[(p || '').toLowerCase()] || PLATFORM_COLORS.default;

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'];

const PERIODS = [
    { label: '7 dias', value: '7d' },
    { label: '30 dias', value: '30d' },
    { label: '90 dias', value: '90d' },
    { label: 'Tudo', value: 'all' },
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'rgba(10,15,35,0.97)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem', color: '#f8fafc',
            backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#a5b4fc' }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ color: p.color, marginBottom: 2 }}>
                    <span style={{ marginRight: 6 }}>●</span>
                    {p.name}: <strong>{typeof p.value === 'number' && p.name?.toLowerCase().includes('receita')
                        ? fmt(p.value) : fmtInt(p.value)}</strong>
                </div>
            ))}
        </div>
    );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color = '#6366f1', delay = 0 }) {
    return (
        <div style={{
            background: 'rgba(15,22,50,0.85)', border: `1px solid ${color}33`,
            borderRadius: 16, padding: '20px 22px', position: 'relative', overflow: 'hidden',
            backdropFilter: 'blur(12px)', boxShadow: `0 0 30px ${color}18`,
            animation: `fadeSlideIn 0.5s ease ${delay}ms both`, flex: '1 1 160px', minWidth: 150
        }}>
            {/* glow top-left */}
            <div style={{
                position: 'absolute', top: -20, left: -20, width: 80, height: 80,
                borderRadius: '50%', background: `${color}22`, filter: 'blur(20px)', pointerEvents: 'none'
            }} />
            <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.1 }}>{value}</div>
            {sub && <div style={{ fontSize: '0.72rem', color: color, marginTop: 5, fontWeight: 600 }}>{sub}</div>}
        </div>
    );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionTitle({ children }) {
    return (
        <h3 style={{
            fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2,
            color: '#6366f1', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8
        }}>
            <span style={{ width: 3, height: 14, background: '#6366f1', borderRadius: 2, display: 'inline-block' }} />
            {children}
        </h3>
    );
}

// ─── Chart Card ───────────────────────────────────────────────────────────────
function ChartCard({ title, children, delay = 0 }) {
    return (
        <div style={{
            background: 'rgba(15,22,50,0.85)', border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: 16, padding: '20px 22px', backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)', animation: `fadeSlideIn 0.5s ease ${delay}ms both`
        }}>
            <SectionTitle>{title}</SectionTitle>
            {children}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UtmDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30d');
    const [error, setError] = useState(null);
    const [activeSource, setActiveSource] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = { period };
            if (activeSource) params.utm_source = activeSource;
            const result = await api.getUtmAnalytics(params);
            setData(result);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [period, activeSource]);

    useEffect(() => { load(); }, [load]);

    const kpis = data?.kpis || {};
    const bySource = (data?.by_source || []).map(r => ({
        ...r,
        raw_source: r.source,
        source: formatSourceLabel(r.source)
    }));
    const byMedium = data?.by_medium || [];
    const byPlatform = data?.by_platform || [];
    const byCampaign = data?.by_campaign || [];
    const timeline = (data?.timeline || []).map(r => ({
        ...r,
        date: new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        revenue: parseFloat(r.revenue) || 0,
        pago: parseInt(r.pago) || 0,
        organico: parseInt(r.organico) || 0,
        total: parseInt(r.total) || 0
    }));
    const topContent = data?.top_content || [];

    const convRate = kpis.total_leads > 0
        ? ((kpis.vendas_rastreadas / kpis.total_leads) * 100).toFixed(1)
        : '0.0';

    // ── Donut label render ──
    const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
        if (percent < 0.05) return null;
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
                {(percent * 100).toFixed(0)}%
            </text>
        );
    };

    // ── Campaign chart format ──
    const campaignData = byCampaign.map(r => ({
        ...r,
        campaign: r.campaign?.length > 22 ? r.campaign.slice(0, 22) + '…' : r.campaign,
        gross_revenue: parseFloat(r.gross_revenue) || 0,
    }));

    return (
        <div style={{
            minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 10%, #0f1a3d 0%, #050b18 60%)',
            color: '#f8fafc', fontFamily: "'Inter', sans-serif", padding: '28px 24px'
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(18px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .period-btn { cursor: pointer; padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(99,102,241,0.3);
                    background: transparent; color: #94a3b8; font-size: 0.78rem; font-weight: 600; transition: all 0.2s; }
                .period-btn:hover { border-color: #6366f1; color: #a5b4fc; }
                .period-btn.active { background: #6366f1; color: #fff; border-color: #6366f1; }
                .source-row:hover { background: rgba(99,102,241,0.08) !important; }
                .content-row:hover { background: rgba(16,185,129,0.08) !important; }
            `}</style>

            {/* Header */}
            <div style={{ marginBottom: 28, animation: 'fadeSlideIn 0.4s ease both' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, background: 'linear-gradient(135deg, #a5b4fc, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            📊 UTM Analytics
                        </h1>
                        <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '0.85rem' }}>
                            Performance do funil de aquisição — Orgânico · Pago · Plataformas
                        </p>
                    </div>

                    {/* Period Filter */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        {PERIODS.map(p => (
                            <button key={p.value} className={`period-btn ${period === p.value ? 'active' : ''}`}
                                onClick={() => { setPeriod(p.value); setActiveSource(null); }}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {activeSource && (
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Filtrando por:</span>
                        <span style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 20, padding: '3px 12px', fontSize: '0.8rem', color: '#a5b4fc', fontWeight: 600 }}>
                            {getSourceIcon(activeSource)} {formatSourceLabel(activeSource)}
                        </span>
                        <button onClick={() => setActiveSource(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>✕ limpar</button>
                    </div>
                )}
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300, flexDirection: 'column', gap: 14 }}>
                    <div style={{ width: 40, height: 40, border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Carregando analytics...</span>
                </div>
            )}

            {/* Error */}
            {error && !loading && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 20, color: '#fca5a5', marginBottom: 24 }}>
                    ⚠️ Erro ao carregar dados: {error}
                </div>
            )}

            {!loading && data && (
                <>
                    {/* ─── KPI Cards ─── */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
                        <KpiCard icon="👥" label="Leads Totais" value={fmtInt(kpis.total_leads)} color="#6366f1" delay={0} />
                        <KpiCard icon="💰" label="Receita Bruta" value={fmt(kpis.total_gross)} color="#10b981" delay={60} />
                        <KpiCard icon="💎" label="Receita Líquida" value={fmt(kpis.total_net)} color="#34d399"
                            sub={kpis.total_gross > 0 ? `${((kpis.total_net / kpis.total_gross) * 100).toFixed(1)}% do bruto` : null} delay={120} />
                        <KpiCard icon="🛒" label="Vendas Rastreadas" value={fmtInt(kpis.vendas_rastreadas)} color="#f59e0b"
                            sub={`Taxa: ${convRate}%`} delay={180} />
                        <KpiCard icon="📢" label="Leads Pagos" value={fmtInt(kpis.leads_pagos)}
                            sub={kpis.total_leads > 0 ? `${((kpis.leads_pagos / kpis.total_leads) * 100).toFixed(0)}% do total` : null}
                            color="#f97316" delay={240} />
                        <KpiCard icon="🌿" label="Leads Orgânicos" value={fmtInt(kpis.leads_organicos)}
                            sub={kpis.total_leads > 0 ? `${((kpis.leads_organicos / kpis.total_leads) * 100).toFixed(0)}% do total` : null}
                            color="#06b6d4" delay={300} />
                    </div>

                    {/* ─── Timeline + Donut Row ─── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 16 }}>

                        {/* Timeline */}
                        <ChartCard title="Evolução de Leads — Pago vs Orgânico" delay={400}>
                            {timeline.length === 0
                                ? <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.85rem' }}>Sem dados para o período</div>
                                : <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={timeline} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                                        <defs>
                                            <linearGradient id="colorPago" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorOrg" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                                        <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} />
                                        <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ paddingTop: 10, fontSize: '0.8rem' }} />
                                        <Area type="monotone" dataKey="pago" name="Pago" stroke="#f59e0b" fill="url(#colorPago)" strokeWidth={2} dot={false} />
                                        <Area type="monotone" dataKey="organico" name="Orgânico" stroke="#06b6d4" fill="url(#colorOrg)" strokeWidth={2} dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            }
                        </ChartCard>

                        {/* Donut Plataformas */}
                        <ChartCard title="Plataformas de Venda" delay={450}>
                            {byPlatform.length === 0
                                ? <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.85rem' }}>Nenhuma venda rastreada</div>
                                : <>
                                    <ResponsiveContainer width="100%" height={160}>
                                        <PieChart>
                                            <Pie data={byPlatform} dataKey="vendas" nameKey="platform"
                                                cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                                                labelLine={false} label={renderDonutLabel}>
                                                {byPlatform.map((p, i) => (
                                                    <Cell key={i} fill={getPlatformColor(p.platform)} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v, n, props) => [
                                                `${fmtInt(v)} vendas — ${fmt(props.payload.gross)}`,
                                                (props.payload.platform || '').toUpperCase()
                                            ]} contentStyle={{ background: '#0a0f23', border: '1px solid #6366f133', borderRadius: 10, fontSize: '0.78rem' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {byPlatform.map((p, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                                                <div style={{ width: 10, height: 10, borderRadius: 3, background: getPlatformColor(p.platform), flexShrink: 0 }} />
                                                <span style={{ color: '#94a3b8', textTransform: 'capitalize', flex: 1 }}>{p.platform}</span>
                                                <span style={{ fontWeight: 700, color: '#f8fafc' }}>{fmtInt(p.vendas)}</span>
                                                <span style={{ color: '#10b981', fontSize: '0.72rem' }}>{fmt(p.gross)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            }
                        </ChartCard>
                    </div>

                    {/* ─── Sources + Campaigns Row ─── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

                        {/* Bar Chart por Source */}
                        <ChartCard title="Leads por Canal (Source)" delay={500}>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={bySource} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" horizontal={false} />
                                    <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} />
                                    <YAxis dataKey="source" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={60} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="leads" name="Leads" radius={[0, 6, 6, 0]}>
                                        {bySource.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Bar Chart por Campaign */}
                        <ChartCard title="Top Campanhas (UTM Campaign)" delay={560}>
                            {campaignData.length === 0
                                ? <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.85rem' }}>Sem dados de campanha</div>
                                : <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={campaignData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 90 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" horizontal={false} />
                                        <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} />
                                        <YAxis dataKey="campaign" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={90} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="leads" name="Leads" radius={[0, 6, 6, 0]}>
                                            {campaignData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            }
                        </ChartCard>
                    </div>

                    {/* ─── Revenue Timeline ─── */}
                    {timeline.some(t => t.revenue > 0) && (
                        <ChartCard title="Receita Bruta por Dia" delay={600}>
                            <ResponsiveContainer width="100%" height={180}>
                                <AreaChart data={timeline} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.1)" />
                                    <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} />
                                    <YAxis tick={{ fill: '#475569', fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="revenue" name="Receita" stroke="#10b981" fill="url(#colorRev)" strokeWidth={2.5} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    )}

                    {/* ─── Tabelas Detalhadas ─── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>

                        {/* Tabela Sources */}
                        <ChartCard title="Detalhamento por Canal" delay={650}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
                                            {['Canal', 'Leads', 'Receita Bruta', 'Líquido'].map(h => (
                                                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bySource.map((s, i) => (
                                            <tr key={i} className="source-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                                                onClick={() => setActiveSource(activeSource === s.raw_source ? null : s.raw_source)}>
                                                <td style={{ padding: '10px 10px', fontWeight: 600, color: activeSource === s.raw_source ? '#a5b4fc' : '#e2e8f0' }}>
                                                    <span style={{ marginRight: 6 }}>{getSourceIcon(s.raw_source)}</span>{s.source}
                                                </td>
                                                <td style={{ padding: '10px 10px', color: '#94a3b8' }}>{fmtInt(s.leads)}</td>
                                                <td style={{ padding: '10px 10px', color: '#10b981', fontWeight: 700 }}>{fmt(s.gross_revenue)}</td>
                                                <td style={{ padding: '10px 10px', color: '#34d399' }}>{fmt(s.net_revenue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ChartCard>

                        {/* Tabela Top Content/Anúncios */}
                        <ChartCard title="Top Criativos / Anúncios (UTM Content)" delay={700}>
                            {topContent.length === 0
                                ? <div style={{ padding: 30, textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>Sem dados de utm_content rastreados</div>
                                : <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
                                                {['Criativo', 'Source', 'Leads', 'Receita'].map(h => (
                                                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topContent.map((c, i) => (
                                                <tr key={i} className="content-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}>
                                                    <td style={{ padding: '10px 10px', color: '#e2e8f0', fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        🖼️ {c.content}
                                                    </td>
                                                    <td style={{ padding: '10px 10px', color: '#94a3b8' }}>{getSourceIcon(c.source)} {formatSourceLabel(c.source)}</td>
                                                    <td style={{ padding: '10px 10px', color: '#94a3b8' }}>{fmtInt(c.leads)}</td>
                                                    <td style={{ padding: '10px 10px', color: '#10b981', fontWeight: 700 }}>{fmt(c.gross_revenue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            }
                        </ChartCard>
                    </div>

                    {/* ─── Medium breakdown ─── */}
                    <div style={{ marginTop: 16 }}>
                        <ChartCard title="Distribuição por Medium (Tipo de Tráfego)" delay={750}>
                            <ResponsiveContainer width="100%" height={140}>
                                <BarChart data={byMedium} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                                    <XAxis dataKey="medium" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="leads" name="Leads" radius={[6, 6, 0, 0]}>
                                        {byMedium.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: 28, textAlign: 'center', color: '#1e293b', fontSize: '0.72rem' }}>
                        Dados extraídos da tabela <code>lead_journey_events</code> · Período: {PERIODS.find(p => p.value === period)?.label}
                    </div>
                </>
            )}
        </div>
    );
}
