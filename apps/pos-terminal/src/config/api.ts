// API Client with automatic token injection
import axios from 'axios';

// Detect if running in Electron
const isElectron = !!(window as any).electronAPI;

// Get API URL - uses local server in Electron, cloud server in browser
async function getApiBaseUrl(): Promise<string> {
  if (isElectron) {
    try {
      const serverUrl = await (window as any).electronAPI.getServerUrl();
      return `${serverUrl}/api`;
    } catch (error) {
      console.error('Failed to get server URL from Electron:', error);
      return 'http://localhost:3001/api';
    }
  }
  
  // Browser mode - use environment variable or default
  return import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
}

// API Configuration - default URL (will be updated)
export let API_BASE_URL = isElectron 
  ? 'http://localhost:3001/api' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000/api');

export const TENANT_SUBDOMAIN = import.meta.env.VITE_TENANT_SUBDOMAIN || 'demo';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-subdomain': TENANT_SUBDOMAIN,
  },
});

// Initialize API client with correct URL (for Electron)
export async function initializeApiClient(): Promise<void> {
  const baseUrl = await getApiBaseUrl();
  API_BASE_URL = baseUrl;
  apiClient.defaults.baseURL = baseUrl;
  console.log('API initialized with base URL:', baseUrl);
}

// Initialize immediately if in Electron
if (isElectron) {
  initializeApiClient().catch(console.error);
}

export { apiClient, isElectron };
export default apiClient;

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pos_accessToken');
      localStorage.removeItem('pos_user');
      window.location.href = '/#/login'; // HashRouter compatible
    }
    return Promise.reject(error);
  }
);
