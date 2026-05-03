import { useState, useEffect } from 'react'
import { X, Save, Plus, Trash2, Hash, FileText } from 'lucide-react'
import { useCampaignStore } from '../stores/useCampaignStore'
import { audioService } from '../utils/audio'
import { ConfirmModal } from './ConfirmModal'
import type { Table, TableRow } from '../../../types'

interface TableModalProps {
  editTarget: Table | null
  defaultFolderId?: number | null
  onClose: () => void
}

export function TableModal({ editTarget, defaultFolderId, onClose }: TableModalProps): JSX.Element {
  const { activeCampaign, createTable, updateTable, deleteTable, folders, fetchFolders } = useCampaignStore()
  
  const [name, setName] = useState(editTarget?.name || '')
  const [description, setDescription] = useState(editTarget?.description || '')
  const [folderId, setFolderId] = useState<number | undefined>(editTarget?.folder_id || defaultFolderId || undefined)
  const [rows, setRows] = useState<TableRow[]>(() => {
    if (editTarget?.content) {
      try {
        return JSON.parse(editTarget.content)
      } catch {
        return []
      }
    }
    return [{ range: '1', content: '' }]
  })

  useEffect(() => {
    if (activeCampaign) {
      fetchFolders('table', activeCampaign.id)
    }
  }, [activeCampaign, fetchFolders])

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleAddRow = () => {
    audioService.playClick()
    setRows([...rows, { range: '', content: '' }])
  }

  const handleRemoveRow = (index: number) => {
    audioService.playClick()
    setRows(rows.filter((_, i) => i !== index))
  }

  const handleRowChange = (index: number, field: keyof TableRow, value: string) => {
    const newRows = [...rows]
    newRows[index][field] = value
    setRows(newRows)
  }

  const handleSave = async () => {
    if (!name.trim() || !activeCampaign) return

    const data = {
      name: name.trim(),
      description: description.trim(),
      content: JSON.stringify(rows),
      campaign_id: activeCampaign.id,
      folder_id: folderId
    }

    try {
      if (editTarget) {
        await updateTable(editTarget.id, data)
      } else {
        await createTable(data)
      }
      audioService.playPop()
      onClose()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (!editTarget) return
    try {
      await deleteTable(editTarget.id)
      audioService.playPop()
      onClose()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div 
          className="w-full max-w-2xl max-h-[90vh] bg-dark-900 border border-white/20 shadow-2xl animate-slide-up flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg text-dark-300">
                <Hash className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-display font-bold text-white tracking-tight">
                {editTarget ? 'Editar Tabela' : 'Nova Tabela'}
              </h3>
            </div>
            <button onClick={onClose} className="p-2 text-dark-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-1.5 ml-1">Nome da Tabela</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Tabela de Encontros Aleatórios"
                  className="w-full bg-dark-950 border border-white/10 px-4 py-2.5 text-white placeholder:text-dark-700 focus:outline-none focus:border-white/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-1.5 ml-1">Descrição (opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="O que esta tabela faz?"
                  rows={2}
                  className="w-full bg-dark-950 border border-white/10 px-4 py-2.5 text-white placeholder:text-dark-700 focus:outline-none focus:border-white/30 transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-1.5 ml-1">Pasta</label>
                <select
                  value={folderId || ''}
                  onChange={(e) => setFolderId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-dark-950 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-white/30 transition-all"
                >
                  <option value="">Sem pasta (Raiz)</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-bold text-dark-500 uppercase tracking-widest">Conteúdo da Tabela</label>
                <button 
                  onClick={handleAddRow}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-white hover:text-dark-300 transition-colors uppercase tracking-widest"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Linha
                </button>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-[80px_1fr_40px] gap-3 px-1 text-[9px] font-bold text-dark-600 uppercase tracking-widest">
                  <span>Range</span>
                  <span>Resultado</span>
                  <span></span>
                </div>
                {rows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-[80px_1fr_40px] gap-3 group animate-fade-in">
                    <input
                      type="text"
                      value={row.range}
                      onChange={(e) => handleRowChange(idx, 'range', e.target.value)}
                      placeholder="1-10"
                      className="bg-dark-950 border border-white/10 px-2 py-2 text-sm text-white text-center focus:outline-none focus:border-white/30 transition-all font-mono"
                    />
                    <input
                      type="text"
                      value={row.content}
                      onChange={(e) => handleRowChange(idx, 'content', e.target.value)}
                      placeholder="Encontro com um goblin..."
                      className="bg-dark-950 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                    />
                    <button 
                      onClick={() => handleRemoveRow(idx)}
                      className="flex items-center justify-center text-dark-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
            {editTarget && (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-red-500 hover:text-white hover:bg-red-600 transition-all uppercase tracking-widest mr-auto"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir Tabela
              </button>
            )}
            <button onClick={onClose} className="px-5 py-2 text-xs font-bold text-dark-400 hover:text-white transition-colors">
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-white text-black text-xs font-bold hover:bg-dark-200 active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Salvar Tabela
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="Excluir Tabela"
        message={`Tem certeza que deseja excluir a tabela "${name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isDanger={true}
      />
    </>
  )
}
