import React, { useEffect, useState, useMemo } from 'react'
import { ArrowLeft, Users, BookOpen, Plus, Settings, X, Hash, Dices, Trash2 } from 'lucide-react'
import { audioService } from '../utils/audio'
import { useCampaignStore } from '../stores/useCampaignStore'
import { PlayerModal } from './PlayerModal'
import { SessionModal } from './SessionModal'
import { TableModal } from './TableModal'
import { FolderModal } from './FolderModal'
import { FolderCard } from './FolderCard'
import { MultiTabEditor } from './MultiTabEditor'
import { requestDiceRoll } from './DiceRoller'
import { TableView } from './TableView'
import { ContextMenu } from './ContextMenu'
import { useContextMenu } from '../utils/useContextMenu'
import type { Player, Session, MentionItem } from '../../../types'

interface CampaignDashboardProps {
  onBack: () => void
}


export function CampaignDashboard({ onBack }: CampaignDashboardProps): JSX.Element {
  const { 
    activeCampaign, 
    playersList, 
    sessionsList, 
    fetchPlayers, 
    fetchSessions,
    activeSession,
    setActiveSession,
    activePlayer,
    setActivePlayer,
    reorderPlayers,
    reorderSessions,
    tablesList,
    fetchTables,
    reorderTables,
    deleteTable,
    activeTable,
    setActiveTable,
    folders,
    fetchFolders,
    deleteFolder,
    updateCampaign,
    updatePlayer,
    updateSession,
    updateTable,
    updateFolder
  } = useCampaignStore()

  const { contextMenuProps, showContextMenu } = useContextMenu()

  const [activeTab, setActiveTab] = useState<'sessions' | 'players' | 'tables'>('sessions')
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null)
  
  // Modals state
  const [playerModalOpen, setPlayerModalOpen] = useState(false)
  const [editPlayerTarget, setEditPlayerTarget] = useState<Player | null>(null)
  
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [editSessionTarget, setEditSessionTarget] = useState<Session | null>(null)

  const [tableModalOpen, setTableModalOpen] = useState(false)
  const [editTableTarget, setEditTableTarget] = useState<any | null>(null)

  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [folderEditTarget, setFolderEditTarget] = useState<any | null>(null)

  const [presentPlayerIds, setPresentPlayerIds] = useState<number[]>([])
  const [previewPlayer, setPreviewPlayer] = useState<Player | null>(null)

  // Reset folder when changing tabs
  useEffect(() => {
    setCurrentFolderId(null)
  }, [activeTab])

  // Fetch folders for current tab
  useEffect(() => {
    if (activeCampaign) {
      const typeMap: Record<string, 'session' | 'player' | 'table'> = {
        sessions: 'session',
        players: 'player',
        tables: 'table'
      }
      fetchFolders(typeMap[activeTab], activeCampaign.id)
    }
  }, [activeCampaign, activeTab, fetchFolders])

  // Generate mentionable items
  const mentionItems: MentionItem[] = React.useMemo(() => {
    return [
      ...playersList.map(p => ({ id: `player_${p.id}`, label: p.name, type: 'player' as const, avatar_url: p.avatar_url, attributes: p.attributes })),
      ...sessionsList.map(s => ({ id: `session_${s.id}`, label: s.title, type: 'session' as const })),
      ...(activeCampaign ? [{ id: `campaign_${activeCampaign.id}`, label: activeCampaign.name, type: 'campaign' as const }] : [])
    ]
  }, [playersList, sessionsList, activeCampaign])

  const handleMentionClick = (id: string) => {
    const [type, rawId] = id.split('_')
    const numericId = Number(rawId)

    if (type === 'player') {
      const player = playersList.find(p => p.id === numericId)
      if (player) {
        setActiveTab('players')
        setActivePlayer(player)
      }
    } else if (type === 'session') {
      const session = sessionsList.find(s => s.id === numericId)
      if (session) {
        setActiveTab('sessions')
        setActiveSession(session)
      }
    }
  }

  useEffect(() => {
    if (activeCampaign) {
      fetchPlayers(activeCampaign.id)
      fetchSessions(activeCampaign.id)
      fetchTables(activeCampaign.id)
    }
  }, [activeCampaign, fetchPlayers, fetchSessions, fetchTables])

  useEffect(() => {
    if (activeSession && !sessionModalOpen) {
      window.api.sessions.getPresentPlayers(activeSession.id)
        .then(setPresentPlayerIds)
        .catch(console.error)
    } else if (!activeSession) {
      setPresentPlayerIds([])
    }
  }, [activeSession?.id, sessionModalOpen])

  const handleOpenPlayerNew = () => {
    setEditPlayerTarget(null)
    setPlayerModalOpen(true)
  }

  const handleOpenPlayerEdit = (p: Player) => {
    setEditPlayerTarget(p)
    setPlayerModalOpen(true)
  }

  const handleOpenSessionNew = () => {
    setEditSessionTarget(null)
    setSessionModalOpen(true)
  }

  const handleOpenSessionEdit = (s: Session) => {
    setEditSessionTarget(s)
    setSessionModalOpen(true)
  }

  const handleOpenTableNew = () => {
    setEditTableTarget(null)
    setTableModalOpen(true)
  }

  const handleOpenTableEdit = (t: any) => {
    setEditTableTarget(t)
    setTableModalOpen(true)
  }

  const handleOpenFolderModal = (editTarget: any = null) => {
    setFolderEditTarget(editTarget)
    setFolderModalOpen(true)
  }

  const handleItemDrop = async (itemId: string, itemType: string, targetFolderId: number) => {
    const id = Number(itemId)
    if (itemType === 'session') await updateSession(id, { folder_id: targetFolderId })
    else if (itemType === 'player') await updatePlayer(id, { folder_id: targetFolderId })
    else if (itemType === 'table') await updateTable(id, { folder_id: targetFolderId })
    else if (itemType === 'folder') {
      if (id === targetFolderId) return
      await updateFolder(id, { parent_id: targetFolderId })
    }
  }

  // Handle auto-save for session notes
  const handleSessionNotesChange = (notes: string) => {
    if (activeSession) {
      updateSession(activeSession.id, { notes })
    }
  }

  const folderItemCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    folders.forEach(f => {
      const subFolders = folders.filter(sf => sf.parent_id === f.id).length
      const subSessions = sessionsList.filter(s => s.folder_id === f.id).length
      const subPlayers = playersList.filter(p => p.folder_id === f.id).length
      const subTables = tablesList.filter(t => t.folder_id === f.id).length
      counts[f.id] = subFolders + subSessions + subPlayers + subTables
    })
    return counts
  }, [folders, sessionsList, playersList, tablesList])

  const filteredSessions = sessionsList.filter(s => (s.folder_id || null) === currentFolderId)
  const filteredPlayers = playersList.filter(p => (p.folder_id || null) === currentFolderId)
  const filteredTables = tablesList.filter(t => (t.folder_id || null) === currentFolderId)
  const filteredFolders = folders.filter(f => (f.parent_id || null) === currentFolderId)

  const currentFolder = folders.find(f => f.id === currentFolderId)

  if (!activeCampaign) return <div className="p-8 text-white">Nenhuma campanha selecionada.</div>

  return (
    <div className="flex flex-1 min-h-0 relative">
      {/* ── Sidebar (Players / Sessions) ─────────────────────────────────── */}
      <aside className="w-80 border-r border-white/20 bg-dark-950 flex flex-col z-20 shrink-0 relative">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <button 
            onClick={() => {
              audioService.playClick()
              onBack()
            }} 
            className="p-1.5 hover:bg-white/10 text-dark-300 hover:text-white transition-colors" 
            title="Voltar para Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="font-display font-semibold text-lg text-white truncate">
              {activeCampaign.name}
            </h2>
            <p className="text-xs text-dark-400 truncate">{activeCampaign.system_name}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 shrink-0">
          <button 
            onClick={() => {
              audioService.playClick()
              setActiveTab('sessions')
            }}
            className={`flex-1 py-3 text-xs tracking-wider uppercase font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'sessions' ? 'border-b-2 border-white text-white' : 'text-dark-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Sessões
          </button>
          <button 
            onClick={() => {
              audioService.playClick()
              setActiveTab('players')
            }}
            className={`flex-1 py-3 text-xs tracking-wider uppercase font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'players' ? 'border-b-2 border-white text-white' : 'text-dark-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            Jogadores
          </button>
          <button 
            onClick={() => {
              audioService.playClick()
              setActiveTab('tables')
            }}
            className={`flex-1 py-3 text-xs tracking-wider uppercase font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'tables' ? 'border-b-2 border-white text-white' : 'text-dark-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Hash className="w-4 h-4" />
            Tabelas
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {/* Folder Navigation Header */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                {currentFolderId && (
                  <button 
                    onClick={() => setCurrentFolderId(currentFolder?.parent_id || null)}
                    className="p-1 text-dark-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <span className="text-[10px] font-bold text-dark-500 uppercase tracking-widest">
                  {currentFolder ? currentFolder.name : 'Arquivos'}
                </span>
              </div>
              <button 
                onClick={() => handleOpenFolderModal()}
                className="text-[10px] font-bold text-dark-400 hover:text-white transition-colors uppercase tracking-widest"
              >
                + Pasta
              </button>
            </div>
          <div 
            className="flex-1 min-h-[200px]"
            onContextMenu={(e) => {
              const items = [
                { 
                  label: activeTab === 'sessions' ? 'Nova Sessão' : activeTab === 'players' ? 'Novo Jogador' : 'Nova Tabela', 
                  icon: <Plus className="w-4 h-4" />, 
                  onClick: activeTab === 'sessions' ? handleOpenSessionNew : activeTab === 'players' ? handleOpenPlayerNew : handleOpenTableNew 
                },
                { label: 'Nova Pasta', icon: <Plus className="w-4 h-4" />, onClick: () => handleOpenFolderModal() }
              ]
              showContextMenu(e, items)
            }}
          >

          {activeTab === 'sessions' && (
            <>
              <div className="space-y-1">
                {filteredFolders.map((folder) => (
                  <FolderCard 
                    key={folder.id} 
                    folder={folder} 
                    itemCount={folderItemCounts[folder.id]}
                    onEdit={handleOpenFolderModal} 
                    onDelete={deleteFolder} 
                    onClick={(f) => setCurrentFolderId(f.id)} 
                    onDrop={handleItemDrop}
                  />
                ))}

                {filteredSessions.length === 0 && filteredFolders.length === 0 ? (
                  <div className="text-center p-4 text-dark-500 text-sm">Vazio.</div>
                ) : (
                  filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => setActiveSession(session)}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('itemId', session.id.toString())
                        e.dataTransfer.setData('itemType', 'session')
                      }}
                      onContextMenu={(e) => {
                        e.stopPropagation()
                        showContextMenu(e, [
                          { label: 'Editar', icon: <Trash2 className="w-4 h-4" />, onClick: () => handleOpenSessionEdit(session) },
                          { label: 'Excluir', icon: <Trash2 className="w-4 h-4" />, onClick: () => {
                            if (confirm(`Excluir sessão "${session.title}"?`)) {
                              window.api.sessions.delete(session.id).then(() => fetchSessions(activeCampaign.id))
                            }
                          }, variant: 'danger' }
                        ])
                      }}
                      className={`relative p-3 border cursor-pointer transition-colors select-none ${
                        activeSession?.id === session.id
                          ? 'border-white bg-white/5'
                          : 'border-transparent hover:border-white/20 bg-dark-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0 flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-white truncate">{session.title}</h4>
                        </div>
                      </div>
                      {session.tags && (
                        <div className="flex gap-1 mt-2 overflow-x-auto no-scrollbar">
                          {session.tags.split(',').map((t, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-dark-950 border border-white/10 text-dark-300 whitespace-nowrap">
                              {t.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'players' && (
            <>
              <div className="space-y-1">
                {filteredFolders.map((folder) => (
                  <FolderCard 
                    key={folder.id} 
                    folder={folder} 
                    itemCount={folderItemCounts[folder.id]}
                    onEdit={handleOpenFolderModal} 
                    onDelete={deleteFolder} 
                    onClick={(f) => setCurrentFolderId(f.id)} 
                    onDrop={handleItemDrop}
                  />
                ))}

                {filteredPlayers.length === 0 && filteredFolders.length === 0 ? (
                  <div className="text-center p-4 text-dark-500 text-sm">Vazio.</div>
                ) : (
                  filteredPlayers.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => setActivePlayer(player)}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('itemId', player.id.toString())
                        e.dataTransfer.setData('itemType', 'player')
                      }}
                      onContextMenu={(e) => {
                        e.stopPropagation()
                        showContextMenu(e, [
                          { label: 'Editar', icon: <Trash2 className="w-4 h-4" />, onClick: () => handleOpenPlayerEdit(player) },
                          { label: 'Excluir', icon: <Trash2 className="w-4 h-4" />, onClick: () => {
                            if (confirm(`Excluir jogador "${player.name}"?`)) {
                              window.api.players.delete(player.id).then(() => fetchPlayers(activeCampaign.id))
                            }
                          }, variant: 'danger' }
                        ])
                      }}
                      className={`relative p-3 border cursor-pointer transition-colors flex items-center gap-2 select-none ${
                        activePlayer?.id === player.id
                          ? 'border-white bg-white/5'
                          : 'border-transparent hover:border-white/20 bg-dark-900'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 flex-shrink-0 bg-dark-950 border border-white/20 flex items-center justify-center overflow-hidden">
                        {player.avatar_url ? (
                          <img src={player.avatar_url} alt={player.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-dark-500 font-display font-bold text-base leading-none uppercase">
                            {player.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-white truncate">{player.name}</h4>
                        </div>
                        <p className="text-xs text-dark-400 mt-0.5 truncate">{player.class_archetype || 'Sem classe'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'tables' && (
            <>
              <div className="space-y-1">
                {filteredFolders.map((folder) => (
                  <FolderCard 
                    key={folder.id} 
                    folder={folder} 
                    itemCount={folderItemCounts[folder.id]}
                    onEdit={handleOpenFolderModal} 
                    onDelete={deleteFolder} 
                    onClick={(f) => setCurrentFolderId(f.id)} 
                    onDrop={handleItemDrop}
                  />
                ))}

                {filteredTables.length === 0 && filteredFolders.length === 0 ? (
                  <div className="text-center p-4 text-dark-500 text-sm">Vazio.</div>
                ) : (
                  filteredTables.map((table) => (
                    <div
                      key={table.id}
                      onClick={() => setActiveTable(table)}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('itemId', table.id.toString())
                        e.dataTransfer.setData('itemType', 'table')
                      }}
                      onContextMenu={(e) => {
                        e.stopPropagation()
                        showContextMenu(e, [
                          { label: 'Editar', icon: <Trash2 className="w-4 h-4" />, onClick: () => handleOpenTableEdit(table) },
                          { label: 'Excluir', icon: <Trash2 className="w-4 h-4" />, onClick: () => {
                            if (confirm(`Excluir tabela "${table.name}"?`)) {
                              deleteTable(table.id)
                            }
                          }, variant: 'danger' }
                        ])
                      }}
                      className={`relative p-3 border cursor-pointer transition-colors flex items-center gap-2 select-none ${
                        activeTable?.id === table.id
                          ? 'border-white bg-white/5'
                          : 'border-transparent hover:border-white/20 bg-dark-900'
                      }`}
                    >
                      <Hash className="w-4 h-4 text-dark-400" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-white truncate">{table.name}</h4>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
          </div>
        </div>
      </aside>

      {/* ── Main Content (Editor) ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col bg-dark-900 relative z-20">
        {!activeSession && !activePlayer && !activeTable ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-dark-400 animate-fade-in">
            <BookOpen className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-display text-white mb-2">Modo de Jogo</h3>
            <p className="max-w-md">Selecione uma sessão, um jogador ou uma tabela na lateral para visualizar ou editar. Use o espaço para gerenciar sua campanha em tempo real.</p>
          </div>
        ) : activeTable ? (
          <TableView table={activeTable} />
        ) : activeSession ? (
          <div className="flex-1 flex flex-col animate-fade-in min-h-0" key={`session-${activeSession.id}`}>
            <header className="p-8 pb-4 shrink-0 border-b border-white/5">
              <h1 className="text-3xl font-display font-bold text-white mb-2">{activeSession.title}</h1>
              <div className="flex gap-2 mb-4">
                 {activeSession.tags?.split(',').filter(Boolean).map((t, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-dark-950 border border-white/10 text-dark-300">
                      {t.trim()}
                    </span>
                  ))}
              </div>

              {/* Present Players */}
              {presentPlayerIds.length > 0 && (
                <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
                  <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Jogadores Presentes:</span>
                  <div className="flex flex-wrap gap-2">
                    {playersList.filter(p => presentPlayerIds.includes(p.id)).map(player => (
                      <div 
                        key={player.id} 
                        onClick={() => setPreviewPlayer(player)}
                        className="flex items-center gap-2 bg-dark-950 border border-white/10 pr-3 overflow-hidden cursor-pointer hover:border-white/30 transition-colors" 
                        title={player.name}
                      >
                        <div className="w-6 h-6 flex-shrink-0 bg-dark-900 border-r border-white/10 flex items-center justify-center overflow-hidden">
                          {player.avatar_url ? (
                            <img src={player.avatar_url} alt={player.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-dark-500 font-display font-bold text-[10px] leading-none uppercase">
                              {player.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-white">{player.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </header>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-7xl mx-auto">
                <MultiTabEditor 
                  content={activeSession.notes} 
                  onChange={handleSessionNotesChange} 
                  placeholder="A aventura continua..."
                  mentionItems={mentionItems}
                  onMentionClick={handleMentionClick}
                />
              </div>
            </div>
          </div>
        ) : activePlayer ? (
          <div className="flex-1 flex flex-col animate-fade-in min-h-0" key={`player-${activePlayer.id}`}>
            <header className="p-8 pb-6 shrink-0 border-b border-white/5 flex items-end gap-6">
              <div className="w-32 h-32 flex-shrink-0 bg-dark-950 border border-white/20 flex items-center justify-center overflow-hidden shadow-2xl">
                {activePlayer.avatar_url ? (
                  <img src={activePlayer.avatar_url} alt={activePlayer.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-dark-500 font-display font-bold text-5xl leading-none uppercase">
                    {activePlayer.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl font-display font-bold text-white mb-2 truncate">{activePlayer.name}</h1>
                <p className="text-lg text-dark-400 truncate">{activePlayer.class_archetype || 'Sem classe registrada'}</p>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-7xl mx-auto">
                {(() => {
                  try {
                    const attrs = activePlayer.attributes ? JSON.parse(activePlayer.attributes) : []
                    if (Array.isArray(attrs) && attrs.length > 0) {
                      return (
                        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                          {attrs.map((attr, idx) => (
                            <div key={idx} className="bg-dark-950 border border-white/10 p-4 flex flex-col items-center justify-center rounded">
                              <span className="text-xs text-dark-400 font-bold uppercase tracking-widest mb-1">{attr.name}</span>
                              <span className="text-2xl font-display font-semibold text-white">
                                {attr.value}
                                {attr.max_value && <span className="text-dark-500 text-lg ml-1">/ {attr.max_value}</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      )
                    }
                  } catch {}
                  return null
                })()}
                <MultiTabEditor 
                  content={activePlayer.notes} 
                  onChange={(notes) => updatePlayer(activePlayer.id, { notes })} 
                  placeholder="Anotações do jogador..."
                  mentionItems={mentionItems}
                  onMentionClick={handleMentionClick}
                />
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {playerModalOpen && (
        <PlayerModal editTarget={editPlayerTarget} defaultFolderId={currentFolderId} onClose={() => setPlayerModalOpen(false)} />
      )}
      {sessionModalOpen && (
        <SessionModal editTarget={editSessionTarget} defaultFolderId={currentFolderId} onClose={() => setSessionModalOpen(false)} />
      )}
      {tableModalOpen && (
        <TableModal editTarget={editTableTarget} defaultFolderId={currentFolderId} onClose={() => setTableModalOpen(false)} />
      )}
      {folderModalOpen && (
        <FolderModal 
          editTarget={folderEditTarget} 
          type={activeTab === 'sessions' ? 'session' : activeTab === 'players' ? 'player' : 'table'} 
          campaignId={activeCampaign.id}
          parentFolderId={currentFolderId || undefined}
          onClose={() => setFolderModalOpen(false)} 
        />
      )}

      {/* ── Player Preview Modal ─────────────────────────────────────────── */}
      {previewPlayer && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in"
          onClick={() => { audioService.playClick(); setPreviewPlayer(null); }}
        >
          <div 
            className="w-full max-w-lg max-h-[90vh] bg-dark-900 border border-white/20 shadow-2xl flex flex-col p-8 animate-slide-up relative overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => { audioService.playClick(); setPreviewPlayer(null); }} 
              className="absolute top-4 right-4 p-2 text-dark-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex gap-6 items-start">
              <div className="w-24 h-24 bg-dark-950 border border-white/20 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-xl">
                {previewPlayer.avatar_url ? (
                  <img src={previewPlayer.avatar_url} alt={previewPlayer.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-dark-500 font-display font-bold text-4xl leading-none uppercase">
                    {previewPlayer.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 pr-6">
                <h2 className="text-2xl font-display font-bold text-white mb-1">{previewPlayer.name}</h2>
                <p className="text-dark-400 text-sm">{previewPlayer.class_archetype || 'Sem classe registrada'}</p>
                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => {
                      setPreviewPlayer(null)
                      handleOpenPlayerEdit(previewPlayer)
                    }}
                    className="text-xs px-3 py-1.5 border border-white/20 hover:bg-white/10 text-white transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Editar
                  </button>
                </div>
              </div>
            </div>
            
            {/* Attributes Preview */}
            {(() => {
              try {
                const attrs = previewPlayer.attributes ? JSON.parse(previewPlayer.attributes) : []
                if (Array.isArray(attrs) && attrs.length > 0) {
                  return (
                    <div className="mt-8 border-t border-white/10 pt-6">
                      <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-4">Atributos / Status</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {attrs.map((attr, idx) => (
                          <div key={idx} className="bg-dark-950 border border-white/10 p-3 flex flex-col items-center justify-center rounded">
                            <span className="text-[10px] text-dark-400 font-bold uppercase tracking-widest mb-0.5">{attr.name}</span>
                            <span className="text-lg font-display font-semibold text-white">
                              {attr.value}
                              {attr.max_value && <span className="text-dark-500 text-sm ml-1">/ {attr.max_value}</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }
              } catch {}
              return null
            })()}

            {/* Notes Preview */}
            <div className="mt-8 border-t border-white/10 pt-6">
              <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-4">Anotações do Personagem</h4>
              <div className="bg-dark-950 border border-white/10 max-h-60 overflow-y-auto w-full flex flex-col">
                {previewPlayer.notes && previewPlayer.notes !== '[]' ? (
                  <MultiTabEditor 
                    content={previewPlayer.notes}
                    readOnly={true}
                    mentionItems={mentionItems}
                  />
                ) : (
                  <div className="p-4"><p className="text-dark-500 text-sm italic">Nenhuma anotação registrada.</p></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {contextMenuProps.visible && <ContextMenu {...contextMenuProps} />}
    </div>
  )
}
