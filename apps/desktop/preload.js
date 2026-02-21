/**
 * BIZPOS Preload Script
 * Exposes secure APIs to the renderer process
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Get the server URL (local or remote)
  getServerUrl: () => ipcRenderer.invoke('get-server-url'),
  
  // Get app configuration
  getConfig: () => ipcRenderer.invoke('get-config'),
  
  // Set app configuration
  setConfig: (config) => ipcRenderer.invoke('set-config', config),
  
  // Discovery APIs
  discoverServers: (timeout) => ipcRenderer.invoke('discover-servers', timeout),
  getLocalIPs: () => ipcRenderer.invoke('get-local-ips'),
  
  // Mode switching
  setServerMode: (serverAddress) => ipcRenderer.invoke('set-server-mode', serverAddress),
  
  // Cloud sync configuration
  configureCloudSync: (config) => ipcRenderer.invoke('configure-cloud-sync', config),
  
  // App info
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // Check if running in Electron
  isElectron: true,
  
  // Platform info
  platform: process.platform,
});
