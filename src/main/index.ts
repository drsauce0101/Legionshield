import { app, shell, BrowserWindow, ipcMain, protocol } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initDatabase, closeDatabase } from './database'
import { registerIpcHandlers } from './ipc-handlers'
// @ts-ignore
import icon from '../../resources/icon.png?asset'

protocol.registerSchemesAsPrivileged([
  { scheme: 'local', privileges: { bypassCSP: true, supportFetchAPI: true, secure: true } }
])

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,               // Custom title bar
    titleBarStyle: 'hidden',
    backgroundColor: '#0d0e13', // Match dark bg before paint
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Window control IPC
  ipcMain.on('window:minimize', () => mainWindow.minimize())
  ipcMain.on('window:maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })
  ipcMain.on('window:close', () => mainWindow.close())

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.legionshield.app')

  protocol.handle('local', (request) => {
    try {
      let fileName = request.url.slice('local://'.length)
      if (fileName.startsWith('/')) fileName = fileName.slice(1)
      fileName = decodeURIComponent(fileName)
      
      const fs = require('fs')
      const path = require('path')
      const userDataPath = app.getPath('userData')
      const filePath = path.join(userDataPath, 'images', fileName)
      
      const buffer = fs.readFileSync(filePath)
      
      // Determine basic MIME type
      const ext = filePath.split('.').pop()?.toLowerCase() || 'png'
      let mimeType = 'image/png'
      if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg'
      else if (ext === 'webp') mimeType = 'image/webp'
      else if (ext === 'gif') mimeType = 'image/gif'
      
      return new Response(buffer, {
        headers: { 'Content-Type': mimeType }
      })
    } catch (e) {
      console.error('Local Protocol Error:', e)
      return new Response('File not found', { status: 404 })
    }
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize database before creating window
  try {
    initDatabase()
    registerIpcHandlers()
    createWindow()
  } catch (error) {
    console.error('Failed to initialize:', error)
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  closeDatabase()
})
