const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  saveGame: (slot, data) => ipcRenderer.invoke('save-game', { slot, data }),
  loadGame: (slot) => ipcRenderer.invoke('load-game', { slot }),
  listSaves: () => ipcRenderer.invoke('list-saves')
})
