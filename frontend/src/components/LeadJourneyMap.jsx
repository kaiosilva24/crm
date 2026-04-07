import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EVENT_ICONS, EVENT_COLORS, EVENT_LABELS_PT, formatDateShort, formatUtmValue } from './LeadJourney';
import { X, ZoomIn, ZoomOut, Move, MousePointerClick } from 'lucide-react';

const NODE_WIDTH = 260;
const NODE_HEIGHT = 100;
const GAP_X = 120;
const GAP_Y = 100;
const NODES_PER_ROW = 4;

export default function LeadJourneyMap({ leadId, phone, onClose }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const containerRef = useRef(null);

    const loadJourney = useCallback(async () => {
        if (!leadId) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const baseUrl = import.meta.env.VITE_API_URL || '/api';
            const res = await fetch(`${baseUrl}/journey/lead/${leadId}${phone ? `?phone=${encodeURIComponent(phone)}` : ''}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.events) {
                    // Remove the start/end fake nodes and sort by created_at asc
                    const dbEvents = data.events.filter(e => !e.is_fake).sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
                    setEvents(dbEvents);
                }
            } else {
                setEvents([]);
            }
        } catch (error) {
            console.error('Erro ao carregar jornada no map:', error);
        } finally {
            setLoading(false);
        }
    }, [leadId, phone]);

    useEffect(() => {
        loadJourney();
    }, [loadJourney]);

    // Calcular as posições dos nós na grade (Zigue-Zague)
    const getLayout = () => {
        const visualEvents = [];
        events.forEach(ev => {
            if (ev.event_type === 'entry' || ev.event_type === 're_entry') {
                visualEvents.push({
                    id: ev.id + '_base',
                    data: ev,
                    event_type: ev.event_type,
                    icon: EVENT_ICONS[ev.event_type] || EVENT_ICONS.default,
                    color: EVENT_COLORS[ev.event_type] || EVENT_COLORS.default,
                    label: EVENT_LABELS_PT[ev.event_type] || ev.event_type,
                    date: ev.created_at,
                    subLabel: ev.event_type.toUpperCase()
                });

                if (ev.utm_source) {
                    visualEvents.push({
                        id: ev.id + '_source', data: ev, icon: '🌐', color: '#6366f1',
                        label: formatUtmValue('source', ev.utm_source), date: ev.created_at, subLabel: 'SOURCE'
                    });
                }
                if (ev.utm_medium) {
                    visualEvents.push({
                        id: ev.id + '_medium', data: ev, icon: '📊', color: '#8b5cf6',
                        label: formatUtmValue('medium', ev.utm_medium), date: ev.created_at, subLabel: 'MEDIUM'
                    });
                }
                if (ev.campaign_name) {
                    visualEvents.push({
                        id: ev.id + '_crm_campaign', data: ev, icon: '📣', color: '#ec4899',
                        label: ev.campaign_name, date: ev.created_at, subLabel: 'Campanha CRM'
                    });
                }
                if (ev.utm_campaign) {
                    visualEvents.push({
                        id: ev.id + '_campaign', data: ev, icon: '🎯', color: '#dc2626',
                        label: ev.utm_campaign, date: ev.created_at, subLabel: 'Campanha UTM'
                    });
                }
                if (ev.utm_term) {
                    visualEvents.push({
                        id: ev.id + '_term', data: ev, icon: '👥', color: '#f59e0b',
                        label: ev.utm_term, date: ev.created_at, subLabel: 'Conjunto'
                    });
                }
                if (ev.utm_content) {
                    visualEvents.push({
                        id: ev.id + '_content', data: ev, icon: '🖼️', color: '#10b981',
                        label: ev.utm_content, date: ev.created_at, subLabel: 'Anúncio'
                    });
                }
                if (ev.seller_name) {
                    visualEvents.push({
                        id: ev.id + '_seller', data: ev, icon: '👤', color: '#3b82f6',
                        label: ev.seller_name, date: ev.created_at, subLabel: 'Vendedora'
                    });
                }
                if (ev.status_name) {
                    visualEvents.push({
                        id: ev.id + '_status', data: ev, icon: '🏷️', color: '#8b5cf6',
                        label: ev.status_name, date: ev.created_at, subLabel: 'Status'
                    });
                }
            } else {
                const label = (ev.event_type === 'seller_assigned' || ev.event_type === 'seller_changed' || ev.event_type === 'seller_historical') && ev.seller_name 
                    ? ev.seller_name 
                    : ev.event_type === 'seller_removed'
                        ? 'Sem Vendedora'
                        : ev.event_type === 'lead_deleted'
                            ? 'Deletado'
                            : ev.event_type === 'status_change' && ev.status_name 
                                ? ev.status_name 
                                : (EVENT_LABELS_PT[ev.event_type] || ev.event_type);

                visualEvents.push({
                    id: ev.id,
                    data: ev,
                    event_type: ev.event_type,
                    icon: EVENT_ICONS[ev.event_type] || EVENT_ICONS.default,
                    color: EVENT_COLORS[ev.event_type] || EVENT_COLORS.default,
                    label: label,
                    date: ev.created_at,
                    subLabel: EVENT_LABELS_PT[ev.event_type]
                });
            }
        });

        const nodes = [];
        const edges = [];
        
        visualEvents.forEach((vEv, index) => {
            const rowIndex = Math.floor(index / NODES_PER_ROW);
            const isLeftToRight = rowIndex % 2 === 0;
            const indexInRow = index % NODES_PER_ROW;
            
            const colIndex = isLeftToRight ? indexInRow : (NODES_PER_ROW - 1 - indexInRow);

            const x = colIndex * (NODE_WIDTH + GAP_X);
            const y = rowIndex * (NODE_HEIGHT + GAP_Y);

            nodes.push({ ...vEv, index, x, y });

            if (index > 0) {
                const prevNode = nodes[index - 1];
                edges.push({
                    id: `e-${index-1}-${index}`,
                    source: prevNode,
                    target: { ...vEv, index, x, y }
                });
            }
        });

        // Calcular Bouding Box do grafo para centralizá-mo no inicio
        let minX = 0, maxX = 0, minY = 0, maxY = 0;
        nodes.forEach(n => {
            if(n.x < minX) minX = n.x;
            if(n.x + NODE_WIDTH > maxX) maxX = n.x + NODE_WIDTH;
            if(n.y < minY) minY = n.y;
            if(n.y + NODE_HEIGHT > maxY) maxY = n.y + NODE_HEIGHT;
        });

        return { nodes, edges, bounds: { width: maxX - minX, height: maxY - minY } };
    };

    const { nodes, edges, bounds } = getLayout();

    // Centralizar ao carregar dados
    useEffect(() => {
        if (!loading && nodes.length > 0 && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // Inicia com x, y que alinhem o meio do bounding box ao meio da tela
            // Reduz pra 0.9 pra dar respiro.
            setScale(0.9);
            // Começa do painel de cima
            setPan({
                x: (rect.width - bounds.width * 0.9) / 2,
                y: 50 // top offset
            });
        }
    }, [loading, bounds.width]);

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale(s => Math.min(Math.max(0.3, s + delta), 2.5));
    };

    const handleMouseDown = (e) => {
        if (e.target.closest('.node-card')) return; // ignora cliques nos nós
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const renderEdgeParams = (s, t) => {
        // Source Center e Target Center relativos
        const sx = s.x;
        const sy = s.y;
        const tx = t.x;
        const ty = t.y;

        const isSameRow = sy === ty;
        const sDirRight = tx > sx; // node t ta na direira
        
        let path = '';
        
        if (isSameRow) {
            // Linha Reta Horizontal
            const startX = sDirRight ? sx + NODE_WIDTH : sx;
            const startY = sy + NODE_HEIGHT / 2;
            const endX = sDirRight ? tx : tx + NODE_WIDTH;
            const endY = ty + NODE_HEIGHT / 2;
            path = `M ${startX} ${startY} L ${endX} ${endY}`;
        } else {
            // Desce linha curva "U" 
            // Eles estão em linhas diferentes (U turn).
            // sx e tx devem ser iguais em X pois o zigzag desce na mesma coluna no canto.
            const startX = sx + NODE_WIDTH / 2;
            const startY = sy + NODE_HEIGHT;
            const endX = tx + NODE_WIDTH / 2;
            const endY = ty;
            // Curva Bézier saindo de baixo e chegando por cima
            path = `M ${startX} ${startY} C ${startX} ${startY + GAP_Y/2}, ${endX} ${endY - GAP_Y/2}, ${endX} ${endY}`;
        }

        return path;
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: '#0f172a', zIndex: 99999,
            display: 'flex', flexDirection: 'column'
        }}>
            {/* Nav do Map */}
            <div style={{
                background: '#1e293b', borderBottom: '1px solid #334155', height: 60,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#3b82f6', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Move size={18} color="white" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'white' }}>Mapa da Jornada do Lead</h2>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Visualização Fullscreen do Histórico</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', borderRadius: 8, overflow: 'hidden', border: '1px solid #334155' }}>
                        <button onClick={() => setScale(s => Math.max(0.3, s - 0.1))} style={{ padding: '8px 12px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRight: '1px solid #334155' }}><ZoomOut size={16} /></button>
                        <span style={{ padding: '0 12px', fontSize: '0.8rem', color: '#f8fafc' }}>{Math.round(scale * 100)}%</span>
                        <button onClick={() => setScale(s => Math.min(2.5, s + 0.1))} style={{ padding: '8px 12px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', borderLeft: '1px solid #334155' }}><ZoomIn size={16} /></button>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: '#ef4444', border: 'none', borderRadius: '50%',
                            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'white', boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Viewport de Pan & Zoom */}
            <div 
                ref={containerRef}
                style={{
                    flex: 1, position: 'relative', overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {loading ? (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8' }}>
                        <div className="spinner" style={{ width: 40, height: 40, border: '3px solid #334155', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16 }}></div>
                        Buscando Mapa...
                    </div>
                ) : nodes.length === 0 ? (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#94a3b8' }}>
                        Nenhum evento registrado nesta jornada.
                    </div>
                ) : (
                    <div style={{
                        position: 'absolute',
                        top: pan.y,
                        left: pan.x,
                        transform: `scale(${scale})`,
                        transformOrigin: '0 0',
                        width: bounds.width,
                        height: bounds.height
                    }}>
                        {/* Linhas SVG */}
                        <svg style={{ position: 'absolute', top: 0, left: 0, width: bounds.width + NODE_WIDTH, height: bounds.height + NODE_HEIGHT, pointerEvents: 'none' }}>
                            {edges.map(edge => {
                                const path = renderEdgeParams(edge.source, edge.target);
                                // Gradiente suave entre source color e target color (opcional) ou linha solida
                                return (
                                    <path 
                                        key={edge.id}
                                        d={path}
                                        fill="none"
                                        stroke="#475569"
                                        strokeWidth="3"
                                        style={{ strokeDasharray: '6,6', opacity: 0.8 }}
                                    />
                                );
                            })}
                        </svg>

                        {/* Nodes HTML */}
                        {nodes.map((node) => {
                            const evIcon = node.icon;
                            const evColor = node.color;
                            
                            return (
                                <div 
                                    key={node.id}
                                    className="node-card"
                                    style={{
                                        position: 'absolute',
                                        top: node.y,
                                        left: node.x,
                                        width: NODE_WIDTH,
                                        height: NODE_HEIGHT,
                                        background: '#1e293b',
                                        border: `1px solid ${evColor}40`,
                                        borderRadius: 12,
                                        padding: 16,
                                        boxShadow: `0 4px 20px ${evColor}15, 0 1px 3px rgba(0,0,0,0.2)`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        cursor: 'default',
                                        transition: 'transform 0.1s, box-shadow 0.2s',
                                        borderTop: `4px solid ${evColor}`
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 25px ${evColor}25, 0 2px 5px rgba(0,0,0,0.3)` }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 4px 20px ${evColor}15, 0 1px 3px rgba(0,0,0,0.2)` }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                        <div style={{ 
                                            background: `${evColor}20`, width: 32, height: 32, borderRadius: '50%', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1rem'
                                        }}>
                                            {evIcon}
                                        </div>
                                        <div style={{ overflow: 'hidden' }}>
                                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {node.label}
                                            </h4>
                                            {node.subLabel && (
                                                <span style={{ fontSize: '0.75rem', color: evColor, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                    {node.subLabel}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: 8, marginTop: 'auto' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                            {formatDateShort(node.date)}
                                        </span>
                                        {node.data?.campaign_name && node.id.includes('_base') && (
                                            <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: '#334155', borderRadius: 4, color: '#cbd5e1', maxWidth: 100, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {node.data.campaign_name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Dica overlay */}
            <div style={{ position: 'absolute', bottom: 20, left: 20, background: 'rgba(30, 41, 59, 0.8)', padding: '8px 16px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#cbd5e1', backdropFilter: 'blur(4px)', border: '1px solid #334155', pointerEvents: 'none' }}>
                <MousePointerClick size={14} /> Clique e arraste para mover • Scroll para Zoom
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
