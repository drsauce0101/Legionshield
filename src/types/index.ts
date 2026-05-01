// ─── TypeScript Interfaces ────────────────────────────────────────────────────

export interface RPGSystem {
  id: number
  name: string
}

export interface Campaign {
  id: number
  name: string
  description: string
  banner_url: string
  system_id: number
  system_name?: string
  created_at?: string
}

export interface CampaignFormData {
  name: string
  description: string
  banner_url: string
  system_id: number
}

export interface Player {
  id: number
  campaign_id: number
  name: string
  class_archetype: string
  notes: string // HTML from Rich Text
  created_at?: string
}

export interface PlayerFormData {
  name: string
  class_archetype: string
  notes: string
  campaign_id: number
}

export interface Session {
  id: number
  campaign_id: number
  title: string
  notes: string // HTML from Rich Text
  tags: string // comma separated
  created_at?: string
}

export interface SessionFormData {
  title: string
  notes: string
  tags: string
  campaign_id: number
}

export interface SessionPlayer {
  session_id: number
  player_id: number
}

// ─── Electron API (exposed via contextBridge) ─────────────────────────────────

export interface ElectronAPI {
  campaigns: {
    getAll: () => Promise<Campaign[]>
    create: (data: CampaignFormData) => Promise<Campaign>
    update: (id: number, data: Partial<CampaignFormData>) => Promise<Campaign>
    delete: (id: number) => Promise<void>
  }
  players: {
    getByCampaign: (campaignId: number) => Promise<Player[]>
    create: (data: PlayerFormData) => Promise<Player>
    update: (id: number, data: Partial<PlayerFormData>) => Promise<Player>
    delete: (id: number) => Promise<void>
  }
  sessions: {
    getByCampaign: (campaignId: number) => Promise<Session[]>
    create: (data: SessionFormData, playerIds: number[]) => Promise<Session>
    update: (id: number, data: Partial<SessionFormData>, playerIds: number[]) => Promise<Session>
    delete: (id: number) => Promise<void>
    getPresentPlayers: (sessionId: number) => Promise<number[]>
  }
  systems: {
    getAll: () => Promise<RPGSystem[]>
  }
  window: {
    minimize: () => void
    maximize: () => void
    close: () => void
  }
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
