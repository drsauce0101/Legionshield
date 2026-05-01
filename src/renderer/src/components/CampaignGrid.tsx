import { useMemo } from 'react'
import { Plus, Search, Swords, Loader2 } from 'lucide-react'
import { CampaignCard } from './CampaignCard'
import { useCampaignStore } from '../stores/useCampaignStore'
import type { Campaign } from '../../../types'

interface CampaignGridProps {
  searchQuery: string
  onNewCampaign: () => void
  onEditCampaign: (campaign: Campaign) => void
}

export function CampaignGrid({ searchQuery, onNewCampaign, onEditCampaign }: CampaignGridProps): JSX.Element {
  const { campaigns, isLoading, deleteCampaign, setActiveCampaign } = useCampaignStore()

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return campaigns
    const q = searchQuery.toLowerCase()
    return campaigns.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.system_name ?? '').toLowerCase().includes(q)
    )
  }, [campaigns, searchQuery])

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

  if (campaigns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-5 text-center animate-fade-in max-w-xs">
          {/* Decorative icon */}
          <div className="relative">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-none bg-white border border-white">
              <Swords className="w-9 h-9 text-black" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg mb-1">Nenhuma Campanha</h3>
            <p className="text-dark-400 text-sm leading-relaxed">
              Comece criando sua primeira campanha e organize todas as suas aventuras em um só lugar.
            </p>
          </div>
          <button id="btn-first-campaign" onClick={onNewCampaign} className="btn-primary">
            <Plus className="w-4 h-4" />
            Criar Primeira Campanha
          </button>
        </div>
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center animate-fade-in">
          <Search className="w-10 h-10 text-dark-600" strokeWidth={1} />
          <div>
            <h3 className="text-dark-300 font-medium">Nenhum resultado</h3>
            <p className="text-dark-500 text-sm">Tente buscar por outro nome ou sistema.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      id="campaign-grid"
      className="grid gap-5 p-6 overflow-y-auto"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
    >
      {filtered.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          onEdit={onEditCampaign}
          onDelete={deleteCampaign}
          onClick={setActiveCampaign}
        />
      ))}
    </div>
  )
}
