import { useState, useEffect } from 'react';
import { api } from '../api';
import { FolderPlus, X, Edit2, Archive, RotateCcw, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';

export default function Campaigns() {
    const [campaigns, setCampaigns] = useState([]);
    const [subcampaigns, setSubcampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editCampaign, setEditCampaign] = useState(null);
    const [showArchived, setShowArchived] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', mirror_campaign_ids: [] });

    // Subcampanha
    const [showSubModal, setShowSubModal] = useState(false);
    const [editSubcampaign, setEditSubcampaign] = useState(null);
    const [subForm, setSubForm] = useState({ campaign_id: '', name: '', color: '#6366f1', description: '' });
    const [expandedCampaigns, setExpandedCampaigns] = useState(new Set());
    const [showMirrorPopup, setShowMirrorPopup] = useState(false);

    const loadCampaigns = () => {
        api.getCampaigns({ active_only: !showArchived }).then(d => setCampaigns(d.campaigns)).finally(() => setLoading(false));
    };

    const loadSubcampaigns = () => {
        api.getSubcampaigns({}).then(d => setSubcampaigns(d.subcampaigns || [])).catch(() => { });
    };

    useEffect(() => { loadCampaigns(); loadSubcampaigns(); }, [showArchived]);

    const openNew = () => { setEditCampaign(null); setForm({ name: '', description: '', mirror_campaign_ids: [], mirror_sales_source_id: '' }); setShowModal(true); };
    const openEdit = (c) => { 
        setEditCampaign(c); 
        // Lidar com o campo antigo fallback caso precise, mas primariamente usando mirror_campaign_ids
        const mirrorIds = c.mirror_campaign_ids && c.mirror_campaign_ids.length > 0 ? c.mirror_campaign_ids : (c.mirror_campaign_id ? [c.mirror_campaign_id] : []);
        setForm({ name: c.name, description: c.description || '', mirror_campaign_ids: mirrorIds, mirror_sales_source_id: c.mirror_sales_source_id || '' }); 
        setShowModal(true); 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editCampaign) {
                await api.updateCampaign(editCampaign.uuid, form);
            } else {
                await api.createCampaign(form);
            }
            setShowModal(false);
            loadCampaigns();
        } catch (error) {
            console.error('Erro ao salvar campanha:', error);
            alert(`Erro ao salvar campanha: ${error.message}`);
        }
    };

    const handleArchive = async (uuid) => {
        if (confirm('Tem certeza que deseja arquivar esta campanha?')) {
            await api.updateCampaign(uuid, { is_active: false });
            loadCampaigns();
        }
    };

    const handleActivate = async (uuid) => {
        await api.activateCampaign(uuid);
        loadCampaigns();
    };

    const handleDelete = async (uuid) => {
        if (confirm('Tem certeza que deseja EXCLUIR PERMANENTEMENTE esta campanha?')) {
            await api.deleteCampaign(uuid);
            loadCampaigns();
        }
    };

    // Subcampanha handlers
    const openNewSub = (campaignId) => {
        setEditSubcampaign(null);
        setSubForm({ campaign_id: campaignId, name: '', color: '#6366f1', description: '' });
        setShowSubModal(true);
    };

    const openEditSub = (sub) => {
        setEditSubcampaign(sub);
        setSubForm({ campaign_id: sub.campaign_id, name: sub.name, color: sub.color || '#6366f1', description: sub.description || '' });
        setShowSubModal(true);
    };

    const handleSubSubmit = async (e) => {
        e.preventDefault();
        if (editSubcampaign) {
            await api.updateSubcampaign(editSubcampaign.uuid, subForm);
        } else {
            await api.createSubcampaign(subForm);
        }
        setShowSubModal(false);
        loadSubcampaigns();
    };

    const handleDeleteSub = async (uuid) => {
        if (confirm('Excluir esta subcampanha?')) {
            await api.deleteSubcampaign(uuid);
            loadSubcampaigns();
        }
    };

    const toggleExpand = (campaignId) => {
        const newSet = new Set(expandedCampaigns);
        if (newSet.has(campaignId)) {
            newSet.delete(campaignId);
        } else {
            newSet.add(campaignId);
        }
        setExpandedCampaigns(newSet);
    };

    const getSubcampaignsForCampaign = (campaignId) => subcampaigns.filter(s => s.campaign_id === campaignId);

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title"><FolderPlus size={28} style={{ marginRight: 12 }} />Campanhas / Lançamentos</h1>
                <button className="btn btn-primary" onClick={openNew}><FolderPlus size={18} /> Nova Campanha</button>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label className="toggle">
                        <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
                        <span className="toggle-slider"></span>
                    </label>
                    <span>Mostrar campanhas arquivadas</span>
                </div>
            </div>

            <div className="card">
                {loading ? <p>Carregando...</p> : campaigns.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                        <FolderPlus size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                        <p>Nenhuma campanha encontrada</p>
                        <p style={{ fontSize: '0.875rem' }}>Crie uma campanha para organizar seus lançamentos</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 16 }}>
                        {campaigns.map(c => {
                            const subs = getSubcampaignsForCampaign(c.id);
                            const isExpanded = expandedCampaigns.has(c.id);

                            return (
                                <div key={c.uuid}>
                                    {/* Campanha Principal */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 16, padding: 20,
                                        background: 'var(--bg-primary)', borderRadius: isExpanded ? '12px 12px 0 0' : 12, border: '1px solid var(--border)',
                                        opacity: c.is_active ? 1 : 0.6, cursor: 'pointer'
                                    }} onClick={() => toggleExpand(c.id)}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24 }}>
                                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        </div>
                                        <div style={{
                                            width: 48, height: 48, borderRadius: 12,
                                            background: c.is_active ? 'linear-gradient(135deg, var(--accent), #7c3aed)' : 'var(--border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.2rem'
                                        }}>
                                            {c.name.charAt(0).toUpperCase()}
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <h3 style={{ margin: 0 }}>{c.name}</h3>
                                                {!c.is_active && <span className="badge" style={{ background: '#ef444422', color: '#ef4444' }}>Arquivada</span>}
                                                <span className="badge" style={{ background: 'var(--accent)', color: '#fff', fontSize: '0.65rem' }}>
                                                    {subs.length} sub
                                                </span>
                                            </div>
                                            {c.description && <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{c.description}</p>}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginRight: 16 }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>{c.total_leads || 0}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Leads</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}><Edit2 size={14} /></button>
                                            {c.is_active ? (
                                                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--warning)' }} onClick={() => handleArchive(c.uuid)} title="Arquivar"><Archive size={14} /></button>
                                            ) : (
                                                <>
                                                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--success)' }} onClick={() => handleActivate(c.uuid)} title="Reativar"><RotateCcw size={14} /></button>
                                                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(c.uuid)} title="Excluir"><Trash2 size={14} /></button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Subcampanhas */}
                                    {isExpanded && (
                                        <div style={{
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border)',
                                            borderTop: 'none',
                                            borderRadius: '0 0 12px 12px',
                                            padding: 16
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                    Subcampanhas ({subs.length})
                                                </span>
                                                <button className="btn btn-sm" onClick={() => openNewSub(c.id)}>
                                                    <Plus size={14} /> Nova Subcampanha
                                                </button>
                                            </div>

                                            {subs.length === 0 ? (
                                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>
                                                    Nenhuma subcampanha. Crie uma para marcar leads importados.
                                                </p>
                                            ) : (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                    {subs.map(sub => (
                                                        <div key={sub.uuid} style={{
                                                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                                                            background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)'
                                                        }}>
                                                            <span style={{
                                                                width: 12, height: 12, borderRadius: '50%',
                                                                background: sub.color || '#6366f1'
                                                            }} />
                                                            <span style={{ fontWeight: 500 }}>{sub.name}</span>
                                                            <span style={{
                                                                background: 'var(--accent)',
                                                                color: '#fff',
                                                                padding: '2px 6px',
                                                                borderRadius: 4,
                                                                fontSize: '0.7rem',
                                                                fontWeight: 600
                                                            }}>
                                                                {sub.total_leads || 0}
                                                            </span>
                                                            <button className="btn btn-ghost btn-sm" style={{ padding: 2 }} onClick={() => openEditSub(sub)}>
                                                                <Edit2 size={12} />
                                                            </button>
                                                            <button className="btn btn-ghost btn-sm" style={{ padding: 2, color: 'var(--danger)' }} onClick={() => handleDeleteSub(sub.uuid)}>
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal Campanha */}
            {showModal && (
                <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <div className="modal slide-up">
                        <div className="modal-header">
                            <h3>{editCampaign ? 'Editar Campanha' : 'Nova Campanha'}</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} autoComplete="off">
                            <div className="form-group">
                                <label className="form-label">Nome da Campanha</label>
                                <input className="form-input" autoComplete="off" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Lançamento Janeiro 2024" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Descrição (opcional)</label>
                                <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Notas sobre esta campanha..." />
                            </div>

                            <div className="form-group" style={{ position: 'relative' }}>
                                <label className="form-label">Espelhar vendedora de...</label>
                                <button
                                    type="button"
                                    className="form-input"
                                    onClick={() => setShowMirrorPopup(true)}
                                    style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                >
                                    <span style={{ color: (form.mirror_campaign_ids || []).length === 0 ? 'var(--text-secondary)' : 'inherit' }}>
                                        {(form.mirror_campaign_ids || []).length === 0
                                            ? 'Nenhuma campanha selecionada'
                                            : `${(form.mirror_campaign_ids || []).length} campanha(s) selecionada(s)`
                                        }
                                    </span>
                                    <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>▼</span>
                                </button>
                                {(form.mirror_campaign_ids || []).length > 0 && (
                                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {campaigns
                                            .filter(c => (form.mirror_campaign_ids || []).includes(c.id))
                                            .map(c => (
                                                <span key={c.id} style={{
                                                    background: 'var(--primary)',
                                                    color: 'white',
                                                    borderRadius: 12,
                                                    padding: '2px 8px',
                                                    fontSize: '0.75rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4
                                                }}>
                                                    {c.name}
                                                    <span
                                                        style={{ cursor: 'pointer', fontWeight: 'bold', lineHeight: 1 }}
                                                        onClick={() => setForm({ ...form, mirror_campaign_ids: (form.mirror_campaign_ids || []).filter(id => id !== c.id) })}
                                                    >×</span>
                                                </span>
                                            ))
                                        }
                                    </div>
                                )}

                                {/* Popup de seleção */}
                                {showMirrorPopup && (
                                    <div
                                        style={{
                                            position: 'fixed', inset: 0, zIndex: 9999,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: 'rgba(0,0,0,0.65)'
                                        }}
                                        onMouseDown={e => { if (e.target === e.currentTarget) setShowMirrorPopup(false); }}
                                    >
                                        <div style={{
                                            background: 'var(--bg-card, #16213e)',
                                            backgroundColor: '#16213e',
                                            border: '1px solid var(--border)',
                                            borderRadius: 12,
                                            padding: 24,
                                            width: 440,
                                            maxWidth: '90vw',
                                            maxHeight: '80vh',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            boxShadow: '0 20px 60px rgba(0,0,0,0.7)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                                <h4 style={{ margin: 0 }}>🪞 Selecionar Campanhas para Espelhar</h4>
                                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowMirrorPopup(false)}><X size={16} /></button>
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                                                Quando um lead entrar nesta campanha, o sistema buscará a vendedora nas campanhas marcadas abaixo.
                                            </p>
                                            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                {campaigns
                                                    .filter(c => !editCampaign || c.id !== editCampaign.id)
                                                    .map(c => {
                                                        const isSelected = (form.mirror_campaign_ids || []).includes(c.id);
                                                        return (
                                                            <label key={c.id} style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 12,
                                                                padding: '10px 14px',
                                                                borderRadius: 8,
                                                                cursor: 'pointer',
                                                                background: isSelected ? 'rgba(var(--primary-rgb, 99,102,241),0.15)' : 'transparent',
                                                                border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                                                                transition: 'all 0.15s'
                                                            }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={e => {
                                                                        const ids = form.mirror_campaign_ids || [];
                                                                        setForm({
                                                                            ...form,
                                                                            mirror_campaign_ids: e.target.checked
                                                                                ? [...ids, c.id]
                                                                                : ids.filter(id => id !== c.id)
                                                                        });
                                                                    }}
                                                                    style={{ width: 16, height: 16, accentColor: 'var(--primary)', flexShrink: 0 }}
                                                                />
                                                                <span style={{ flex: 1, fontSize: '0.9rem' }}>{c.name}</span>
                                                                <span style={{
                                                                    fontSize: '0.7rem',
                                                                    padding: '2px 8px',
                                                                    borderRadius: 10,
                                                                    background: c.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(156,163,175,0.15)',
                                                                    color: c.is_active ? '#22c55e' : '#9ca3af'
                                                                }}>
                                                                    {c.is_active ? 'Ativa' : 'Arquivada'}
                                                                </span>
                                                            </label>
                                                        );
                                                    })
                                                }
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, gap: 8 }}>
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => setForm({ ...form, mirror_campaign_ids: [] })}
                                                >
                                                    Limpar seleção
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    onClick={() => setShowMirrorPopup(false)}
                                                >
                                                    Confirmar ({(form.mirror_campaign_ids || []).length})
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">💰 [NOVO] Espelhar Compradores de...</label>
                                <select
                                    className="form-select"
                                    value={form.mirror_sales_source_id || ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setForm({ ...form, mirror_sales_source_id: val ? parseInt(val) : null })
                                    }}
                                >
                                    <option value="">-- Não espelhar (Padrão) --</option>
                                    {campaigns
                                        .filter(c => !editCampaign || c.id !== editCampaign.id) // Não mostrar a própria campanha
                                        .map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} {c.is_active ? '(Ativa)' : '(Arquivada)'}
                                            </option>
                                        ))
                                    }
                                </select>
                                <small style={{ display: 'block', marginTop: 4, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                    Quando uma venda ocorrer na campanha selecionada acima, se o lead existir NESTA campanha, ele será marcado como VENDIDO aqui também.
                                </small>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{editCampaign ? 'Salvar' : 'Criar Campanha'}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Subcampanha */}
            {showSubModal && (
                <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowSubModal(false); }}>
                    <div className="modal slide-up">
                        <div className="modal-header">
                            <h3>{editSubcampaign ? 'Editar Subcampanha' : 'Nova Subcampanha'}</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowSubModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubSubmit} autoComplete="off">
                            <div className="form-group">
                                <label className="form-label">Nome da Subcampanha</label>
                                <input className="form-input" autoComplete="off" value={subForm.name} onChange={e => setSubForm({ ...subForm, name: e.target.value })} placeholder="Ex: Lista VIP, Remarketing, etc." required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Cor do Marcador</label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input type="color" value={subForm.color} onChange={e => setSubForm({ ...subForm, color: e.target.value })} style={{ width: 50, height: 40, padding: 0, border: 'none', borderRadius: 8 }} />
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Esta cor aparecerá como ponto ao lado do nome do lead</span>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Descrição (opcional)</label>
                                <textarea className="form-textarea" value={subForm.description} onChange={e => setSubForm({ ...subForm, description: e.target.value })} rows={2} placeholder="Notas..." />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{editSubcampaign ? 'Salvar' : 'Criar Subcampanha'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
