import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useCampaignStore } from '../stores/useCampaignStore'
import { RichTextEditor } from './RichTextEditor'
import type { Player, PlayerFormData } from '../../../types'

interface PlayerModalProps {
  editTarget: Player | null
  onClose: () => void
}

export function PlayerModal({ editTarget, onClose }: PlayerModalProps): JSX.Element {
  const { createPlayer, updatePlayer, activeCampaign } = useCampaignStore()
  
  const [formData, setFormData] = useState<PlayerFormData>({
    name: '',
    class_archetype: '',
    notes: '',
    campaign_id: activeCampaign?.id || 0
  })

  useEffect(() => {
    if (editTarget) {
      setFormData({
        name: editTarget.name,
        class_archetype: editTarget.class_archetype,
        notes: editTarget.notes,
        campaign_id: editTarget.campaign_id
      })
    }
  }, [editTarget])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      if (editTarget) {
        await updatePlayer(editTarget.id, formData)
      } else {
        await createPlayer(formData)
      }
      onClose()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-dark-900 border border-white/20 shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <h2 className="font-display font-semibold text-xl tracking-wide text-white">
            {editTarget ? 'Editar Jogador' : 'Novo Jogador'}
          </h2>
          <button onClick={onClose} className="p-2 text-dark-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form id="player-form" onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold tracking-wider text-dark-300 uppercase">
                Nome do Jogador/Personagem *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input-field w-full text-select"
                placeholder="Ex: Gandalf"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs font-semibold tracking-wider text-dark-300 uppercase">
                Classe / Arquétipo
              </label>
              <input
                type="text"
                value={formData.class_archetype}
                onChange={(e) => setFormData(prev => ({ ...prev, class_archetype: e.target.value }))}
                className="input-field w-full text-select"
                placeholder="Ex: Mago Nível 20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold tracking-wider text-dark-300 uppercase">
              Anotações do Personagem
            </label>
            <RichTextEditor 
              content={formData.notes} 
              onChange={(notes) => setFormData(prev => ({ ...prev, notes }))} 
              placeholder="Descreva o background, inventário, etc..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-dark-950 shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" form="player-form" className="btn-primary">
            {editTarget ? 'Salvar Alterações' : 'Criar Jogador'}
          </button>
        </div>
      </div>
    </div>
  )
}
