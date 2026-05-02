import { useEffect, useState } from 'react'
import { Plus, Search, Shield, Settings } from 'lucide-react'
import { TitleBar } from './components/TitleBar'
import { CampaignGrid } from './components/CampaignGrid'
import { CampaignDashboard } from './components/CampaignDashboard'
import { NewCampaignModal } from './components/NewCampaignModal'
import { LoadingScreen } from './components/LoadingScreen'
import { SettingsModal } from './components/SettingsModal'
import { useCampaignStore } from './stores/useCampaignStore'
import type { Campaign } from '../../types'

export default function App(): JSX.Element {
  const { fetchCampaigns, campaigns, error, clearError, activeCampaign, setActiveCampaign } = useCampaignStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Campaign | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAppLoading, setIsAppLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchCampaigns(),
      new Promise((resolve) => setTimeout(resolve, 1500)) // Artificial delay to show the loading screen
    ]).finally(() => {
      setIsAppLoading(false)
    })
  }, [fetchCampaigns])

  const handleOpenNew = () => {
    setEditTarget(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (campaign: Campaign) => {
    setEditTarget(campaign)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditTarget(null)
  }

  return (
    <div className="flex flex-col h-screen bg-dark-950 overflow-hidden">
      <LoadingScreen isVisible={isAppLoading} />

      {/* Custom Title Bar */}
      <TitleBar />

      {/* Error Banner */}
      {error && (
        <div
          id="error-banner"
          className="flex items-center justify-between px-6 py-3 bg-red-500/15 border-b border-red-500/30 text-red-300 text-sm animate-fade-in shrink-0 z-50"
        >
          <span>⚠ {error}</span>
          <button onClick={clearError} className="text-red-400 hover:text-white text-xs underline no-drag">
            Fechar
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {activeCampaign ? (
        <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
          <CampaignDashboard onBack={() => setActiveCampaign(null)} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-y-auto animate-fade-in">
          {/* Hero / Toolbar */}
          <div className="relative flex-shrink-0 px-6 pt-6 pb-4 border-b border-white/20 bg-dark-950">
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-none bg-white border border-white/20">
                  <Shield className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h1 className="gradient-text font-display font-semibold text-xl tracking-wide">
                    Campanhas
                  </h1>
                  <p className="text-dark-400 text-xs">
                    {campaigns.length} {campaigns.length === 1 ? 'campanha' : 'campanhas'} salvas
                  </p>
                </div>
              </div>

              {/* Search + New Campaign */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
                  <input
                    id="input-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar campanhas..."
                    className="input-field pl-9 w-56 text-select"
                  />
                </div>
                <button id="btn-new-campaign" onClick={handleOpenNew} className="btn-primary">
                  <Plus className="w-4 h-4" />
                  Nova Campanha
                </button>
                <button
                  id="btn-settings"
                  onClick={() => setSettingsOpen(true)}
                  title="Configurações"
                  className="flex items-center justify-center w-9 h-9 border border-white/20 text-dark-400 hover:text-white hover:bg-white/10 hover:border-white/40 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Campaign Grid */}
          <main className="flex flex-1 min-h-0">
            <CampaignGrid
              searchQuery={searchQuery}
              onNewCampaign={handleOpenNew}
              onEditCampaign={handleOpenEdit}
            />
          </main>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <NewCampaignModal
          editTarget={editTarget}
          onClose={handleCloseModal}
        />
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  )
}
