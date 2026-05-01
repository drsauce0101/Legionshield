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

// ─── Electron API (exposed via contextBridge) ─────────────────────────────────

export interface ElectronAPI {
  campaigns: {
    getAll: () => Promise<Campaign[]>
    create: (data: CampaignFormData) => Promise<Campaign>
    update: (id: number, data: Partial<CampaignFormData>) => Promise<Campaign>
    delete: (id: number) => Promise<void>
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
