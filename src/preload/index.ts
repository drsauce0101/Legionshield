import { contextBridge, ipcRenderer } from 'electron'
import type { CampaignFormData } from '../types'

const api = {
  campaigns: {
    getAll: () => ipcRenderer.invoke('campaigns:getAll'),
    create: (data: CampaignFormData) => ipcRenderer.invoke('campaigns:create', data),
    update: (id: number, data: Partial<CampaignFormData>) =>
      ipcRenderer.invoke('campaigns:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('campaigns:delete', id)
  },
  systems: {
    getAll: () => ipcRenderer.invoke('systems:getAll')
  },
  players: {
    getByCampaign: (campaignId: number) => ipcRenderer.invoke('players:getByCampaign', campaignId),
    create: (data: any) => ipcRenderer.invoke('players:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('players:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('players:delete', id)
  },
  sessions: {
    getByCampaign: (campaignId: number) => ipcRenderer.invoke('sessions:getByCampaign', campaignId),
    create: (data: any, playerIds: number[]) => ipcRenderer.invoke('sessions:create', data, playerIds),
    update: (id: number, data: any, playerIds: number[]) => ipcRenderer.invoke('sessions:update', id, data, playerIds),
    delete: (id: number) => ipcRenderer.invoke('sessions:delete', id),
    getPresentPlayers: (sessionId: number) => ipcRenderer.invoke('sessions:getPresentPlayers', sessionId)
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close')
  }
}

contextBridge.exposeInMainWorld('api', api)
