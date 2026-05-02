import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useCampaignStore } from '../stores/useCampaignStore'
import { MultiTabEditor } from './MultiTabEditor'
import type { Session, SessionFormData, MentionItem } from '../../../types'

interface SessionModalProps {
  editTarget: Session | null
  onClose: () => void
}

export function SessionModal({ editTarget, onClose }: SessionModalProps): JSX.Element {
  const { createSession, updateSession, activeCampaign, playersList, sessionsList } = useCampaignStore()
  
  const [formData, setFormData] = useState<SessionFormData>({
    title: editTarget?.title || '',
    tags: editTarget?.tags || '',
    notes: editTarget?.notes || '',
    campaign_id: editTarget?.campaign_id || activeCampaign?.id || 0
  })
  
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([])

  useEffect(() => {
    if (editTarget) {
      // fetch present players for editTarget
      window.api.sessions.getPresentPlayers(editTarget.id).then(setSelectedPlayers).catch(console.error)
    }
  }, [editTarget])

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
    const store = useCampaignStore.getState()

    if (type === 'player') {
      const player = playersList.find(p => p.id === numericId)
      if (player) {
        store.setActivePlayer(player)
        onClose()
      }
    } else if (type === 'session') {
      const session = sessionsList.find(s => s.id === numericId)
      if (session) {
        store.setActiveSession(session)
        onClose()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    try {
      if (editTarget) {
        await updateSession(editTarget.id, formData, selectedPlayers)
      } else {
        await createSession(formData, selectedPlayers)
      }
      onClose()
    } catch (err) {
      console.error(err)
    }
  }

  const togglePlayer = (id: number) => {
    setSelectedPlayers(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-6xl bg-dark-900 border border-white/20 shadow-2xl animate-slide-up flex flex-col h-full max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <h2 className="font-display font-semibold text-xl tracking-wide text-white">
            {editTarget ? 'Editar Sessão' : 'Nova Sessão'}
          </h2>
          <button onClick={onClose} className="p-2 text-dark-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form id="session-form" onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-6 flex flex-col">
          <div className="grid grid-cols-2 gap-6 shrink-0">
            <div className="space-y-2">
              <label className="block text-xs font-semibold tracking-wider text-dark-300 uppercase">
                Título da Sessão *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="input-field w-full text-select"
                placeholder="Ex: Sessão 01 - A Taverna"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs font-semibold tracking-wider text-dark-300 uppercase">
                Tags (Separadas por vírgula)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="input-field w-full text-select"
                placeholder="Ex: Combate, Boss, Lore"
              />
            </div>
          </div>

          <div className="space-y-2 shrink-0">
            <label className="block text-xs font-semibold tracking-wider text-dark-300 uppercase">
              Jogadores Presentes
            </label>
            <div className="flex flex-wrap gap-2">
              {playersList.length === 0 ? (
                <span className="text-dark-400 text-sm">Nenhum jogador cadastrado nesta campanha.</span>
              ) : (
                playersList.map(player => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => togglePlayer(player.id)}
                    className={`px-3 py-1.5 text-sm border transition-colors ${
                      selectedPlayers.includes(player.id)
                        ? 'border-white bg-white text-black'
                        : 'border-white/20 bg-dark-950 text-dark-300 hover:text-white hover:border-white/50'
                    }`}
                  >
                    {player.name}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2 flex-1 flex flex-col min-h-[300px]">
            <label className="block text-xs font-semibold tracking-wider text-dark-300 uppercase shrink-0">
              Resumo / Notas da Sessão
            </label>
            <MultiTabEditor 
              content={formData.notes} 
              onChange={(notes) => setFormData(prev => ({ ...prev, notes }))} 
              placeholder="O que aconteceu nesta sessão?"
              mentionItems={mentionItems}
              onMentionClick={handleMentionClick}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-dark-950 shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" form="session-form" className="btn-primary">
            {editTarget ? 'Salvar Sessão' : 'Criar Sessão'}
          </button>
        </div>
      </div>
    </div>
  )
}
