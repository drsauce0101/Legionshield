import { create } from 'zustand'
import type { Campaign, CampaignFormData, RPGSystem, Player, PlayerFormData, Session, SessionFormData } from '../../../types'

interface CampaignStore {
  // State
  campaigns: Campaign[]
  systems: RPGSystem[]
  activeCampaign: Campaign | null
  playersList: Player[]
  sessionsList: Session[]
  activeSession: Session | null
  activePlayer: Player | null
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

  // Players
  fetchPlayers: (campaignId: number) => Promise<void>
  createPlayer: (data: PlayerFormData) => Promise<void>
  updatePlayer: (id: number, data: Partial<PlayerFormData>) => Promise<void>
  deletePlayer: (id: number) => Promise<void>
  setActivePlayer: (player: Player | null) => void

  // Sessions
  fetchSessions: (campaignId: number) => Promise<void>
  createSession: (data: SessionFormData, playerIds: number[]) => Promise<Session>
  updateSession: (id: number, data: Partial<SessionFormData>, playerIds: number[]) => Promise<void>
  deleteSession: (id: number) => Promise<void>
  setActiveSession: (session: Session | null) => void
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
  campaigns: [],
  systems: [],
  activeCampaign: null,
  playersList: [],
  sessionsList: [],
  activeSession: null,
  activePlayer: null,
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

  clearError: () => set({ error: null }),

  fetchPlayers: async (campaignId: number) => {
    try {
      const players = await window.api.players.getByCampaign(campaignId)
      set({ playersList: players })
    } catch (err) {
      set({ error: String(err) })
    }
  },

  createPlayer: async (data: PlayerFormData) => {
    try {
      const newPlayer = await window.api.players.create(data)
      set((state) => ({ playersList: [newPlayer, ...state.playersList] }))
    } catch (err) {
      set({ error: String(err) })
      throw err
    }
  },

  updatePlayer: async (id: number, data: Partial<PlayerFormData>) => {
    try {
      const updated = await window.api.players.update(id, data)
      set((state) => ({
        playersList: state.playersList.map((p) => (p.id === id ? updated : p)),
        activePlayer: state.activePlayer?.id === id ? updated : state.activePlayer
      }))
    } catch (err) {
      set({ error: String(err) })
      throw err
    }
  },

  deletePlayer: async (id: number) => {
    try {
      await window.api.players.delete(id)
      set((state) => ({
        playersList: state.playersList.filter((p) => p.id !== id),
        activePlayer: state.activePlayer?.id === id ? null : state.activePlayer
      }))
    } catch (err) {
      set({ error: String(err) })
      throw err
    }
  },

  fetchSessions: async (campaignId: number) => {
    try {
      const sessions = await window.api.sessions.getByCampaign(campaignId)
      set({ sessionsList: sessions })
    } catch (err) {
      set({ error: String(err) })
    }
  },

  createSession: async (data: SessionFormData, playerIds: number[]) => {
    try {
      const newSession = await window.api.sessions.create(data, playerIds)
      set((state) => ({ sessionsList: [newSession, ...state.sessionsList] }))
      return newSession
    } catch (err) {
      set({ error: String(err) })
      throw err
    }
  },

  updateSession: async (id: number, data: Partial<SessionFormData>, playerIds: number[]) => {
    try {
      const updated = await window.api.sessions.update(id, data, playerIds)
      set((state) => ({
        sessionsList: state.sessionsList.map((s) => (s.id === id ? updated : s)),
        activeSession: state.activeSession?.id === id ? updated : state.activeSession
      }))
    } catch (err) {
      set({ error: String(err) })
      throw err
    }
  },

  deleteSession: async (id: number) => {
    try {
      await window.api.sessions.delete(id)
      set((state) => ({
        sessionsList: state.sessionsList.filter((s) => s.id !== id),
        activeSession: state.activeSession?.id === id ? null : state.activeSession
      }))
    } catch (err) {
      set({ error: String(err) })
      throw err
    }
  },

  setActiveSession: (session) => set({ activeSession: session, activePlayer: null }),
  setActivePlayer: (player) => set({ activePlayer: player, activeSession: null })
}))
