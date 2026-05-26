const { app, BrowserWindow, Menu, Tray, nativeImage, shell, ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:3001'
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow
let tray

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'RetailHub Admin',
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#0f172a',
    show: false,
  })

  mainWindow.loadURL(DASHBOARD_URL)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Open external links in browser, not in Electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (isDev) mainWindow.webContents.openDevTools()
}

function createTray() {
  // Use an empty nativeImage as a fallback — replace with a real icon path in production
  let icon
  try {
    icon = nativeImage.createFromPath(path.join(__dirname, 'assets/icon.png'))
    if (icon.isEmpty()) icon = nativeImage.createEmpty()
  } catch {
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)
  tray.setToolTip('RetailHub Admin')

  const trayMenu = Menu.buildFromTemplate([
    { label: 'Open RetailHub Admin', click: () => { if (mainWindow) mainWindow.show() } },
    { type: 'separator' },
    { label: 'Dashboard', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.loadURL(DASHBOARD_URL + '/') } } },
    { label: 'Orders', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.loadURL(DASHBOARD_URL + '/orders') } } },
    { label: 'Chat Inbox', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.loadURL(DASHBOARD_URL + '/chat') } } },
    { label: 'Calls', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.loadURL(DASHBOARD_URL + '/calls') } } },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ])

  tray.setContextMenu(trayMenu)
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus()
      } else {
        mainWindow.show()
      }
    }
  })
}

// App menu
const menuTemplate = [
  {
    label: 'RetailHub',
    submenu: [
      { label: 'About RetailHub', role: 'about' },
      { type: 'separator' },
      { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
    ],
  },
  {
    label: 'View',
    submenu: [
      { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
      {
        label: 'Toggle DevTools',
        accelerator: 'CmdOrCtrl+Shift+I',
        click: () => mainWindow?.webContents.toggleDevTools(),
      },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  },
  {
    label: 'Navigate',
    submenu: [
      { label: 'Dashboard', accelerator: 'CmdOrCtrl+1', click: () => mainWindow?.loadURL(DASHBOARD_URL + '/') },
      { label: 'Orders', accelerator: 'CmdOrCtrl+2', click: () => mainWindow?.loadURL(DASHBOARD_URL + '/orders') },
      { label: 'Chat Inbox', accelerator: 'CmdOrCtrl+3', click: () => mainWindow?.loadURL(DASHBOARD_URL + '/chat') },
      { label: 'Calls', accelerator: 'CmdOrCtrl+4', click: () => mainWindow?.loadURL(DASHBOARD_URL + '/calls') },
    ],
  },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' },
    ],
  },
]

app.whenReady().then(() => {
  createWindow()
  createTray()
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate))

  // Auto updater (production only)
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// IPC: badge count (macOS dock)
ipcMain.on('update-badge', (_, count) => {
  if (process.platform === 'darwin') app.setBadgeCount(count)
})

// IPC: expose app version to renderer
ipcMain.handle('get-version', () => app.getVersion())

// Auto updater events
autoUpdater.on('update-available', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-available')
  }
})

autoUpdater.on('update-downloaded', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded')
  }
})

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall()
})
