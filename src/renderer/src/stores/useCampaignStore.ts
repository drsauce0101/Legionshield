import { create } from 'zustand'
import type { Campaign, CampaignFormData, RPGSystem } from '../../../types'

interface CampaignStore {
  // State
  campaigns: Campaign[]
  systems: RPGSystem[]
  activeCampaign: Campaign | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchCampaigns: () => Promise<void>
  fetchSystems: () => Promise<void>
  createCampaign: (data: CampaignFormData) => Promise<Campaign>
  updateCampaign: (id: number, data: Partial<CampaignFormData>) => Promise<void>
  deleteCampaign: (id: number) => Promise<void>
  setActiveCampaign: (campaign: Campaign | null) => void
  clearError: () => void
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
  campaigns: [],
  systems: [],
  activeCampaign: null,
  isLoading: false,
  error: null,

  fetchCampaigns: async () => {
    set({ isLoading: true, error: null })
    try {
      const campaigns = await window.api.campaigns.getAll()
      set({ campaigns, isLoading: false })
    } catch (err) {
      set({ error: String(err), isLoading: false })
    }
  },

  fetchSystems: async () => {
    try {
      const systems = await window.api.systems.getAll()
      set({ systems })
    } catch (err) {
      set({ error: String(err) })
    }
  },

  createCampaign: async (data: CampaignFormData) => {
    set({ error: null })
    try {
      const newCampaign = await window.api.campaigns.create(data)
      set((state) => ({ campaigns: [newCampaign, ...state.campaigns] }))
      return newCampaign
    } catch (err) {
      set({ error: String(err) })
      throw err
    }
  },

  updateCampaign: async (id: number, data: Partial<CampaignFormData>) => {
    set({ error: null })
    try {
      const updated = await window.api.campaigns.update(id, data)
      set((state) => ({
        campaigns: state.campaigns.map((c) => (c.id === id ? updated : c)),
        activeCampaign: state.activeCampaign?.id === id ? updated : state.activeCampaign
      }))
    } catch (err) {
      set({ error: String(err) })
      throw err
    }
  },

  deleteCampaign: async (id: number) => {
    set({ error: null })
    try {
      await window.api.campaigns.delete(id)
      set((state) => ({
        campaigns: state.campaigns.filter((c) => c.id !== id),
        activeCampaign: state.activeCampaign?.id === id ? null : state.activeCampaign
      }))
    } catch (err) {
      set({ error: String(err) })
      throw err
    }
  },

  setActiveCampaign: (campaign) => set({ activeCampaign: campaign }),

  clearError: () => set({ error: null })
}))
