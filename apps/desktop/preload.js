const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Update the macOS dock badge count
  updateBadge: (count) => ipcRenderer.send('update-badge', count),

  // Current platform string: 'win32' | 'darwin' | 'linux'
  platform: process.platform,

  // Get the packaged app version from main process
  appVersion: () => ipcRenderer.invoke('get-version'),

  // Trigger immediate update install (after update-downloaded fires)
  installUpdate: () => ipcRenderer.send('install-update'),

  // Listen for auto-update events from main process
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
})
