# RetailHub Admin — Desktop App

Electron wrapper for the RetailHub Admin dashboard. Packages as a Windows `.exe` (NSIS installer) via electron-builder.

## Development

### 1. Start the dashboard (Next.js)
```bash
cd apps/dashboard
npm run dev
# Runs on http://localhost:3001
```

### 2. Start the Electron app
```bash
cd apps/desktop
npm install
npm run dev
```

The Electron window will open and load `http://localhost:3001`.

Set `DASHBOARD_URL` in a `.env` file (copy `.env.example`) to point to a different host.

## Build

### Windows .exe (NSIS installer)
```bash
cd apps/desktop
npm run build
# Output: dist/RetailHub Admin Setup 1.0.0.exe
```

### macOS .dmg
```bash
npm run build:mac
```

### Linux AppImage
```bash
npm run build:linux
```

## Icons

Before building, add the following files to `assets/`:

| File | Size | Used by |
|---|---|---|
| `icon.png` | 512×512 | Linux / tray fallback |
| `icon.ico` | multi-size | Windows NSIS installer |
| `icon.icns` | bundle | macOS DMG |

See `assets/PLACEHOLDER.txt` for generation tools.

## App Menu Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+1` | Dashboard |
| `Ctrl+2` | Orders |
| `Ctrl+3` | Chat Inbox |
| `Ctrl+4` | Calls |
| `Ctrl+R` | Reload |
| `Ctrl+Shift+I` | Toggle DevTools |
| `Ctrl+Q` | Quit |

## Auto-Updater

`electron-updater` is configured and checks for updates automatically in production builds. Set up a GitHub Releases or S3 bucket as your update server and add the `publish` key to `package.json` → `build`.
