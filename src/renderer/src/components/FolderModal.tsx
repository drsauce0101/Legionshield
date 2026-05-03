import { useState } from 'react'
import { X, FolderPlus, Save } from 'lucide-react'
import { useCampaignStore } from '../stores/useCampaignStore'
import { audioService } from '../utils/audio'
import type { Folder, FolderFormData } from '../../../types'

interface FolderModalProps {
  editTarget: Folder | null
  type: Folder['type']
  campaignId?: number
  parentFolderId?: number
  onClose: () => void
}

export function FolderModal({ editTarget, type, campaignId, parentFolderId, onClose }: FolderModalProps): JSX.Element {
  const { createFolder, updateFolder } = useCampaignStore()
  const [name, setName] = useState(editTarget?.name || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      if (editTarget) {
        await updateFolder(editTarget.id, { name: name.trim() })
      } else {
        await createFolder({
          name: name.trim(),
          type,
          campaign_id: campaignId,
          parent_id: parentFolderId
        })
      }
      audioService.playPop()
      onClose()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-dark-900 border border-white/20 shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-lg text-dark-300">
              <FolderPlus className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-display font-bold text-white tracking-tight">
              {editTarget ? 'Editar Pasta' : 'Nova Pasta'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-dark-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-1.5 ml-1">
              Nome da Pasta
            </label>
            <input
              type="text"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Campanhas em Andamento"
              className="w-full bg-dark-950 border border-white/10 px-4 py-2.5 text-white placeholder:text-dark-700 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-dark-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-white text-black text-xs font-bold hover:bg-dark-200 active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {editTarget ? 'Salvar Alterações' : 'Criar Pasta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
