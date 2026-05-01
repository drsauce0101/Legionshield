import { ipcMain } from 'electron'
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getSystems
} from './database'
import type { CampaignFormData } from '../../types'

export function registerIpcHandlers(): void {
  // ── Campaigns ──────────────────────────────────────────────────────────────
  ipcMain.handle('campaigns:getAll', () => {
    return getCampaigns()
  })

  ipcMain.handle('campaigns:create', (_event, data: CampaignFormData) => {
    return createCampaign(data)
  })

  ipcMain.handle('campaigns:update', (_event, id: number, data: Partial<CampaignFormData>) => {
    return updateCampaign(id, data)
  })

  ipcMain.handle('campaigns:delete', (_event, id: number) => {
    deleteCampaign(id)
  })

  // ── Systems ────────────────────────────────────────────────────────────────
  ipcMain.handle('systems:getAll', () => {
    return getSystems()
  })
}
