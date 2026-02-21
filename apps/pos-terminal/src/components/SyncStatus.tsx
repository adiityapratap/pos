import { useState, useEffect, useCallback } from 'react';
import './SyncStatus.css';

interface SyncStatusData {
  configured: boolean;
  isOnline: boolean;
  pendingOrderCount: number;
  failedOrderCount: number;
  lastMenuSync: string | null;
  syncInProgress: boolean;
}

// Helper function to get server URL
async function getServerBaseUrl(): Promise<string> {
  const baseUrl = 'http://localhost:3001';
  try {
    // Check if running in Electron
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.getServerUrl) {
      return await electronAPI.getServerUrl();
    }
  } catch {
    // Ignore errors
  }
  return baseUrl;
}

export default function SyncStatus() {
  const [status, setStatus] = useState<SyncStatusData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSyncStatus = useCallback(async () => {
    try {
      const baseUrl = await getServerBaseUrl();
      const response = await fetch(`${baseUrl}/api/sync/status`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  }, []);

  useEffect(() => {
    // Fetch immediately on mount
    void (async () => {
      await fetchSyncStatus();
    })();
    
    // Then set up periodic refresh
    const interval = setInterval(() => {
      void fetchSyncStatus();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchSyncStatus]);

  const triggerSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setMessage('');
    
    try {
      const baseUrl = await getServerBaseUrl();
      const response = await fetch(`${baseUrl}/api/sync/now`, { method: 'POST' });
      if (response.ok) {
        const result = await response.json();
        if (result.orderSync?.uploaded > 0 || result.menuSync?.updates) {
          setMessage(`Synced ${result.orderSync?.uploaded || 0} orders`);
        } else {
          setMessage('Already up to date');
        }
        fetchSyncStatus();
      } else {
        setMessage('Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      setMessage('Sync failed');
    }
    
    setIsSyncing(false);
  };

  const retryFailed = async () => {
    try {
      const baseUrl = await getServerBaseUrl();
      await fetch(`${baseUrl}/api/sync/retry-failed`, { method: 'POST' });
      setMessage('Retrying failed syncs...');
      fetchSyncStatus();
    } catch (error) {
      console.error('Retry failed error:', error);
    }
  };

  // Don't render if not configured
  if (!status || !status.configured) {
    return null;
  }

  const getStatusIcon = () => {
    if (status.syncInProgress || isSyncing) return '🔄';
    if (status.failedOrderCount > 0) return '⚠️';
    if (status.pendingOrderCount > 0) return '📤';
    if (status.isOnline) return '☁️';
    return '💾';
  };

  const getStatusText = () => {
    if (status.syncInProgress || isSyncing) return 'Syncing...';
    if (status.failedOrderCount > 0) return `${status.failedOrderCount} failed`;
    if (status.pendingOrderCount > 0) return `${status.pendingOrderCount} pending`;
    if (status.isOnline) return 'Online';
    return 'Offline';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className={`sync-status ${isExpanded ? 'expanded' : ''}`}>
      <button 
        className={`sync-status-toggle ${status.isOnline ? 'online' : 'offline'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">{getStatusText()}</span>
      </button>
      
      {isExpanded && (
        <div className="sync-status-panel">
          <div className="sync-info">
            <div className="info-row">
              <span>Connection:</span>
              <span className={status.isOnline ? 'online' : 'offline'}>
                {status.isOnline ? '🟢 Online' : '🔴 Offline'}
              </span>
            </div>
            <div className="info-row">
              <span>Pending Orders:</span>
              <span>{status.pendingOrderCount}</span>
            </div>
            {status.failedOrderCount > 0 && (
              <div className="info-row failed">
                <span>Failed:</span>
                <span>{status.failedOrderCount}</span>
              </div>
            )}
            <div className="info-row">
              <span>Last Menu Sync:</span>
              <span className="date">{formatDate(status.lastMenuSync)}</span>
            </div>
          </div>
          
          {message && (
            <div className="sync-message">{message}</div>
          )}
          
          <div className="sync-actions">
            <button 
              className="sync-button"
              onClick={triggerSync}
              disabled={isSyncing || !status.isOnline}
            >
              {isSyncing ? '⏳ Syncing...' : '🔄 Sync Now'}
            </button>
            
            {status.failedOrderCount > 0 && (
              <button 
                className="retry-button"
                onClick={retryFailed}
              >
                🔁 Retry Failed
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
