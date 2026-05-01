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
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close')
  }
}

contextBridge.exposeInMainWorld('api', api)
