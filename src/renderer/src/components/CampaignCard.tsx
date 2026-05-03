import { useState } from 'react'
import { Edit3, Trash2, Sword, Calendar } from 'lucide-react'
import { ConfirmModal } from './ConfirmModal'
import { ContextMenu } from './ContextMenu'
import { useContextMenu } from '../utils/useContextMenu'
import type { Campaign } from '../../../types'

interface CampaignCardProps {
  campaign: Campaign
  onEdit: (campaign: Campaign) => void
  onDelete: (id: number) => void
  onClick: (campaign: Campaign) => void
}

export function CampaignCard({ campaign, onEdit, onDelete, onClick }: CampaignCardProps): JSX.Element {
  const { contextMenuProps, showContextMenu } = useContextMenu()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [imgError, setImgError] = useState(false)

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false)
    setIsDeleting(true)
    await onDelete(campaign.id)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(campaign)
  }

  const hasBanner = campaign.banner_url && !imgError

  return (
    <>
      <article
        id={`campaign-card-${campaign.id}`}
        onClick={() => onClick(campaign)}
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData('itemId', campaign.id.toString())
          e.dataTransfer.setData('itemType', 'campaign')
          e.dataTransfer.effectAllowed = 'move'
        }}
        onContextMenu={(e) => {
          e.stopPropagation()
          showContextMenu(e, [
            { label: 'Editar', icon: <Edit3 className="w-4 h-4" />, onClick: () => onEdit(campaign) },
            { label: 'Excluir', icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDeleteConfirm(true), variant: 'danger' }
          ])
        }}
        className={`
          group relative flex flex-col overflow-hidden rounded-none cursor-pointer
          border border-white/10 hover:border-white/50
          bg-dark-900 hover:bg-dark-800
          transition-all duration-300
          shadow-card hover:shadow-card-hover
          hover:-translate-y-1
          animate-fade-in
          active:scale-95 active:rotate-1
          ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        {/* Banner */}
        <div className="relative w-full h-40 overflow-hidden bg-dark-800 flex-shrink-0">
          {hasBanner ? (
            <img
              src={campaign.banner_url}
              alt={campaign.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            /* Fallback gradient banner */
            <div className="absolute inset-0 bg-dark-800 flex items-center justify-center">
              <Sword className="w-12 h-12 text-dark-500" strokeWidth={1} />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2 p-4">
          <h3 className="text-white font-semibold text-base leading-tight line-clamp-1 group-hover:gradient-text transition-all duration-200">
            {campaign.name}
          </h3>

          {campaign.description && (
            <p className="text-dark-400 text-xs leading-relaxed line-clamp-2 text-select">
              {campaign.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-1">
            {/* System badge */}
            <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-dark-800 border border-white/20 rounded-none px-2.5 py-0.5">
              <Sword className="w-3 h-3" />
              {campaign.system_name ?? 'Genérico'}
            </span>

            {/* Date */}
            {campaign.created_at && (
              <span className="flex items-center gap-1 text-xs text-dark-500">
                <Calendar className="w-3 h-3" />
                {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>

        {/* Bottom glow on hover */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </article>

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="Excluir Campanha"
        message={`Tem certeza que deseja excluir a campanha "${campaign.name}"? Todos os dados associados (jogadores, sessões, notas) serão removidos permanentemente.`}
        confirmText="Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isDanger={true}
      />

      {contextMenuProps.visible && <ContextMenu {...contextMenuProps} />}
    </>
  )
}
