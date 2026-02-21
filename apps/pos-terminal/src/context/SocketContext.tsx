/**
 * BIZPOS Socket Context
 * React context for WebSocket connection management
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { socketService } from '../services/socket.service';
import type { OrderEvent, MenuUpdateEvent, ConnectedTerminal } from '../services/socket.service';

interface SocketContextType {
  isConnected: boolean;
  connectedTerminals: ConnectedTerminal[];
  connect: (serverUrl?: string) => Promise<boolean>;
  disconnect: () => void;
  registerTerminal: (name: string, type: 'pos' | 'admin' | 'owner', locationId?: string) => Promise<void>;
  emitOrderCreated: (order: OrderEvent) => void;
  emitOrderUpdated: (order: OrderEvent) => void;
  emitOrderCompleted: (order: OrderEvent) => void;
  emitMenuUpdated: (update: MenuUpdateEvent) => void;
  requestMenuRefresh: (locationId?: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

interface SocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

export function SocketProvider({ children, autoConnect = true }: SocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedTerminals, setConnectedTerminals] = useState<ConnectedTerminal[]>([]);

  // Connect to server
  const connect = useCallback(async (serverUrl?: string): Promise<boolean> => {
    const result = await socketService.connect(serverUrl);
    setIsConnected(result);
    return result;
  }, []);

  // Disconnect from server
  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
    setConnectedTerminals([]);
  }, []);

  // Register this terminal
  const registerTerminal = useCallback(async (name: string, type: 'pos' | 'admin' | 'owner', locationId?: string) => {
    const terminalId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const result = await socketService.registerTerminal({
      terminalId,
      name,
      type,
      locationId,
    });
    
    if (result.connectedTerminals) {
      setConnectedTerminals(result.connectedTerminals);
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Set up event listeners
  useEffect(() => {
    // Connection status
    const unsubConnectionLost = socketService.on('connection:lost', () => {
      setIsConnected(false);
    });

    // Terminal events
    const unsubTerminalConnected = socketService.on<ConnectedTerminal>('terminal:connected', (terminal) => {
      setConnectedTerminals((prev) => [...prev.filter(t => t.terminalId !== terminal.terminalId), terminal]);
    });

    const unsubTerminalDisconnected = socketService.on<{ terminalId: string }>('terminal:disconnected', (data) => {
      setConnectedTerminals((prev) => prev.filter(t => t.terminalId !== data.terminalId));
    });

    return () => {
      unsubConnectionLost();
      unsubTerminalConnected();
      unsubTerminalDisconnected();
    };
  }, []);

  const value: SocketContextType = {
    isConnected,
    connectedTerminals,
    connect,
    disconnect,
    registerTerminal,
    emitOrderCreated: socketService.emitOrderCreated.bind(socketService),
    emitOrderUpdated: socketService.emitOrderUpdated.bind(socketService),
    emitOrderCompleted: socketService.emitOrderCompleted.bind(socketService),
    emitMenuUpdated: socketService.emitMenuUpdated.bind(socketService),
    requestMenuRefresh: socketService.requestMenuRefresh.bind(socketService),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * Hook to use socket context
 */
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

/**
 * Hook to subscribe to socket events
 */
export function useSocketEvent<T>(event: string, callback: (data: T) => void) {
  useEffect(() => {
    const unsubscribe = socketService.on(event, callback);
    return unsubscribe;
  }, [event, callback]);
}

/**
 * Hook for order events
 */
export function useOrderEvents(handlers: {
  onOrderCreated?: (order: OrderEvent) => void;
  onOrderUpdated?: (order: OrderEvent) => void;
  onOrderCompleted?: (order: OrderEvent) => void;
}) {
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    if (handlers.onOrderCreated) {
      unsubscribes.push(socketService.on('order:created', handlers.onOrderCreated));
    }
    if (handlers.onOrderUpdated) {
      unsubscribes.push(socketService.on('order:updated', handlers.onOrderUpdated));
    }
    if (handlers.onOrderCompleted) {
      unsubscribes.push(socketService.on('order:completed', handlers.onOrderCompleted));
    }

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [handlers.onOrderCreated, handlers.onOrderUpdated, handlers.onOrderCompleted]);
}

/**
 * Hook for menu update events
 */
export function useMenuUpdateEvent(callback: (update: MenuUpdateEvent) => void) {
  useEffect(() => {
    const unsubscribe = socketService.on('menu:updated', callback);
    return unsubscribe;
  }, [callback]);
}

/**
 * Hook for menu refresh requests
 */
export function useMenuRefreshEvent(callback: () => void) {
  useEffect(() => {
    const unsubscribe = socketService.on('menu:refresh', callback);
    return unsubscribe;
  }, [callback]);
}
