import { useState, useEffect, useCallback } from 'react';

// Ícones por tipo de evento
const EVENT_ICONS = {
    entry: '🔵',
    re_entry: '🔄',
    seller_assigned: '👤',
    seller_changed: '👥',
    seller_historical: '⏳',
    status_change: '🏷️',
    campaign_change: '📣',
    sale: '🟢',
    note: '📝',
    default: '⚪'
};

// Cores por tipo de evento
const EVENT_COLORS = {
    entry: '#6366f1',
    re_entry: '#f59e0b',
    seller_assigned: '#3b82f6',
    seller_changed: '#2563eb',
    seller_historical: '#64748b',
    status_change: '#8b5cf6',
    campaign_change: '#ec4899',
    sale: '#10b981',
    note: '#64748b',
    default: '#94a3b8'
};

const EVENT_LABELS_PT = {
    entry: 'Entrada',
    re_entry: 'Re-entrada',
    seller_assigned: 'Atribuição',
    seller_changed: 'Transf. de Vendedora',
    seller_historical: 'Vendedora Histórica',
    status_change: 'Status',
    campaign_change: 'Campanha',
    sale: 'Venda',
    note: 'Nota',
};

function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' +
        d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function LeadJourney({ leadId, phone }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedEvent, setExpandedEvent] = useState(null);

    const loadJourney = useCallback(async () => {
        if (!leadId) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const baseUrl = import.meta.env.VITE_API_URL || '/api';
            const res = await fetch(`${baseUrl}/journey/lead/${leadId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEvents(data.events || []);
            }
        } catch (err) {
            console.error('Erro ao carregar jornada:', err);
        } finally {
            setLoading(false);
        }
    }, [leadId]);

    useEffect(() => {
        loadJourney();
    }, [loadJourney]);

    if (loading) {
        return (
            <div style={{
                padding: '8px 16px 10px 52px',
                background: 'rgba(99, 102, 241, 0.03)',
                borderTop: '1px dashed rgba(99, 102, 241, 0.15)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)'
            }}>
                Carregando jornada...
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div style={{
                padding: '8px 16px 10px 52px',
                background: 'rgba(99, 102, 241, 0.03)',
                borderTop: '1px dashed rgba(99, 102, 241, 0.12)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                fontStyle: 'italic'
            }}>
                Nenhum evento de jornada registrado ainda.
            </div>
        );
    }

    return (
        <div style={{
            padding: '6px 12px 10px 52px',
            background: 'rgba(99, 102, 241, 0.03)',
            borderTop: '1px dashed rgba(99, 102, 241, 0.15)',
            /* Previne que o scroll horizontal vaze para a linha do lead */
            contain: 'layout',
        }}>
            {/* Timeline horizontal em linha com scroll próprio */}
            <div
                className="lead-journey-scroll"
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 0,
                    overflowX: 'auto',
                    overflowY: 'visible',
                    paddingBottom: 6,
                    /* Permite que cards expandidos não sejam cortados */
                    paddingTop: 2,
                    /* Scrollbar personalizada via webkit */
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(99,102,241,0.35) transparent',
                    // Garante que a área de scroll não cruze com colunas da tabela
                    maxWidth: '100%',
                    width: 'max-content',
                    minWidth: '100%',
                }}>
                {(() => {
                    const nodes = [];
                    events.forEach(ev => {
                        // Se for entrada ou re-entrada, podemos quebrar em vários
                        if (ev.event_type === 'entry' || ev.event_type === 're_entry') {
                            nodes.push({
                                id: ev.id + '_base',
                                originalId: ev.id,
                                icon: EVENT_ICONS[ev.event_type] || EVENT_ICONS.default,
                                color: EVENT_COLORS[ev.event_type] || EVENT_COLORS.default,
                                label: EVENT_LABELS_PT[ev.event_type] || ev.event_type,
                                date: ev.created_at,
                                details: [{ label: 'Evento', value: ev.event_label }]
                            });
            
                            if (ev.utm_source) {
                                nodes.push({
                                    id: ev.id + '_source',
                                    icon: '🌐',
                                    color: '#6366f1',
                                    label: formatUtmValue('source', ev.utm_source),
                                    date: ev.created_at,
                                });
                            }
                            if (ev.utm_medium) {
                                nodes.push({
                                    id: ev.id + '_medium',
                                    icon: '📊',
                                    color: '#8b5cf6',
                                    label: formatUtmValue('medium', ev.utm_medium),
                                    date: ev.created_at,
                                });
                            }
                            if (ev.campaign_name) {
                                nodes.push({
                                    id: ev.id + '_crm_campaign',
                                    icon: '📣',
                                    color: '#ec4899',
                                    label: ev.campaign_name,
                                    date: ev.created_at,
                                    subLabel: 'Campanha CRM'
                                });
                            }
                            if (ev.utm_campaign) {
                                nodes.push({
                                    id: ev.id + '_campaign',
                                    icon: '🎯',
                                    color: '#dc2626', // Vermelho para diferenciar da CRM
                                    label: ev.utm_campaign,
                                    date: ev.created_at,
                                    subLabel: 'Campanha UTM'
                                });
                            }
                            if (ev.utm_term) {
                                nodes.push({
                                    id: ev.id + '_term',
                                    icon: '👥',
                                    color: '#f59e0b',
                                    label: ev.utm_term,
                                    date: ev.created_at,
                                    subLabel: 'Conjunto'
                                });
                            }
                            if (ev.utm_content) {
                                nodes.push({
                                    id: ev.id + '_content',
                                    icon: '🖼️',
                                    color: '#10b981',
                                    label: ev.utm_content,
                                    date: ev.created_at,
                                    subLabel: 'Anúncio'
                                });
                            }
                            if (ev.seller_name) {
                                nodes.push({
                                    id: ev.id + '_seller',
                                    icon: '👤',
                                    color: '#3b82f6',
                                    label: ev.seller_name,
                                    date: ev.created_at,
                                    subLabel: 'Vendedora'
                                });
                            }
                            if (ev.status_name) {
                                nodes.push({
                                    id: ev.id + '_status',
                                    icon: '🏷️',
                                    color: '#8b5cf6',
                                    label: ev.status_name,
                                    date: ev.created_at,
                                    subLabel: 'Status'
                                });
                            }
                        } else {
                            // Qualquer outro evento (vendedora, status, nota)
                            nodes.push({
                                id: ev.id,
                                originalId: ev.id,
                                icon: EVENT_ICONS[ev.event_type] || EVENT_ICONS.default,
                                color: EVENT_COLORS[ev.event_type] || EVENT_COLORS.default,
                                label: (ev.event_type === 'seller_assigned' || ev.event_type === 'seller_changed' || ev.event_type === 'seller_historical') && ev.seller_name 
                                        ? ev.seller_name 
                                        : ev.event_type === 'status_change' && ev.status_name 
                                            ? ev.status_name 
                                            : (EVENT_LABELS_PT[ev.event_type] || ev.event_type),
                                subLabel: EVENT_LABELS_PT[ev.event_type],
                                date: ev.created_at,
                                details: [
                                    ev.event_label && { label: 'Detalhes', value: ev.event_label }
                                ].filter(Boolean)
                            });
                        }
                    });

                    return nodes.map((node, idx) => {
                        const isExpanded = expandedEvent === node.id;
                        
                        return (
                            <div key={node.id} style={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div
                                        onClick={() => setExpandedEvent(isExpanded ? null : node.id)}
                                        style={{
                                            padding: '4px 8px',
                                            borderRadius: 6,
                                            background: isExpanded
                                                ? `rgba(${hexToRgb(node.color)}, 0.15)`
                                                : `rgba(${hexToRgb(node.color)}, 0.08)`,
                                            border: `1px solid rgba(${hexToRgb(node.color)}, ${isExpanded ? 0.5 : 0.25})`,
                                            cursor: node.details && node.details.length > 0 ? 'pointer' : 'default',
                                            transition: 'all 0.15s ease',
                                            minWidth: 80,
                                            maxWidth: 180,
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <span style={{ fontSize: '0.7rem' }}>{node.icon}</span>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                fontWeight: 600,
                                                color: node.color,
                                                whiteSpace: 'nowrap',
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden'
                                            }}>
                                                {node.label}
                                            </span>
                                        </div>
                                        {(node.subLabel || node.date) && (
                                            <div style={{ 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                marginTop: 2 
                                            }}>
                                                {node.subLabel && (
                                                    <span style={{
                                                        fontSize: '0.55rem',
                                                        color: node.color,
                                                        opacity: 0.8,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.02em',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {node.subLabel}
                                                    </span>
                                                )}
                                                {node.date && (
                                                    <span style={{
                                                        fontSize: '0.6rem',
                                                        color: 'var(--text-secondary)',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {formatDateShort(node.date)}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {isExpanded && node.details && node.details.length > 0 && (
                                            <div style={{
                                                marginTop: 6,
                                                borderTop: `1px solid rgba(${hexToRgb(node.color)}, 0.2)`,
                                                paddingTop: 6,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 3,
                                            }}>
                                                {node.details.map((det, i) => (
                                                    <InfoLine key={i} label={det.label} value={det.value} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Linha conectora */}
                                {idx < nodes.length - 1 && (
                                    <div style={{
                                        width: 20,
                                        height: 1,
                                        background: 'rgba(148, 163, 184, 0.35)',
                                        alignSelf: 'center',
                                        flexShrink: 0,
                                        marginTop: -8
                                    }} />
                                )}
                            </div>
                        );
                    });
                })()}
            </div>
        </div>
    );
}

function formatUtmValue(key, value) {
    if (!value) return '';
    const v = String(value).toLowerCase().trim();
    
    if (key === 'source') {
        if (v === 'ig' || v === 'instagram') return '📷 Instagram';
        if (v === 'fb' || v === 'facebook') return '📘 Facebook';
        if (v === 'google') return '🔍 Google';
        if (v === 'yt' || v === 'youtube') return '▶️ YouTube';
        if (v === 'tiktok') return '🎵 TikTok';
    }
    
    if (key === 'medium') {
        if (v === 'pago' || v === 'paid' || v === 'cpc' || v === 'ads') return '💰 Patrocinado (Pago)';
        if (v === 'organico' || v === 'organic') return '🌱 Orgânico (Gratuito)';
        if (v === 'referral') return '🔗 Indicação/Link Externo';
    }
    
    return value;
}

function InfoLine({ label, value }) {
    return (
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 1 }}>
                {label}:
            </span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-primary)', wordBreak: 'break-word', fontWeight: 500 }}>
                {value}
            </span>
        </div>
    );
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '148, 163, 184';
}
