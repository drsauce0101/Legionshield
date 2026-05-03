import { useState } from 'react'
import { Folder, Edit3, Trash2, FolderOpen, Box } from 'lucide-react'
import { ConfirmModal } from './ConfirmModal'
import { ContextMenu } from './ContextMenu'
import { useContextMenu } from '../utils/useContextMenu'
import type { Folder as FolderType } from '../../../types'

interface FolderCardProps {
  folder: FolderType
  itemCount?: number
  onEdit: (folder: FolderType) => void
  onDelete: (id: number) => void
  onClick: (folder: FolderType) => void
  onDrop?: (itemId: string, itemType: string, targetFolderId: number) => void
}

export function FolderCard({ folder, itemCount = 0, onEdit, onDelete, onClick, onDrop }: FolderCardProps): JSX.Element {
  const { contextMenuProps, showContextMenu } = useContextMenu()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const itemId = e.dataTransfer.getData('itemId')
    const itemType = e.dataTransfer.getData('itemType')
    
    if (itemId && itemType && onDrop) {
      onDrop(itemId, itemType, folder.id)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(folder)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  return (
    <>
      <div
        onClick={() => onClick(folder)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData('itemId', folder.id.toString())
          e.dataTransfer.setData('itemType', 'folder')
          e.dataTransfer.effectAllowed = 'move'
        }}
        onContextMenu={(e) => {
          e.stopPropagation()
          showContextMenu(e, [
            { label: 'Renomear', icon: <Edit3 className="w-4 h-4" />, onClick: () => onEdit(folder) },
            { label: 'Excluir', icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDeleteConfirm(true), variant: 'danger' }
          ])
        }}
        className={`
          group relative flex items-center gap-3 p-4 border transition-all cursor-pointer select-none animate-fade-in
          ${isDragOver 
            ? 'bg-white/10 border-white scale-[1.02] shadow-2xl z-10' 
            : 'bg-dark-900 border-white/10 hover:border-white/40 hover:bg-dark-800'
          }
        `}
      >
        <div className={`
          flex items-center justify-center w-10 h-10 transition-colors
          ${isDragOver ? 'bg-white text-black' : 'bg-white/5 group-hover:bg-white/10'}
        `}>
          {isDragOver ? (
            <FolderOpen className="w-5 h-5" />
          ) : itemCount > 0 ? (
            <Box className="w-5 h-5 text-dark-300 group-hover:text-white transition-colors" />
          ) : (
            <Folder className="w-5 h-5 text-dark-300 group-hover:text-white transition-colors" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white truncate group-hover:gradient-text transition-all">
              {folder.name}
            </h3>
            {itemCount > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 bg-white/10 text-dark-300 font-bold rounded-full">
                {itemCount}
              </span>
            )}
          </div>
          <p className="text-[10px] text-dark-500 uppercase tracking-widest font-bold">Pasta</p>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Excluir Pasta"
        message={`Tem certeza que deseja excluir a pasta "${folder.name}"? Todos os itens dentro dela serão movidos para a pasta principal.`}
        confirmText="Excluir"
        onConfirm={() => {
          setShowDeleteConfirm(false)
          onDelete(folder.id)
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        isDanger={true}
      />

      {contextMenuProps.visible && <ContextMenu {...contextMenuProps} />}
    </>
  )
}
