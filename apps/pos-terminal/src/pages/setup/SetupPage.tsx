import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SetupPage.css';

interface DiscoveredServer {
  id: string;
  name: string;
  port: number;
  version: string;
  ips: string[];
  sourceIp: string;
  lastSeen: number;
}

interface LocalIPInfo {
  ips: string[];
  port: number;
}

declare global {
  interface Window {
    electronAPI?: {
      discoverServers: (timeout: number) => Promise<{ success: boolean; servers: DiscoveredServer[]; error?: string }>;
      getLocalIPs: () => Promise<LocalIPInfo>;
      setServerMode: (serverAddress: string | null) => Promise<{ success: boolean; serverUrl?: string; error?: string }>;
      configureCloudSync: (config: { cloudBaseUrl: string; locationId: string }) => Promise<{ success: boolean; error?: string }>;
      getConfig: () => Promise<{ mode?: string; serverUrl?: string; cloudBaseUrl?: string; locationId?: string }>;
      getAppInfo: () => Promise<{ version: string; isPackaged: boolean; platform: string }>;
      isElectron?: boolean;
    };
  }
}

export default function SetupPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'select' | 'server' | 'client' | 'cloud'>('select');
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredServers, setDiscoveredServers] = useState<DiscoveredServer[]>([]);
  const [localIPs, setLocalIPs] = useState<string[]>([]);
  const [localPort, setLocalPort] = useState(3001);
  const [manualIP, setManualIP] = useState('');
  const [cloudBaseUrl, setCloudBaseUrl] = useState('');
  const [locationId, setLocationId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [appInfo, setAppInfo] = useState<{ version: string; isPackaged: boolean } | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      if (window.electronAPI) {
        try {
          const config = await window.electronAPI.getConfig();
          if (config.cloudBaseUrl) setCloudBaseUrl(config.cloudBaseUrl);
          if (config.locationId) setLocationId(config.locationId);
          
          const info = await window.electronAPI.getAppInfo();
          setAppInfo(info);
        } catch (err) {
          console.error('Failed to load config:', err);
        }
      }
    };

    const loadLocalInfo = async () => {
      if (window.electronAPI) {
        try {
          const ipInfo = await window.electronAPI.getLocalIPs();
          setLocalIPs(ipInfo.ips);
          setLocalPort(ipInfo.port);
        } catch (err) {
          console.error('Failed to get local IPs:', err);
        }
      }
    };

    loadConfig();
    loadLocalInfo();
  }, []);

  const scanForServers = async () => {
    setIsScanning(true);
    setError('');
    setDiscoveredServers([]);

    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.discoverServers(8000);
        if (result.success) {
          setDiscoveredServers(result.servers);
          if (result.servers.length === 0) {
            setError('No servers found on the network. Make sure a BIZPOS server is running.');
          }
        } else {
          setError(result.error || 'Discovery failed');
        }
      } catch (err) {
        console.error('Scan error:', err);
        setError('Failed to scan for servers');
      }
    }

    setIsScanning(false);
  };

  const selectServer = async (server: DiscoveredServer) => {
    const serverUrl = `http://${server.sourceIp}:${server.port}`;
    await connectToServer(serverUrl);
  };

  const connectToManualServer = async () => {
    if (!manualIP.trim()) {
      setError('Please enter a server address');
      return;
    }
    
    let serverUrl = manualIP.trim();
    if (!serverUrl.startsWith('http')) {
      serverUrl = `http://${serverUrl}`;
    }
    if (!serverUrl.includes(':')) {
      serverUrl = `${serverUrl}:3001`;
    }
    
    await connectToServer(serverUrl);
  };

  const connectToServer = async (serverUrl: string) => {
    setError('');
    
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.setServerMode(serverUrl);
        if (result.success) {
          setSuccess('Connected to server! Redirecting...');
          setTimeout(() => navigate('/login'), 1500);
        } else {
          setError(result.error || 'Failed to connect');
        }
      } catch (err) {
        console.error('Connection error:', err);
        setError('Failed to connect to server');
      }
    }
  };

  const startAsServer = async () => {
    setError('');
    
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.setServerMode(null);
        if (result.success) {
          setSuccess('Server mode enabled! Redirecting...');
          setTimeout(() => navigate('/login'), 1500);
        } else {
          setError(result.error || 'Failed to start server');
        }
      } catch (err) {
        console.error('Server start error:', err);
        setError('Failed to start server mode');
      }
    }
  };

  const saveCloudConfig = async () => {
    setError('');
    
    if (!cloudBaseUrl.trim()) {
      setError('Please enter the cloud server URL');
      return;
    }
    
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.configureCloudSync({
          cloudBaseUrl: cloudBaseUrl.trim(),
          locationId: locationId.trim(),
        });
        
        if (result.success) {
          setSuccess('Cloud sync configured successfully!');
        } else {
          setError(result.error || 'Failed to save configuration');
        }
      } catch (err) {
        console.error('Save config error:', err);
        setError('Failed to save configuration');
      }
    }
  };

  const renderModeSelection = () => (
    <div className="setup-options">
      <h2>Choose Setup Mode</h2>
      <p className="subtitle">How would you like to use this terminal?</p>
      
      <div className="mode-cards">
        <div className="mode-card" onClick={() => { setMode('server'); startAsServer(); }}>
          <div className="mode-icon server-icon">🖥️</div>
          <h3>Main Terminal (Server)</h3>
          <p>This is the primary POS. Other terminals will connect to it.</p>
          <ul>
            <li>Stores all data locally</li>
            <li>Works offline</li>
            <li>Other terminals connect to this one</li>
          </ul>
        </div>
        
        <div className="mode-card" onClick={() => { setMode('client'); scanForServers(); }}>
          <div className="mode-icon client-icon">📱</div>
          <h3>Secondary Terminal (Client)</h3>
          <p>Connect to an existing BIZPOS server on the network.</p>
          <ul>
            <li>Connects to main terminal</li>
            <li>Shares data with server</li>
            <li>Requires network connection</li>
          </ul>
        </div>
        
        <div className="mode-card" onClick={() => setMode('cloud')}>
          <div className="mode-icon cloud-icon">☁️</div>
          <h3>Cloud Sync Settings</h3>
          <p>Configure cloud synchronization for backup and updates.</p>
          <ul>
            <li>Sync orders to cloud</li>
            <li>Download menu updates</li>
            <li>Multi-location support</li>
          </ul>
        </div>
      </div>
      
      <button className="skip-button" onClick={() => navigate('/login')}>
        Skip Setup → Continue to Login
      </button>
    </div>
  );

  const renderServerMode = () => (
    <div className="setup-section">
      <button className="back-button" onClick={() => setMode('select')}>← Back</button>
      
      <h2>🖥️ Server Mode</h2>
      <p className="subtitle">This terminal is running as the main server.</p>
      
      {localIPs.length > 0 && (
        <div className="server-info">
          <h3>Other terminals can connect to:</h3>
          <div className="ip-list">
            {localIPs.map((ip, idx) => (
              <div key={idx} className="ip-item">
                <code>http://{ip}:{localPort}</code>
                <button 
                  className="copy-button"
                  onClick={() => navigator.clipboard.writeText(`http://${ip}:${localPort}`)}
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );

  const renderClientMode = () => (
    <div className="setup-section">
      <button className="back-button" onClick={() => setMode('select')}>← Back</button>
      
      <h2>📱 Connect to Server</h2>
      <p className="subtitle">Find and connect to a BIZPOS server on your network.</p>
      
      <div className="scan-section">
        <button 
          className="scan-button" 
          onClick={scanForServers}
          disabled={isScanning}
        >
          {isScanning ? '🔍 Scanning...' : '🔍 Scan for Servers'}
        </button>
        
        {discoveredServers.length > 0 && (
          <div className="server-list">
            <h3>Found Servers:</h3>
            {discoveredServers.map((server) => (
              <div 
                key={server.id} 
                className="server-item"
                onClick={() => selectServer(server)}
              >
                <div className="server-name">{server.name}</div>
                <div className="server-ip">{server.sourceIp}:{server.port}</div>
                <div className="server-version">v{server.version}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="manual-section">
        <h3>Manual Connection</h3>
        <p>Or enter the server address manually:</p>
        <div className="manual-input">
          <input
            type="text"
            placeholder="e.g., 192.168.1.100:3001"
            value={manualIP}
            onChange={(e) => setManualIP(e.target.value)}
          />
          <button onClick={connectToManualServer}>Connect</button>
        </div>
      </div>
      
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );

  const renderCloudConfig = () => (
    <div className="setup-section">
      <button className="back-button" onClick={() => setMode('select')}>← Back</button>
      
      <h2>☁️ Cloud Sync Settings</h2>
      <p className="subtitle">Configure cloud synchronization for data backup and menu updates.</p>
      
      <div className="cloud-form">
        <div className="form-group">
          <label>Cloud Server URL</label>
          <input
            type="url"
            placeholder="https://your-server.com/api"
            value={cloudBaseUrl}
            onChange={(e) => setCloudBaseUrl(e.target.value)}
          />
          <span className="hint">The URL of your cloud backend API</span>
        </div>
        
        <div className="form-group">
          <label>Location ID (Optional)</label>
          <input
            type="text"
            placeholder="Location identifier"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          />
          <span className="hint">For multi-location setups</span>
        </div>
        
        <div className="button-group">
          <button className="save-button" onClick={saveCloudConfig}>
            Save Configuration
          </button>
        </div>
      </div>
      
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <div className="cloud-info">
        <h3>How Cloud Sync Works</h3>
        <ul>
          <li><strong>Order Sync:</strong> Orders are saved locally first, then synced to cloud when online.</li>
          <li><strong>Menu Updates:</strong> Download new products and categories from your owner portal.</li>
          <li><strong>Offline First:</strong> Everything works offline. Sync happens automatically when connected.</li>
        </ul>
      </div>
    </div>
  );

  // If not running in Electron, show a message
  if (!window.electronAPI) {
    return (
      <div className="setup-page">
        <div className="setup-container">
          <h1>BIZPOS Setup</h1>
          <p>This setup page is for the desktop application.</p>
          <p>When running in a browser, the app connects to the configured API server.</p>
          <button className="skip-button" onClick={() => navigate('/login')}>
            Continue to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-page">
      <div className="setup-container">
        <div className="setup-header">
          <h1>BIZPOS</h1>
          <p className="version">
            {appInfo ? `v${appInfo.version}` : 'Desktop Application'}
          </p>
        </div>
        
        {mode === 'select' && renderModeSelection()}
        {mode === 'server' && renderServerMode()}
        {mode === 'client' && renderClientMode()}
        {mode === 'cloud' && renderCloudConfig()}
      </div>
    </div>
  );
}
