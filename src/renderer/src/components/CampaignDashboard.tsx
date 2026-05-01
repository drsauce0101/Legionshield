import React, { useEffect, useState } from 'react'
import { ArrowLeft, Users, BookOpen, Plus, Settings, X } from 'lucide-react'
import { useCampaignStore } from '../stores/useCampaignStore'
import { DiceRoller } from './DiceRoller'
import { PlayerModal } from './PlayerModal'
import { SessionModal } from './SessionModal'
import { RichTextEditor } from './RichTextEditor'
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
    updatePlayer
  } = useCampaignStore()

  const [activeTab, setActiveTab] = useState<'sessions' | 'players'>('sessions')
  
  // Modals state
  const [playerModalOpen, setPlayerModalOpen] = useState(false)
  const [editPlayerTarget, setEditPlayerTarget] = useState<Player | null>(null)
  
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [editSessionTarget, setEditSessionTarget] = useState<Session | null>(null)

  const [presentPlayerIds, setPresentPlayerIds] = useState<number[]>([])
  const [previewPlayer, setPreviewPlayer] = useState<Player | null>(null)

  // Generate mentionable items
  const mentionItems: MentionItem[] = React.useMemo(() => {
    return [
      ...playersList.map(p => ({ id: `player_${p.id}`, label: p.name, type: 'player' as const, avatar_url: p.avatar_url })),
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
    }
  }, [activeCampaign, fetchPlayers, fetchSessions])

  useEffect(() => {
    if (activeSession) {
      window.api.sessions.getPresentPlayers(activeSession.id)
        .then(setPresentPlayerIds)
        .catch(console.error)
    } else {
      setPresentPlayerIds([])
    }
  }, [activeSession?.id])

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

  // Handle auto-save for session notes
  const handleSessionNotesChange = (notes: string) => {
    if (activeSession) {
      // In a real scenario we'd debounce this. For now we just update
      // Since updateSession requires playerIds, we fetch them or just don't update players here
      window.api.sessions.getPresentPlayers(activeSession.id).then(playerIds => {
        updateSession(activeSession.id, { notes }, playerIds)
      })
    }
  }

  if (!activeCampaign) return <div className="p-8 text-white">Nenhuma campanha selecionada.</div>

  return (
    <div className="flex flex-1 min-h-0 relative">
      {/* ── Dice Layer (Overlay) ────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <DiceRoller />
      </div>

      {/* ── Sidebar (Players / Sessions) ─────────────────────────────────── */}
      <aside className="w-80 border-r border-white/20 bg-dark-950 flex flex-col z-20 shrink-0 relative">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 hover:bg-white/10 text-dark-300 hover:text-white transition-colors" title="Voltar para Home">
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
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 py-3 text-xs tracking-wider uppercase font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'sessions' ? 'border-b-2 border-white text-white' : 'text-dark-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Sessões
          </button>
          <button 
            onClick={() => setActiveTab('players')}
            className={`flex-1 py-3 text-xs tracking-wider uppercase font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'players' ? 'border-b-2 border-white text-white' : 'text-dark-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            Jogadores
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {activeTab === 'sessions' && (
            <>
              <button onClick={handleOpenSessionNew} className="w-full btn-secondary py-2 justify-center mb-4 text-xs">
                <Plus className="w-4 h-4 mr-2" /> Nova Sessão
              </button>
              
              {sessionsList.length === 0 ? (
                <div className="text-center p-4 text-dark-500 text-sm">Nenhuma sessão criada.</div>
              ) : (
                sessionsList.map(session => (
                  <div 
                    key={session.id}
                    onClick={() => setActiveSession(session)}
                    className={`p-3 border cursor-pointer transition-colors ${
                      activeSession?.id === session.id 
                        ? 'border-white bg-white/5' 
                        : 'border-transparent hover:border-white/20 bg-dark-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white truncate">{session.title}</h4>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenSessionEdit(session) }}
                        className="text-dark-400 hover:text-white"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
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
            </>
          )}

          {activeTab === 'players' && (
            <>
              <button onClick={handleOpenPlayerNew} className="w-full btn-secondary py-2 justify-center mb-4 text-xs">
                <Plus className="w-4 h-4 mr-2" /> Novo Jogador
              </button>
              
              {playersList.length === 0 ? (
                <div className="text-center p-4 text-dark-500 text-sm">Nenhum jogador criado.</div>
              ) : (
                playersList.map(player => (
                  <div 
                    key={player.id}
                    onClick={() => setActivePlayer(player)}
                    className={`p-3 border cursor-pointer transition-colors flex items-center gap-3 ${
                      activePlayer?.id === player.id 
                        ? 'border-white bg-white/5' 
                        : 'border-transparent hover:border-white/20 bg-dark-900'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 flex-shrink-0 bg-dark-950 border border-white/20 flex items-center justify-center overflow-hidden">
                      {player.avatar_url ? (
                        <img src={player.avatar_url} alt={player.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-dark-500 font-display font-bold text-lg leading-none uppercase">
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
                      <p className="text-xs text-dark-400 mt-1 truncate">{player.class_archetype || 'Sem classe'}</p>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </aside>

      {/* ── Main Content (Editor) ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col bg-dark-900 relative z-20">
        {!activeSession && !activePlayer ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-dark-400 animate-fade-in">
            <BookOpen className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-display text-white mb-2">Modo de Jogo</h3>
            <p className="max-w-md">Selecione uma sessão ou um jogador na lateral para visualizar ou editar as anotações. Você pode usar o espaço para escrever registros da aventura.</p>
          </div>
        ) : activeSession ? (
          <div className="flex-1 flex flex-col animate-fade-in" key={`session-${activeSession.id}`}>
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
              <div className="max-w-4xl mx-auto">
                <RichTextEditor 
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
          <div className="flex-1 flex flex-col animate-fade-in" key={`player-${activePlayer.id}`}>
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
              <div className="max-w-4xl mx-auto">
                <RichTextEditor 
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

      {/* ── Player Preview Modal ─────────────────────────────────────────── */}
      {previewPlayer && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setPreviewPlayer(null)}
        >
          <div 
            className="w-full max-w-lg bg-dark-900 border border-white/20 shadow-2xl flex flex-col p-8 animate-slide-up relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setPreviewPlayer(null)} 
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
            
            {/* Notes Preview */}
            <div className="mt-8 border-t border-white/10 pt-6">
              <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-4">Anotações do Personagem</h4>
              <div className="bg-dark-950 border border-white/10 p-4 max-h-60 overflow-y-auto w-full">
                {previewPlayer.notes ? (
                  <div 
                    className="prose prose-invert prose-p:leading-relaxed prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewPlayer.notes }} 
                  />
                ) : (
                  <p className="text-dark-500 text-sm italic">Nenhuma anotação registrada.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
