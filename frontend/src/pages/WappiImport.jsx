import { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { Plug, Download, Users, RefreshCw, AlertTriangle, CheckCircle, Search, CheckSquare, Square } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WappiImport() {
    const [groups, setGroups] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [configured, setConfigured] = useState(null); // null checking, false no, true yes
    const [importingGroupId, setImportingGroupId] = useState(null);
    const [selectedCampaign, setSelectedCampaign] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [importingAll, setImportingAll] = useState(false);

    useEffect(() => {
        checkConfiguration();
        loadCampaigns();
    }, []);

    const checkConfiguration = async () => {
        try {
            const status = await api.getWappiStatus();
            if (status.configured) {
                setConfigured(true);
                loadGroups();
            } else {
                setConfigured(false);
                setLoading(false);
            }
        } catch (err) {
            setConfigured(false);
            setLoading(false);
        }
    };

    const loadCampaigns = async () => {
        try {
            const res = await api.getCampaigns({ active_only: true });
            setCampaigns(res.campaigns || []);
            if (res.campaigns?.length > 0) setSelectedCampaign(res.campaigns[0].id);
        } catch (err) {
            console.error(err);
        }
    };

    const loadGroups = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.getWappiGroups();
            console.log('[WAPPI FRONTEND] Raw API response:', res);
            console.log('[WAPPI FRONTEND] Is array?', Array.isArray(res));

            const groupList = Array.isArray(res) ? res : (res.groups || []);
            console.log('[WAPPI FRONTEND] Final groupList length:', groupList.length);
            setGroups(groupList);
        } catch (err) {
            setError('Erro ao carregar grupos: ' + (err.message || 'Verifique se o WhatsApp está conectado no Whapi.'));
        } finally {
            setLoading(false);
        }
    };

    // Filtrar grupos pela pesquisa
    const filteredGroups = useMemo(() => {
        if (!searchTerm) return groups;
        const search = searchTerm.toLowerCase();
        return groups.filter(g =>
            (g.name || g.subject || '').toLowerCase().includes(search) ||
            (g.id || '').toLowerCase().includes(search)
        );
    }, [groups, searchTerm]);

    // Selecionar/desselecionar todos
    const toggleSelectAll = () => {
        if (selectedGroups.length === filteredGroups.length) {
            setSelectedGroups([]);
        } else {
            setSelectedGroups(filteredGroups.map(g => g.id));
        }
    };

    // Toggle individual
    const toggleGroupSelection = (groupId) => {
        setSelectedGroups(prev =>
            prev.includes(groupId)
                ? prev.filter(id => id !== groupId)
                : [...prev, groupId]
        );
    };

    const handleImport = async (group) => {
        if (!selectedCampaign) {
            alert('Selecione uma campanha primeiro.');
            return;
        }

        setImportingGroupId(group.id);
        try {
            const res = await api.importWappiGroup({
                groupId: group.id,
                campaignId: selectedCampaign
            });

            // Montar mensagem detalhada
            let message = `✅ Importação Concluída!\n\n`;
            message += `📊 Total de participantes: ${res.total}\n`;
            message += `📥 Novos leads: ${res.imported}\n`;
            message += `🔄 Atualizados: ${res.updated}\n`;
            message += `⚠️  Ignorados: ${res.skipped}\n`;

            // Detalhes dos ignorados
            if (res.skipped > 0 && res.skippedReasons) {
                message += `\n📋 Por que foram ignorados:\n`;
                if (res.skippedReasons.isLID > 0) {
                    message += `   🔒 LIDs (Privacy): ${res.skippedReasons.isLID}\n`;
                }
                if (res.skippedReasons.tooShort > 0) {
                    message += `   📏 Muito curto: ${res.skippedReasons.tooShort}\n`;
                }
                if (res.skippedReasons.tooLong > 0) {
                    message += `   📏 Muito longo: ${res.skippedReasons.tooLong}\n`;
                }
                if (res.skippedReasons.invalidFormat > 0) {
                    message += `   ❌ Formato inválido: ${res.skippedReasons.invalidFormat}\n`;
                }

                message += `\n💡 Dica: LIDs são IDs de privacidade do WhatsApp e não podem ser importados.`;
            }

            alert(message);

        } catch (err) {
            alert('Erro na importação: ' + err.message);
        } finally {
            setImportingGroupId(null);
        }
    };

    // Importar todos os grupos selecionados
    const handleImportSelected = async () => {
        if (!selectedCampaign) {
            alert('Selecione uma campanha primeiro.');
            return;
        }

        if (selectedGroups.length === 0) {
            alert('Selecione pelo menos um grupo.');
            return;
        }

        const confirmed = confirm(`Deseja importar ${selectedGroups.length} grupo(s) selecionado(s)?`);
        if (!confirmed) return;

        setImportingAll(true);

        let totalImported = 0;
        let totalUpdated = 0;
        let totalSkipped = 0;
        let totalParticipants = 0;
        let errors = 0;
        let aggregatedReasons = {
            isLID: 0,
            tooShort: 0,
            tooLong: 0,
            invalidFormat: 0
        };

        for (const groupId of selectedGroups) {
            try {
                const res = await api.importWappiGroup({
                    groupId,
                    campaignId: selectedCampaign
                });
                totalParticipants += res.total || 0;
                totalImported += res.imported || 0;
                totalUpdated += res.updated || 0;
                totalSkipped += res.skipped || 0;

                // Agregar motivos
                if (res.skippedReasons) {
                    aggregatedReasons.isLID += res.skippedReasons.isLID || 0;
                    aggregatedReasons.tooShort += res.skippedReasons.tooShort || 0;
                    aggregatedReasons.tooLong += res.skippedReasons.tooLong || 0;
                    aggregatedReasons.invalidFormat += res.skippedReasons.invalidFormat || 0;
                }
            } catch (err) {
                console.error(`Erro ao importar grupo ${groupId}:`, err);
                errors++;
            }
        }

        setImportingAll(false);
        setSelectedGroups([]);

        let message = `✅ Importação em Lote Concluída!\n\n`;
        message += `📊 Estatísticas:\n`;
        message += `   Grupos processados: ${selectedGroups.length}\n`;
        message += `   Total participantes: ${totalParticipants}\n`;
        message += `   📥 Novos leads: ${totalImported}\n`;
        message += `   🔄 Atualizados: ${totalUpdated}\n`;
        message += `   ⚠️  Ignorados: ${totalSkipped}\n`;

        if (errors > 0) {
            message += `   ❌ Erros: ${errors}\n`;
        }

        // Detalhes dos ignorados
        if (totalSkipped > 0) {
            message += `\n📋 Motivos dos contatos ignorados:\n`;
            if (aggregatedReasons.isLID > 0) {
                message += `   🔒 LIDs (Privacy): ${aggregatedReasons.isLID}\n`;
            }
            if (aggregatedReasons.tooShort > 0) {
                message += `   📏 Muito curto: ${aggregatedReasons.tooShort}\n`;
            }
            if (aggregatedReasons.tooLong > 0) {
                message += `   📏 Muito longo: ${aggregatedReasons.tooLong}\n`;
            }
            if (aggregatedReasons.invalidFormat > 0) {
                message += `   ❌ Formato inválido: ${aggregatedReasons.invalidFormat}\n`;
            }

            message += `\n💡 Dica: LIDs são IDs de privacidade do WhatsApp e não podem ser importados.`;
        }

        alert(message);
    };

    if (configured === false) {
        return (
            <div className="fade-in card" style={{ textAlign: 'center', padding: 40 }}>
                <Plug size={48} color="var(--text-secondary)" style={{ marginBottom: 16 }} />
                <h2>Wappi não configurado</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                    Para importar grupos via Wappi, você precisa configurar o Token e Profile ID.
                </p>
                <Link to="/settings" className="btn btn-primary">Ir para Configurações</Link>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title"><Download size={28} style={{ marginRight: 12 }} /> Importador Wappi (Grupos)</h1>
                <button className="btn btn-ghost" onClick={loadGroups} disabled={loading}>
                    <RefreshCw size={20} className={loading ? 'spin' : ''} />
                </button>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 16 }}>1. Selecione a Campanha de Destino</h3>
                <select
                    className="form-input"
                    value={selectedCampaign}
                    onChange={e => setSelectedCampaign(e.target.value)}
                >
                    <option value="">Selecione uma campanha...</option>
                    {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <small style={{ color: 'var(--text-secondary)', marginTop: 8, display: 'block' }}>
                    Os contatos importados serão adicionados a esta campanha.
                </small>
            </div>

            {error && (
                <div style={{ padding: 16, background: '#ef444422', color: '#ef4444', borderRadius: 8, marginBottom: 24 }}>
                    <AlertTriangle size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                    <RefreshCw size={32} className="spin" style={{ marginBottom: 16, color: 'var(--accent)' }} />
                    <p>Carregando grupos do Whapi...</p>
                </div>
            ) : groups.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                    <Users size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                    <p>Nenhum grupo encontrado.</p>
                    <small>Verifique se o WhatsApp está conectado e se você participa de grupos.</small>
                </div>
            ) : (
                <>
                    {/* Barra de pesquisa e ações */}
                    <div className="card" style={{ marginBottom: 16, padding: 16 }}>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Campo de pesquisa */}
                            <div style={{ flex: 1, minWidth: 250, position: 'relative' }}>
                                <Search size={18} style={{
                                    position: 'absolute',
                                    left: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-secondary)'
                                }} />
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Pesquisar grupos por nome ou ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ paddingLeft: 40 }}
                                />
                            </div>

                            {/* Checkbox selecionar todos */}
                            <button
                                className="btn btn-ghost"
                                onClick={toggleSelectAll}
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                {selectedGroups.length === filteredGroups.length && filteredGroups.length > 0 ? (
                                    <CheckSquare size={20} />
                                ) : (
                                    <Square size={20} />
                                )}
                                Selecionar Todos ({filteredGroups.length})
                            </button>

                            {/* Botão importar selecionados */}
                            {selectedGroups.length > 0 && (
                                <button
                                    className="btn btn-primary"
                                    onClick={handleImportSelected}
                                    disabled={importingAll || !selectedCampaign}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                                >
                                    {importingAll ? (
                                        <>
                                            <RefreshCw size={16} className="spin" />
                                            Importando...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={16} />
                                            Importar {selectedGroups.length} Selecionado(s)
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Informações */}
                        <div style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {filteredGroups.length !== groups.length && (
                                <span>Mostrando {filteredGroups.length} de {groups.length} grupos • </span>
                            )}
                            {selectedGroups.length > 0 && (
                                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                                    {selectedGroups.length} selecionado(s)
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Lista de grupos */}
                    {filteredGroups.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                            <Search size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                            <p>Nenhum grupo encontrado para "{searchTerm}"</p>
                            <small>Tente outro termo de pesquisa.</small>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: 16 }}>
                            {filteredGroups.map(group => {
                                const isImporting = importingGroupId === group.id;
                                const isSelected = selectedGroups.includes(group.id);

                                return (
                                    <div
                                        key={group.id}
                                        className="card"
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: 16,
                                            background: isSelected ? 'rgba(59, 130, 246, 0.05)' : undefined,
                                            border: isSelected ? '2px solid var(--accent)' : undefined
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            {/* Checkbox */}
                                            <button
                                                onClick={() => toggleGroupSelection(group.id)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: 4,
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                {isSelected ? (
                                                    <CheckSquare size={24} color="var(--accent)" />
                                                ) : (
                                                    <Square size={24} color="var(--text-secondary)" />
                                                )}
                                            </button>

                                            {/* Ícone do grupo */}
                                            <div style={{
                                                width: 48, height: 48, borderRadius: '50%', background: '#eee',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                                            }}>
                                                👥
                                            </div>

                                            {/* Info do grupo */}
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                                    {group.name || group.subject || 'Grupo Sem Nome'}
                                                </div>
                                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                    {group.participants?.length || '?'} participantes
                                                </div>
                                            </div>
                                        </div>

                                        {/* Botão importar individual */}
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => handleImport(group)}
                                            disabled={!selectedCampaign || isImporting || importingGroupId !== null || importingAll}
                                            style={{ minWidth: 140 }}
                                        >
                                            {isImporting ? 'Importando...' : (
                                                <>
                                                    <Download size={16} /> Importar
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
