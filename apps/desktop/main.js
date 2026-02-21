const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

// Server management
let localServer = null;
let mainWindow = null;
let serverUrl = null;
let discoveryService = null;

// Get config path
function getConfigPath() {
  const appDataPath = process.env.APPDATA || 
    (process.platform === 'darwin' ? path.join(process.env.HOME, 'Library', 'Application Support') : '/var/local');
  const bizposPath = path.join(appDataPath, 'BIZPOS');
  
  if (!fs.existsSync(bizposPath)) {
    fs.mkdirSync(bizposPath, { recursive: true });
  }
  
  return path.join(bizposPath, 'config.json');
}

// Load config
function loadConfig() {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return { mode: null, serverUrl: null, cloudBaseUrl: null, locationId: null };
}

// Save config
function saveConfig(config) {
  try {
    const configPath = getConfigPath();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

// Initialize and start local server
async function startLocalServer(options = {}) {
  return new Promise((resolve, reject) => {
    try {
      // Initialize database if needed
      const initDbPath = path.join(__dirname, 'local-server', 'init-db.js');
      if (fs.existsSync(initDbPath)) {
        require(initDbPath);
      }
      
      // Start the server
      const { startServer, PORT, getLocalIPs } = require('./local-server/index.js');
      localServer = startServer(options);
      
      serverUrl = `http://localhost:${PORT}`;
      resolve({ url: serverUrl, ips: getLocalIPs(), port: PORT });
    } catch (error) {
      console.error('Failed to start local server:', error);
      reject(error);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "BIZPOS - Point of Sale",
    backgroundColor: "#0f172a",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      devTools: !app.isPackaged,
    },
  });

  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
  
  if (isDev) {
    // In dev mode, load from Vite dev server
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    mainWindow.loadURL(frontendUrl)
      .catch((err) => {
        console.error("Failed to load URL:", err);
        console.log(`Make sure the POS Terminal dev server is running on ${frontendUrl}`);
      });
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from packaged resources
    const indexPath = path.join(process.resourcesPath, "app", "dist", "index.html");
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
    app.quit();
  });
}

// App lifecycle
app.whenReady().then(async () => {
  const config = loadConfig();
  
  // Always start local server for now (can be made configurable later)
  try {
    console.log('Starting local server...');
    const serverInfo = await startLocalServer();
    console.log('Local server started:', serverInfo);
    
    // Save the server URL for frontend to use
    saveConfig({ ...config, mode: 'server', serverUrl: serverInfo.url });
  } catch (error) {
    console.error('Failed to start server:', error);
    dialog.showErrorBox('Server Error', 'Failed to start local server. Please check the logs.');
  }
  
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for renderer process
ipcMain.handle('get-server-url', () => {
  return serverUrl || 'http://localhost:3001';
});

ipcMain.handle('get-config', () => {
  return loadConfig();
});

ipcMain.handle('set-config', (event, config) => {
  saveConfig(config);
  return true;
});

// Discovery IPC handlers
ipcMain.handle('discover-servers', async (event, timeout) => {
  try {
    const { DiscoveryService } = require('./local-server/discovery.js');
    const tempDiscovery = new DiscoveryService();
    const servers = await tempDiscovery.discoverServers(timeout || 5000);
    return { success: true, servers };
  } catch (error) {
    console.error('Discovery error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-local-ips', () => {
  try {
    const { getLocalIPs, PORT } = require('./local-server/index.js');
    return { ips: getLocalIPs(), port: PORT };
  } catch (error) {
    console.error('Get local IPs error:', error);
    return { ips: [], port: 3001 };
  }
});

// Mode switching IPC handlers
ipcMain.handle('set-server-mode', async (event, serverAddress) => {
  try {
    const config = loadConfig();
    config.mode = serverAddress ? 'client' : 'server';
    config.serverUrl = serverAddress || `http://localhost:3001`;
    serverUrl = config.serverUrl;
    saveConfig(config);
    return { success: true, serverUrl };
  } catch (error) {
    console.error('Set server mode error:', error);
    return { success: false, error: error.message };
  }
});

// Sync configuration IPC handler
ipcMain.handle('configure-cloud-sync', async (event, cloudConfig) => {
  try {
    const config = loadConfig();
    config.cloudBaseUrl = cloudConfig.cloudBaseUrl;
    config.locationId = cloudConfig.locationId;
    saveConfig(config);
    return { success: true };
  } catch (error) {
    console.error('Configure cloud sync error:', error);
    return { success: false, error: error.message };
  }
});

// App info IPC handler
ipcMain.handle('get-app-info', () => {
  return {
    version: app.getVersion(),
    isPackaged: app.isPackaged,
    platform: process.platform,
    arch: process.arch,
    appDataPath: process.env.APPDATA || 
      (process.platform === 'darwin' ? path.join(process.env.HOME, 'Library', 'Application Support') : '/var/local'),
  };
});

