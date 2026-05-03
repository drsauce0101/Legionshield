import { useMemo, useState, useEffect } from 'react'
import { Plus, Search, Swords, Loader2, FolderPlus, ArrowLeft } from 'lucide-react'
import { CampaignCard } from './CampaignCard'
import { FolderCard } from './FolderCard'
import { FolderModal } from './FolderModal'
import { ContextMenu } from './ContextMenu'
import { useContextMenu } from '../utils/useContextMenu'
import { useCampaignStore } from '../stores/useCampaignStore'
import type { Campaign, Folder } from '../../../types'

interface CampaignGridProps {
  searchQuery: string
  onNewCampaign: () => void
  onEditCampaign: (campaign: Campaign) => void
}

export function CampaignGrid({ searchQuery, onNewCampaign, onEditCampaign }: CampaignGridProps): JSX.Element {
  const { campaigns, folders, isLoading, deleteCampaign, setActiveCampaign, fetchFolders, deleteFolder, updateCampaign, updateFolder } = useCampaignStore()
  const { contextMenuProps, showContextMenu } = useContextMenu()
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null)
  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [folderEditTarget, setFolderEditTarget] = useState<Folder | null>(null)

  useEffect(() => {
    fetchFolders('campaign')
  }, [fetchFolders])

  const folderItemCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    folders.forEach(f => {
      // Count subfolders
      const subFolders = folders.filter(sf => sf.parent_id === f.id).length
      // Count campaigns
      const subCampaigns = campaigns.filter(c => c.folder_id === f.id).length
      counts[f.id] = subFolders + subCampaigns
    })
    return counts
  }, [folders, campaigns])

  const handleItemDrop = async (itemId: string, itemType: string, targetFolderId: number) => {
    const id = Number(itemId)
    if (itemType === 'campaign') {
      await updateCampaign(id, { folder_id: targetFolderId })
    } else if (itemType === 'folder') {
      // Prevent moving a folder into itself or its own children (simplified check)
      if (id === targetFolderId) return
      await updateFolder(id, { parent_id: targetFolderId })
    }
  }

  const currentFolder = useMemo(() => 
    folders.find(f => f.id === currentFolderId), [folders, currentFolderId]
  )

  const filteredFolders = useMemo(() => {
    const base = folders.filter(f => (f.parent_id || null) === currentFolderId)
    if (!searchQuery.trim()) return base
    return base.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [folders, currentFolderId, searchQuery])

  const filteredCampaigns = useMemo(() => {
    const base = campaigns.filter(c => (c.folder_id || null) === currentFolderId)
    if (!searchQuery.trim()) return base
    const q = searchQuery.toLowerCase()
    return base.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.system_name ?? '').toLowerCase().includes(q)
    )
  }, [campaigns, currentFolderId, searchQuery])

  const handleOpenFolderModal = (editTarget: Folder | null = null) => {
    setFolderEditTarget(editTarget)
    setFolderModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-dark-400">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
          <p className="text-sm">Carregando campanhas...</p>
        </div>
      </div>
    )
  }

  const isEmpty = campaigns.length === 0 && folders.length === 0

  if (isEmpty) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-5 text-center animate-fade-in max-w-xs">
            <div className="relative">
              <div className="relative flex items-center justify-center w-20 h-20 rounded-none bg-white border border-white">
                <Swords className="w-9 h-9 text-black" strokeWidth={1.5} />
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-1">Nenhuma Campanha</h3>
              <p className="text-dark-400 text-sm leading-relaxed">
                Comece criando sua primeira campanha ou uma pasta para organizá-las.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full text-dark-500 italic text-xs">
              Dica: Clique com o botão direito aqui para criar.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Grid Toolbar */}
      <div className="px-6 py-2 border-b border-white/5 flex items-center justify-between shrink-0 bg-dark-900/50">
        <div className="flex items-center gap-2">
          {currentFolderId && (
            <button 
              onClick={() => setCurrentFolderId(currentFolder?.parent_id || null)}
              className="p-1.5 text-dark-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-bold text-dark-500 uppercase tracking-widest">
            {currentFolder ? `Pasta: ${currentFolder.name}` : 'Raiz'}
          </span>
        </div>
      </div>

      <div
        id="campaign-grid"
        className="flex-1 overflow-y-auto content-start"
        onContextMenu={(e) => {
          showContextMenu(e, [
            { label: 'Nova Campanha', icon: <Plus className="w-4 h-4" />, onClick: () => onNewCampaign(currentFolderId) },
            { label: 'Nova Pasta', icon: <FolderPlus className="w-4 h-4" />, onClick: () => handleOpenFolderModal() }
          ])
        }}
      >
        <div 
          className="grid gap-5 p-6"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
        >
        {filteredFolders.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            itemCount={folderItemCounts[folder.id]}
            onEdit={handleOpenFolderModal}
            onDelete={deleteFolder}
            onClick={(f) => setCurrentFolderId(f.id)}
            onDrop={handleItemDrop}
          />
        ))}

        {filteredCampaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            onEdit={onEditCampaign}
            onDelete={deleteCampaign}
            onClick={setActiveCampaign}
          />
        ))}

        {filteredCampaigns.length === 0 && filteredFolders.length === 0 && searchQuery && (
           <div className="col-span-full py-20 text-center">
             <Search className="w-10 h-10 text-dark-600 mx-auto mb-3" strokeWidth={1} />
             <h3 className="text-dark-300 font-medium">Nenhum resultado</h3>
             <p className="text-dark-500 text-sm">Tente buscar por outro nome.</p>
           </div>
        )}
      </div>

      {folderModalOpen && (
        <FolderModal
          editTarget={folderEditTarget}
          type="campaign"
          campaignId={undefined}
          parentFolderId={currentFolderId || undefined}
          onClose={() => setFolderModalOpen(false)}
        />
      )}

      {contextMenuProps.visible && <ContextMenu {...contextMenuProps} />}
    </div>
  </div>
  )
}
