import { useState, useEffect, useCallback } from 'react';

// Ícones por tipo de evento
const EVENT_ICONS = {
    entry: '🔵',
    re_entry: '🔄',
    seller_assigned: '👤',
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
        }}>
            {/* Timeline horizontal em linha */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0,
                overflowX: 'auto',
                paddingBottom: 4,
                scrollbarWidth: 'thin',
            }}>
                {events.map((event, idx) => {
                    const color = EVENT_COLORS[event.event_type] || EVENT_COLORS.default;
                    const icon = EVENT_ICONS[event.event_type] || EVENT_ICONS.default;
                    const label = EVENT_LABELS_PT[event.event_type] || event.event_type;
                    const isExpanded = expandedEvent === event.id;
                    const hasUtm = event.utm_campaign || event.utm_content || event.utm_source;

                    return (
                        <div key={event.id} style={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0 }}>
                            {/* Dot + Card */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {/* Card de evento */}
                                <div
                                    onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                                    title={event.event_label || label}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        gap: 2,
                                        padding: '4px 8px',
                                        borderRadius: 6,
                                        background: isExpanded
                                            ? `rgba(${hexToRgb(color)}, 0.15)`
                                            : `rgba(${hexToRgb(color)}, 0.08)`,
                                        border: `1px solid rgba(${hexToRgb(color)}, ${isExpanded ? 0.5 : 0.25})`,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        minWidth: 80,
                                        maxWidth: 160,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ fontSize: '0.7rem' }}>{icon}</span>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            color,
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {label}
                                        </span>
                                    </div>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--text-secondary)',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {formatDateShort(event.created_at)}
                                    </span>

                                    {/* Detalhes expandidos */}
                                    {isExpanded && (
                                        <div style={{
                                            marginTop: 6,
                                            borderTop: `1px solid rgba(${hexToRgb(color)}, 0.2)`,
                                            paddingTop: 6,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 3,
                                        }}>
                                            {event.event_label && (
                                                <InfoLine label="Evento" value={event.event_label} />
                                            )}
                                            {event.campaign_name && (
                                                <InfoLine label="Campanha" value={event.campaign_name} />
                                            )}
                                            {event.seller_name && (
                                                <InfoLine label="Vendedora" value={event.seller_name} />
                                            )}
                                            {event.status_name && (
                                                <InfoLine label="Status" value={event.status_name} />
                                            )}
                                            {hasUtm && (
                                                <div style={{ marginTop: 4 }}>
                                                    <span style={{
                                                        fontSize: '0.6rem',
                                                        fontWeight: 700,
                                                        color,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em'
                                                    }}>
                                                        UTMs
                                                    </span>
                                                    {event.utm_source && <InfoLine label="Fonte" value={formatUtmValue('source', event.utm_source)} />}
                                                    {event.utm_medium && <InfoLine label="Meio" value={formatUtmValue('medium', event.utm_medium)} />}
                                                    {event.utm_campaign && <InfoLine label="Campanha" value={event.utm_campaign} />}
                                                    {event.utm_content && <InfoLine label="Anúncio" value={event.utm_content} />}
                                                    {event.utm_term && <InfoLine label="Conjunto" value={event.utm_term} />}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Linha conectora */}
                            {idx < events.length - 1 && (
                                <div style={{
                                    width: 14,
                                    height: 1,
                                    background: 'rgba(148, 163, 184, 0.35)',
                                    alignSelf: 'center',
                                    flexShrink: 0,
                                    marginTop: -8
                                }} />
                            )}
                        </div>
                    );
                })}
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
