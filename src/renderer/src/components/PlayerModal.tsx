import React, { useState, useEffect } from 'react'
import { X, Image, Trash2 } from 'lucide-react'
import { useCampaignStore } from '../stores/useCampaignStore'
import { MultiTabEditor } from './MultiTabEditor'
import { ConfirmModal } from './ConfirmModal'
import type { Player, PlayerFormData, MentionItem, PlayerAttribute } from '../../../types'

interface PlayerModalProps {
  editTarget: Player | null
  onClose: () => void
}

export function PlayerModal({ editTarget, onClose }: PlayerModalProps): JSX.Element {
  const { createPlayer, updatePlayer, deletePlayer, activeCampaign, playersList, sessionsList } = useCampaignStore()
  
  const [formData, setFormData] = useState<PlayerFormData>({
    name: editTarget?.name || '',
    class_archetype: editTarget?.class_archetype || '',
    notes: editTarget?.notes || '',
    avatar_url: editTarget?.avatar_url || '',
    campaign_id: editTarget?.campaign_id || activeCampaign?.id || 0
  })

  const [attributes, setAttributes] = useState<PlayerAttribute[]>(() => {
    try {
      return editTarget?.attributes ? JSON.parse(editTarget.attributes) : []
    } catch {
      return []
    }
  })

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    setFormData(prev => ({ ...prev, attributes: JSON.stringify(attributes) }))
  }, [attributes])

  const handleSelectImage = async () => {
    try {
      const url = await window.api.system.selectImage()
      if (url) {
        setFormData(prev => ({ ...prev, avatar_url: url }))
      }
    } catch (err) {
      console.error(err)
    }
  }

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

  const handleDelete = async () => {
    if (!editTarget) return
    try {
      await deletePlayer(editTarget.id)
      onClose()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-5xl bg-dark-900 border border-white/20 shadow-2xl animate-slide-up flex flex-col h-full max-h-[90vh]">
          
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
          <form id="player-form" onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-6 flex flex-col">
            <div className="grid grid-cols-2 gap-6 shrink-0">
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

            <div className="space-y-2 shrink-0">
              <label className="block text-xs font-semibold tracking-wider text-dark-300 uppercase">
                Foto de Perfil
              </label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex-shrink-0 bg-dark-950 border border-white/20 flex items-center justify-center overflow-hidden">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-dark-600 text-xs text-center leading-none">Sem<br/>Foto</span>
                  )}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={formData.avatar_url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                    className="input-field w-full text-select flex-1"
                    placeholder="URL ou arquivo local..."
                  />
                  <button
                    type="button"
                    onClick={handleSelectImage}
                    className="px-3 py-2 bg-dark-800 border border-white/20 text-white hover:bg-dark-700 transition-colors flex items-center justify-center"
                    title="Selecionar imagem do computador"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold tracking-wider text-dark-300 uppercase">
                  Atributos / Status
                </label>
                <button 
                  type="button" 
                  onClick={() => setAttributes(prev => [...prev, { name: '', value: '' }])}
                  className="text-xs text-dark-400 hover:text-white transition-colors flex items-center gap-1 font-semibold"
                >
                  + Adicionar Atributo
                </button>
              </div>
              
              {attributes.length > 0 && (
                <div className="space-y-2">
                  {attributes.map((attr, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={attr.name}
                        onChange={(e) => {
                          const newAttrs = [...attributes]
                          newAttrs[index].name = e.target.value
                          setAttributes(newAttrs)
                        }}
                        className="input-field w-1/3 text-sm py-1.5"
                        placeholder="Nome (ex: HP)"
                      />
                      <input
                        type="text"
                        value={attr.value}
                        onChange={(e) => {
                          const newAttrs = [...attributes]
                          newAttrs[index].value = e.target.value
                          setAttributes(newAttrs)
                        }}
                        className="input-field w-1/3 text-sm py-1.5"
                        placeholder="Valor (ex: 10)"
                      />
                      <span className="text-dark-400">/</span>
                      <input
                        type="text"
                        value={attr.max_value || ''}
                        onChange={(e) => {
                          const newAttrs = [...attributes]
                          newAttrs[index].max_value = e.target.value
                          setAttributes(newAttrs)
                        }}
                        className="input-field w-1/4 text-sm py-1.5"
                        placeholder="Max (Opcional)"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newAttrs = [...attributes]
                          newAttrs.splice(index, 1)
                          setAttributes(newAttrs)
                        }}
                        className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors ml-auto flex-shrink-0"
                        title="Remover atributo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1 flex flex-col min-h-[300px]">
              <label className="block text-xs font-semibold tracking-wider text-dark-300 uppercase shrink-0">
                Anotações do Personagem
              </label>
              <MultiTabEditor 
                content={formData.notes} 
                onChange={(notes) => setFormData(prev => ({ ...prev, notes }))} 
                placeholder="Descreva o background, inventário, etc..."
                mentionItems={mentionItems}
                onMentionClick={handleMentionClick}
              />
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-dark-950 shrink-0">
            {editTarget && (
              <button 
                type="button" 
                onClick={() => setShowDeleteConfirm(true)} 
                className="btn-danger mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Excluir Jogador
              </button>
            )}
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" form="player-form" className="btn-primary">
              {editTarget ? 'Salvar Alterações' : 'Criar Jogador'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="Excluir Jogador"
        message={`Tem certeza que deseja excluir o jogador "${formData.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isDanger={true}
      />
    </>
  )
}
