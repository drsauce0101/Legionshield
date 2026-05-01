import { ipcMain } from 'electron'
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getSystems,
  getPlayersByCampaign,
  createPlayer,
  updatePlayer,
  deletePlayer,
  getSessionsByCampaign,
  createSession,
  updateSession,
  deleteSession,
  getPresentPlayers
} from './database'
import type { CampaignFormData } from '../types'

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

  // ── Players ────────────────────────────────────────────────────────────────
  ipcMain.handle('players:getByCampaign', (_event, campaignId: number) => {
    return getPlayersByCampaign(campaignId)
  })

  ipcMain.handle('players:create', (_event, data: any) => {
    return createPlayer(data)
  })

  ipcMain.handle('players:update', (_event, id: number, data: any) => {
    return updatePlayer(id, data)
  })

  ipcMain.handle('players:delete', (_event, id: number) => {
    deletePlayer(id)
  })

  // ── Sessions ───────────────────────────────────────────────────────────────
  ipcMain.handle('sessions:getByCampaign', (_event, campaignId: number) => {
    return getSessionsByCampaign(campaignId)
  })

  ipcMain.handle('sessions:create', (_event, data: any, playerIds: number[]) => {
    return createSession(data, playerIds)
  })

  ipcMain.handle('sessions:update', (_event, id: number, data: any, playerIds: number[]) => {
    return updateSession(id, data, playerIds)
  })

  ipcMain.handle('sessions:delete', (_event, id: number) => {
    deleteSession(id)
  })

  ipcMain.handle('sessions:getPresentPlayers', (_event, sessionId: number) => {
    return getPresentPlayers(sessionId)
  })
}
