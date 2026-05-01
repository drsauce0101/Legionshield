import React, { useEffect, useState } from 'react'
import { ArrowLeft, Users, BookOpen, Plus, Settings } from 'lucide-react'
import { useCampaignStore } from '../stores/useCampaignStore'
import { DiceRoller } from './DiceRoller'
import { PlayerModal } from './PlayerModal'
import { SessionModal } from './SessionModal'
import { RichTextEditor } from './RichTextEditor'
import type { Player, Session } from '../../../types'

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
    updateSession
  } = useCampaignStore()

  const [activeTab, setActiveTab] = useState<'sessions' | 'players'>('sessions')
  
  // Modals state
  const [playerModalOpen, setPlayerModalOpen] = useState(false)
  const [editPlayerTarget, setEditPlayerTarget] = useState<Player | null>(null)
  
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [editSessionTarget, setEditSessionTarget] = useState<Session | null>(null)

  useEffect(() => {
    if (activeCampaign) {
      fetchPlayers(activeCampaign.id)
      fetchSessions(activeCampaign.id)
    }
  }, [activeCampaign, fetchPlayers, fetchSessions])

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
                    onClick={() => handleOpenPlayerEdit(player)}
                    className="p-3 border border-transparent hover:border-white/20 bg-dark-900 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white truncate">{player.name}</h4>
                    </div>
                    <p className="text-xs text-dark-400 mt-1">{player.class_archetype || 'Sem classe'}</p>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </aside>

      {/* ── Main Content (Editor) ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col bg-dark-900 relative z-20">
        {!activeSession ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-dark-400">
            <BookOpen className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-display text-white mb-2">Modo de Jogo</h3>
            <p className="max-w-md">Selecione uma sessão na lateral para visualizar ou editar as anotações. Você pode usar o espaço para escrever registros da aventura.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <header className="p-8 pb-4 shrink-0 border-b border-white/5">
              <h1 className="text-3xl font-display font-bold text-white mb-2">{activeSession.title}</h1>
              <div className="flex gap-2">
                 {activeSession.tags?.split(',').filter(Boolean).map((t, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-dark-950 border border-white/10 text-dark-300">
                      {t.trim()}
                    </span>
                  ))}
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-8">
              {/* Note: In a real app we want to debounce the onChange so we don't spam the DB */}
              <div className="max-w-4xl mx-auto">
                <RichTextEditor 
                  content={activeSession.notes} 
                  onChange={handleSessionNotesChange} 
                  placeholder="A aventura continua..."
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {playerModalOpen && (
        <PlayerModal editTarget={editPlayerTarget} onClose={() => setPlayerModalOpen(false)} />
      )}
      {sessionModalOpen && (
        <SessionModal editTarget={editSessionTarget} onClose={() => setSessionModalOpen(false)} />
      )}
    </div>
  )
}
