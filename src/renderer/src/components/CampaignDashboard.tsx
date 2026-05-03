import React, { useEffect, useState } from 'react'
import { ArrowLeft, Users, BookOpen, Plus, Settings, X, Hash, Dices } from 'lucide-react'
import { audioService } from '../utils/audio'
import { useCampaignStore } from '../stores/useCampaignStore'
import { PlayerModal } from './PlayerModal'
import { SessionModal } from './SessionModal'
import { TableModal } from './TableModal'
import { MultiTabEditor } from './MultiTabEditor'
import { requestDiceRoll } from './DiceRoller'
import { TableView } from './TableView'
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
    updateSession,
    activePlayer,
    setActivePlayer,
    updatePlayer,
    reorderPlayers,
    reorderSessions,
    tablesList,
    fetchTables,
    reorderTables,
    deleteTable,
    activeTable,
    setActiveTable
  } = useCampaignStore()

  const [activeTab, setActiveTab] = useState<'sessions' | 'players' | 'tables'>('sessions')
  
  // Modals state
  const [playerModalOpen, setPlayerModalOpen] = useState(false)
  const [editPlayerTarget, setEditPlayerTarget] = useState<Player | null>(null)
  
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [editSessionTarget, setEditSessionTarget] = useState<Session | null>(null)

  const [tableModalOpen, setTableModalOpen] = useState(false)
  const [editTableTarget, setEditTableTarget] = useState<any | null>(null)

  const [presentPlayerIds, setPresentPlayerIds] = useState<number[]>([])
  const [previewPlayer, setPreviewPlayer] = useState<Player | null>(null)

  // Drag-and-drop state
  const [draggingSessionIdx, setDraggingSessionIdx] = useState<number | null>(null)
  const [dragOverSessionIdx, setDragOverSessionIdx] = useState<number | null>(null)
  const [draggingPlayerIdx, setDraggingPlayerIdx] = useState<number | null>(null)
  const [dragOverPlayerIdx, setDragOverPlayerIdx] = useState<number | null>(null)

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

  // Handle auto-save for session notes
  const handleSessionNotesChange = (notes: string) => {
    if (activeSession) {
      updateSession(activeSession.id, { notes })
    }
  }

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
          {activeTab === 'sessions' && (
            <>
              <button
                onClick={() => {
                  audioService.playClick()
                  handleOpenSessionNew()
                }}
                className="w-full btn-secondary py-2 justify-center mb-4 text-xs"
              >
                <Plus className="w-4 h-4 mr-2" /> Nova Sessão
              </button>
              
              {sessionsList.length === 0 ? (
                <div className="text-center p-4 text-dark-500 text-sm">Nenhuma sessão criada.</div>
              ) : (
                <div className="space-y-1">
                  {sessionsList.map((session, idx) => (
                    <div
                      key={session.id}
                      draggable
                      onDragStart={(e) => {
                        audioService.playSlide()
                        setDraggingSessionIdx(idx)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragEnd={() => {
                        if (draggingSessionIdx !== null && dragOverSessionIdx !== null && draggingSessionIdx !== dragOverSessionIdx) {
                          audioService.playPop()
                          reorderSessions(draggingSessionIdx, dragOverSessionIdx)
                        }
                        setDraggingSessionIdx(null)
                        setDragOverSessionIdx(null)
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                        setDragOverSessionIdx(idx)
                      }}
                      onDragLeave={() => setDragOverSessionIdx(null)}
                      onClick={() => setActiveSession(session)}
                      style={{
                        opacity: draggingSessionIdx === idx ? 0.35 : 1,
                        transition: 'opacity 0.15s ease',
                      }}
                      className={`relative p-3 border cursor-pointer transition-colors select-none ${
                        activeSession?.id === session.id
                          ? 'border-white bg-white/5'
                          : 'border-transparent hover:border-white/20 bg-dark-900'
                      } ${
                        dragOverSessionIdx === idx && draggingSessionIdx !== idx
                          ? 'border-t-2 border-t-white/60'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {/* Drag handle */}
                        <span
                          className="text-dark-600 hover:text-dark-300 cursor-grab active:cursor-grabbing shrink-0 transition-colors text-base leading-none select-none"
                          title="Arraste para reordenar"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          ⠿
                        </span>
                        <div className="flex-1 min-w-0 flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-white truncate">{session.title}</h4>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenSessionEdit(session) }}
                            className="text-dark-400 hover:text-white ml-1 shrink-0"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {session.tags && (
                        <div className="flex gap-1 mt-2 overflow-x-auto no-scrollbar pl-5">
                          {session.tags.split(',').map((t, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-dark-950 border border-white/10 text-dark-300 whitespace-nowrap">
                              {t.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'players' && (
            <>
              <button
                onClick={() => {
                  audioService.playClick()
                  handleOpenPlayerNew()
                }}
                className="w-full btn-secondary py-2 justify-center mb-4 text-xs"
              >
                <Plus className="w-4 h-4 mr-2" /> Novo Jogador
              </button>
              
              {playersList.length === 0 ? (
                <div className="text-center p-4 text-dark-500 text-sm">Nenhum jogador criado.</div>
              ) : (
                <div className="space-y-1">
                  {playersList.map((player, idx) => (
                    <div
                      key={player.id}
                      draggable
                      onDragStart={(e) => {
                        audioService.playSlide()
                        setDraggingPlayerIdx(idx)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragEnd={() => {
                        if (draggingPlayerIdx !== null && dragOverPlayerIdx !== null && draggingPlayerIdx !== dragOverPlayerIdx) {
                          audioService.playPop()
                          reorderPlayers(draggingPlayerIdx, dragOverPlayerIdx)
                        }
                        setDraggingPlayerIdx(null)
                        setDragOverPlayerIdx(null)
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                        setDragOverPlayerIdx(idx)
                      }}
                      onDragLeave={() => setDragOverPlayerIdx(null)}
                      onClick={() => setActivePlayer(player)}
                      style={{
                        opacity: draggingPlayerIdx === idx ? 0.35 : 1,
                        transition: 'opacity 0.15s ease',
                      }}
                      className={`relative p-3 border cursor-pointer transition-colors flex items-center gap-2 select-none ${
                        activePlayer?.id === player.id
                          ? 'border-white bg-white/5'
                          : 'border-transparent hover:border-white/20 bg-dark-900'
                      } ${
                        dragOverPlayerIdx === idx && draggingPlayerIdx !== idx
                          ? 'border-t-2 border-t-white/60'
                          : ''
                      }`}
                    >
                      {/* Drag handle */}
                      <span
                        className="text-dark-600 hover:text-dark-300 cursor-grab active:cursor-grabbing shrink-0 transition-colors text-base leading-none select-none"
                        title="Arraste para reordenar"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        ⠿
                      </span>
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
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenPlayerEdit(player) }}
                            className="text-dark-400 hover:text-white"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-dark-400 mt-0.5 truncate">{player.class_archetype || 'Sem classe'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'tables' && (
            <>
              <button
                onClick={() => {
                  audioService.playClick()
                  handleOpenTableNew()
                }}
                className="w-full btn-secondary py-2 justify-center mb-4 text-xs"
              >
                <Plus className="w-4 h-4 mr-2" /> Nova Tabela
              </button>
              
              {tablesList.length === 0 ? (
                <div className="text-center p-4 text-dark-500 text-sm">Nenhuma tabela criada.</div>
              ) : (
                <div className="space-y-1">
                  {tablesList.map((table, idx) => (
                    <div
                      key={table.id}
                      draggable
                      onDragStart={(e) => {
                        audioService.playSlide()
                        setDraggingPlayerIdx(idx) // reusing drag state for simplicity
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragEnd={() => {
                        if (draggingPlayerIdx !== null && dragOverPlayerIdx !== null && draggingPlayerIdx !== dragOverPlayerIdx) {
                          audioService.playPop()
                          reorderTables(draggingPlayerIdx, dragOverPlayerIdx)
                        }
                        setDraggingPlayerIdx(null)
                        setDragOverPlayerIdx(null)
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                        setDragOverPlayerIdx(idx)
                      }}
                      onDragLeave={() => setDragOverPlayerIdx(null)}
                      onClick={() => setActiveTable(table)}
                      style={{
                        opacity: draggingPlayerIdx === idx ? 0.35 : 1,
                        transition: 'opacity 0.15s ease',
                      }}
                      className={`relative p-3 border cursor-pointer transition-colors flex items-center gap-2 select-none ${
                        activeTable?.id === table.id
                          ? 'border-white bg-white/5'
                          : 'border-transparent hover:border-white/20 bg-dark-900'
                      } ${
                        dragOverPlayerIdx === idx && draggingPlayerIdx !== idx
                          ? 'border-t-2 border-t-white/60'
                          : ''
                      }`}
                    >
                      <Hash className="w-4 h-4 text-dark-400" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-white truncate">{table.name}</h4>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenTableEdit(table) }}
                            className="text-dark-400 hover:text-white"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
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
        <PlayerModal editTarget={editPlayerTarget} onClose={() => setPlayerModalOpen(false)} />
      )}
      {sessionModalOpen && (
        <SessionModal editTarget={editSessionTarget} onClose={() => setSessionModalOpen(false)} />
      )}
      {tableModalOpen && (
        <TableModal editTarget={editTableTarget} onClose={() => setTableModalOpen(false)} />
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
    </div>
  )
}
