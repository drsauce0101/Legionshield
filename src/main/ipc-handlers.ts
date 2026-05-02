import { ipcMain, dialog, app } from 'electron'
import fs from 'fs'
import path from 'path'
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
  getPresentPlayers,
  getTablesByCampaign,
  createTable,
  updateTable,
  deleteTable
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

  // ── Tables ─────────────────────────────────────────────────────────────────
  ipcMain.handle('tables:getByCampaign', (_event, campaignId: number) => {
    return getTablesByCampaign(campaignId)
  })

  ipcMain.handle('tables:create', (_event, data: any) => {
    return createTable(data)
  })

  ipcMain.handle('tables:update', (_event, id: number, data: any) => {
    return updateTable(id, data)
  })

  ipcMain.handle('tables:delete', (_event, id: number) => {
    deleteTable(id)
  })

  // ── System ─────────────────────────────────────────────────────────────────
  ipcMain.handle('system:selectImage', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Selecione uma imagem',
      properties: ['openFile'],
      filters: [
        { name: 'Imagens', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }
      ]
    })

    if (canceled || filePaths.length === 0) {
      return null
    }

    const sourcePath = filePaths[0]
    const userDataPath = app.getPath('userData')
    const imagesDir = path.join(userDataPath, 'images')

    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true })
    }

    const fileName = `img_${Date.now()}_${path.basename(sourcePath)}`
    const destPath = path.join(imagesDir, fileName)

    fs.copyFileSync(sourcePath, destPath)

    // Apenas retornamos o nome do arquivo, a resolução do caminho real
    // é feita pelo protocolo 'local' lá no main/index.ts
    return `local://${encodeURIComponent(fileName)}`
  })
}
