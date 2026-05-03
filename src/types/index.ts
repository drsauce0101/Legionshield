// ─── TypeScript Interfaces ────────────────────────────────────────────────────

export interface RPGSystem {
  id: number
  name: string
}

export interface Folder {
  id: number
  name: string
  type: 'campaign' | 'session' | 'player' | 'table'
  campaign_id?: number
  parent_id?: number
  created_at?: string
}

export interface FolderFormData {
  name: string
  type: Folder['type']
  campaign_id?: number
  parent_id?: number
}

export interface Campaign {
  id: number
  name: string
  description: string
  banner_url: string
  system_id: number
  folder_id?: number
  system_name?: string
  created_at?: string
}

export interface CampaignFormData {
  name: string
  description: string
  banner_url: string
  system_id: number
  folder_id?: number
}

export interface PlayerAttribute {
  name: string
  value: string
  max_value?: string // Optional, for "10 / 10" displays
  color?: string // Optional, for custom colors
}

export interface Player {
  id: number
  campaign_id: number
  name: string
  class_archetype: string
  notes: string // HTML from Rich Text
  avatar_url?: string
  attributes?: string // JSON string of PlayerAttribute[]
  folder_id?: number
  created_at?: string
}

export interface PlayerFormData {
  name: string
  class_archetype: string
  notes: string
  avatar_url?: string
  attributes?: string // JSON string of PlayerAttribute[]
  campaign_id: number
  folder_id?: number
}

export interface Session {
  id: number
  campaign_id: number
  title: string
  notes: string // HTML from Rich Text
  tags: string // comma separated
  folder_id?: number
  created_at?: string
}

export interface SessionFormData {
  title: string
  notes: string
  tags: string
  campaign_id: number
  folder_id?: number
}

export interface Table {
  id: number
  campaign_id: number
  name: string
  description: string
  content: string // JSON string of TableRow[]
  folder_id?: number
  created_at?: string
}

export interface TableRow {
  range: string // e.g. "1-5" or "10"
  content: string
}

export interface TableFormData {
  name: string
  description: string
  content: string // JSON string
  campaign_id: number
  folder_id?: number
}

export interface SessionPlayer {
  session_id: number
  player_id: number
}

export type MentionItem = {
  id: string | number
  label: string
  type: 'player' | 'session' | 'campaign'
  avatar_url?: string
  attributes?: string // JSON string of PlayerAttribute[]
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
    update: (id: number, data: Partial<SessionFormData>, playerIds?: number[]) => Promise<Session>
    delete: (id: number) => Promise<void>
    getPresentPlayers: (sessionId: number) => Promise<number[]>
  }
  tables: {
    getByCampaign: (campaignId: number) => Promise<Table[]>
    create: (data: TableFormData) => Promise<Table>
    update: (id: number, data: Partial<TableFormData>) => Promise<Table>
    delete: (id: number) => Promise<void>
  }
  folders: {
    getByType: (type: Folder['type'], campaignId?: number) => Promise<Folder[]>
    create: (data: FolderFormData) => Promise<Folder>
    update: (id: number, data: Partial<FolderFormData>) => Promise<Folder>
    delete: (id: number) => Promise<void>
  }
  systems: {
    getAll: () => Promise<RPGSystem[]>
  }
  system: {
    selectImage: () => Promise<string | null>
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
