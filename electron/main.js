const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development'

const saveDir = path.join(app.getPath('userData'), 'saves')

function ensureSaveDir() {
  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true })
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: '修仙旅程 - AI 文本冒险',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  ensureSaveDir()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('save-game', async (_event, { slot, data }) => {
  ensureSaveDir()
  const filePath = path.join(saveDir, `save_${slot}.json`)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  return { success: true, path: filePath }
})

ipcMain.handle('load-game', async (_event, { slot }) => {
  ensureSaveDir()
  const filePath = path.join(saveDir, `save_${slot}.json`)
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8')
    return { success: true, data: JSON.parse(data) }
  }
  return { success: false, data: null }
})

ipcMain.handle('list-saves', async () => {
  ensureSaveDir()
  const saves = []
  if (fs.existsSync(saveDir)) {
    const files = fs.readdirSync(saveDir).filter(f => f.startsWith('save_') && f.endsWith('.json'))
    for (const file of files) {
      const slot = file.replace('save_', '').replace('.json', '')
      const filePath = path.join(saveDir, file)
      const stat = fs.statSync(filePath)
      try {
        const raw = fs.readFileSync(filePath, 'utf-8')
        const data = JSON.parse(raw)
        saves.push({
          slot: parseInt(slot),
          modified: stat.mtime.toISOString(),
          characterName: data.character?.name || '无名',
          realm: data.character?.realm || '凡人'
        })
      } catch {
        saves.push({
          slot: parseInt(slot),
          modified: stat.mtime.toISOString(),
          characterName: '损坏存档',
          realm: '—'
        })
      }
    }
  }
  return saves.sort((a, b) => a.slot - b.slot)
})
