# Building BIZPOS Desktop for Windows

This guide explains how to create a Windows `.exe` installer for distribution.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **pnpm** or **npm** installed
3. **Windows OS** for building Windows executables (or a CI/CD pipeline)

## Quick Build Commands

From the `apps/desktop` directory:

```powershell
# Install dependencies first
npm install

# Build Windows installer (.exe) + portable version
npm run build:win

# Build only portable .exe (single file, no installation needed)
npm run build:win:portable

# Build only installer .exe (with install wizard)
npm run build:win:installer
```

## What Gets Built

After running the build command, you'll find the outputs in `apps/desktop/dist/`:

| File | Description |
|------|-------------|
| `BIZPOS-1.0.0-Setup.exe` | Windows installer with install wizard |
| `BIZPOS-1.0.0-Portable.exe` | Standalone portable executable |

## Build Options Explained

### 1. Installer (NSIS)
- Full installation wizard
- Creates Start Menu shortcuts
- Creates Desktop shortcut
- Adds uninstaller to Windows
- User can choose installation directory
- Best for: **Professional distribution**

### 2. Portable
- Single `.exe` file
- No installation required
- Can run from USB drive
- Best for: **Quick testing or users who can't install software**

## Step-by-Step Build Process

### Step 1: Navigate to desktop folder
```powershell
cd apps/desktop
```

### Step 2: Install dependencies
```powershell
npm install
```

### Step 3: Add your app icon (optional but recommended)
Place your icon file at `apps/desktop/build/icon.ico`
- Recommended size: 256x256 or 512x512 pixels
- Use ICO format with multiple sizes embedded

### Step 4: Build the application
```powershell
npm run build:win
```

### Step 5: Find your installer
The built files will be in:
```
apps/desktop/dist/
├── BIZPOS-1.0.0-Setup.exe      # Installer
├── BIZPOS-1.0.0-Portable.exe   # Portable version
└── win-unpacked/               # Unpacked app files
```

## Distributing to Clients

### Option A: Share the Installer (.exe)
1. Send `BIZPOS-1.0.0-Setup.exe` to your client
2. Client double-clicks to run the installer
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

### Option B: Share the Portable Version
1. Send `BIZPOS-1.0.0-Portable.exe` to your client
2. Client can run directly without installation

## Important Notes

### Backend Server Required
The desktop app is a **frontend-only** application. Your client will need:
- Access to your hosted backend API server
- OR run the backend locally (for development/testing)

Make sure to configure the correct API URL in the application before building.

### Code Signing (Optional but Recommended)
For professional distribution, consider signing your executable:
- Prevents "Unknown publisher" warnings
- Builds trust with users
- Requires a code signing certificate from providers like:
  - DigiCert
  - Sectigo
  - GlobalSign

### Auto-Updates (Future Enhancement)
You can add auto-update functionality using `electron-updater`:
1. Host update files on a server or GitHub Releases
2. Configure publish settings in package.json
3. Add update checking code to main.js

## Troubleshooting

### Build fails with "icon not found"
- Create `apps/desktop/build/icon.ico` or remove icon references temporarily

### Application shows blank screen
- Ensure the frontend was built correctly: `cd ../pos-terminal && npm run build`
- Check that `pos-terminal/dist/index.html` exists

### Windows SmartScreen blocks the app
- This is normal for unsigned applications
- Users can click "More info" → "Run anyway"
- For production, consider code signing

## Version Updates

To release a new version:
1. Update `version` in `package.json`
2. Rebuild: `npm run build:win`
3. Distribute the new installer

## File Size Optimization

Expected sizes:
- Installer: ~80-150 MB
- Portable: ~80-150 MB

To reduce size:
- Remove unused dependencies
- Optimize images and assets
- Consider using `electron-builder` compression options
