/**
 * BIZPOS Socket Service
 * Handles real-time WebSocket communication with guaranteed delivery
 * 
 * Features:
 * - Event Queue: Outgoing events are queued for retry on failure
 * - Message ACKs: Acknowledges receipt of incoming events
 * - Reconnect Logic: Auto-reconnect with missed event replay
 * - Missed Event Replay: Request unACKed events on reconnect
 */

import { io, Socket } from 'socket.io-client';

// Event types
export interface OrderEvent {
  orderId: string;
  orderNumber: string;
  status: string;
  total?: number;
  items?: unknown[];
  locationId?: string;
  terminalId?: string;
}

export interface MenuUpdateEvent {
  type: 'category' | 'product' | 'modifier' | 'full';
  action: 'create' | 'update' | 'delete' | 'sync';
  data?: unknown;
  locationId?: string;
}

export interface SyncEvent {
  type: 'orders' | 'menu' | 'all';
  status: 'started' | 'completed' | 'failed';
  count?: number;
  error?: string;
}

export interface TerminalInfo {
  terminalId: string;
  locationId?: string;
  name: string;
  type: 'pos' | 'admin' | 'owner';
}

export interface ConnectedTerminal {
  terminalId: string;
  name: string;
  type: string;
}

// Wrapped event from server with ACK tracking
export interface WrappedEvent<T = unknown> {
  eventId: string;
  type: string;
  payload: T;
  timestamp: number;
  requiresAck: boolean;
}

// Client-side queued event for outgoing messages
interface QueuedOutgoingEvent {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'sent' | 'acked' | 'failed';
}

type EventCallback<T> = (data: T) => void;

class SocketService {
  private socket: Socket | null = null;
  private serverUrl: string = '';
  private terminalInfo: TerminalInfo | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  
  // Event listeners storage
  private eventListeners: Map<string, Set<EventCallback<unknown>>> = new Map();
  
  // Client-side outgoing event queue
  private outgoingQueue: Map<string, QueuedOutgoingEvent> = new Map();
  private queueProcessorInterval: ReturnType<typeof setInterval> | null = null;
  
  // Track last received event for replay
  private lastReceivedEventId: string | null = null;
  private lastReceivedTimestamp: number = 0;
  
  // Processed event IDs to prevent duplicates
  private processedEventIds: Set<string> = new Set();
  private maxProcessedIds: number = 1000;

  constructor() {
    console.log('[Socket] Service initialized');
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `out_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize socket connection
   */
  async connect(serverUrl?: string): Promise<boolean> {
    // Get server URL
    if (serverUrl) {
      this.serverUrl = serverUrl;
    } else {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const electronAPI = (window as any).electronAPI;
        if (electronAPI?.getServerUrl) {
          this.serverUrl = await electronAPI.getServerUrl();
        } else {
          this.serverUrl = 'http://localhost:3001';
        }
      } catch {
        this.serverUrl = 'http://localhost:3001';
      }
    }

    return new Promise((resolve) => {
      try {
        // Connect to /pos namespace
        this.socket = io(`${this.serverUrl}/pos`, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 10000,
        });

        this.socket.on('connect', () => {
          console.log('[Socket] Connected to server');
          this.isConnected = true;
          const wasReconnect = this.reconnectAttempts > 0;
          this.reconnectAttempts = 0;
          
          // Register terminal if info is available
          if (this.terminalInfo) {
            this.registerTerminal(this.terminalInfo);
          }
          
          // Request missed events if this is a reconnect
          if (wasReconnect) {
            this.requestMissedEventsReplay();
          }
          
          // Start queue processor
          this.startQueueProcessor();
          
          // Emit connection event
          this.emit('connection:established', { serverUrl: this.serverUrl });
          
          resolve(true);
        });

        this.socket.on('disconnect', (reason: string) => {
          console.log(`[Socket] Disconnected: ${reason}`);
          this.isConnected = false;
          this.stopQueueProcessor();
          this.emit('connection:lost', { reason });
        });

        this.socket.on('connect_error', (error: Error) => {
          console.error('[Socket] Connection error:', error.message);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('[Socket] Max reconnection attempts reached');
            this.emit('connection:failed', { attempts: this.reconnectAttempts });
            resolve(false);
          }
        });

        // Handle reconnect event
        this.socket.on('reconnect', (attemptNumber: number) => {
          console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
          this.isConnected = true;
          
          // Re-register terminal
          if (this.terminalInfo) {
            this.registerTerminal(this.terminalInfo);
          }
          
          // Request missed events
          this.requestMissedEventsReplay();
          
          // Retry pending events
          this.retryPendingEvents();
        });

        // Set up event handlers
        this.setupEventHandlers();

      } catch (error) {
        console.error('[Socket] Failed to connect:', error);
        resolve(false);
      }
    });
  }

  /**
   * Start queue processor for retrying failed events
   */
  private startQueueProcessor(): void {
    if (this.queueProcessorInterval) return;
    
    this.queueProcessorInterval = setInterval(() => {
      this.processQueue();
    }, 5000);
  }

  /**
   * Stop queue processor
   */
  private stopQueueProcessor(): void {
    if (this.queueProcessorInterval) {
      clearInterval(this.queueProcessorInterval);
      this.queueProcessorInterval = null;
    }
  }

  /**
   * Process outgoing event queue - retry failed events
   */
  private processQueue(): void {
    const now = Date.now();
    
    for (const [eventId, event] of this.outgoingQueue.entries()) {
      if (event.status === 'pending' && event.retryCount < event.maxRetries) {
        // Calculate retry delay with exponential backoff
        const delay = 1000 * Math.pow(2, event.retryCount);
        
        if (now - event.timestamp > delay) {
          this.retryEvent(event);
        }
      } else if (event.status === 'acked' || event.status === 'failed') {
        // Clean up old events
        if (now - event.timestamp > 60000) { // 1 minute
          this.outgoingQueue.delete(eventId);
        }
      }
    }
  }

  /**
   * Retry sending an event
   */
  private retryEvent(event: QueuedOutgoingEvent): void {
    if (!this.socket || !this.isConnected) return;
    
    console.log(`[Socket] Retrying event ${event.id} (attempt ${event.retryCount + 1})`);
    event.retryCount++;
    event.status = 'sent';
    
    this.socket.emit(event.type, event.payload, (response: { success: boolean; eventId?: string }) => {
      if (response?.success) {
        event.status = 'acked';
        console.log(`[Socket] Event ${event.id} acknowledged`);
      } else {
        event.status = 'pending';
        
        if (event.retryCount >= event.maxRetries) {
          event.status = 'failed';
          console.error(`[Socket] Event ${event.id} failed after ${event.retryCount} attempts`);
          this.emit('event:failed', event);
        }
      }
    });
  }

  /**
   * Retry all pending events after reconnect
   */
  private retryPendingEvents(): void {
    for (const event of this.outgoingQueue.values()) {
      if (event.status === 'pending' || event.status === 'sent') {
        event.status = 'pending';
        event.retryCount = 0; // Reset retries on reconnect
      }
    }
  }

  /**
   * Request missed events from server after reconnect
   */
  private requestMissedEventsReplay(): void {
    if (!this.socket || !this.isConnected) return;
    
    console.log('[Socket] Requesting missed events replay');
    
    this.socket.emit('events:replay', {
      lastEventId: this.lastReceivedEventId,
      lastTimestamp: this.lastReceivedTimestamp,
    }, (response: { success: boolean; replayedCount?: number }) => {
      if (response?.success) {
        console.log(`[Socket] Server replaying ${response.replayedCount || 0} missed events`);
      }
    });
  }

  /**
   * Send ACK for received event
   */
  private sendAck(eventId: string): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('event:ack', {
      eventId,
      timestamp: Date.now(),
    });
  }

  /**
   * Process incoming wrapped event
   */
  private processIncomingEvent<T>(type: string, wrapped: WrappedEvent<T>): void {
    // Check if we've already processed this event (deduplication)
    if (this.processedEventIds.has(wrapped.eventId)) {
      console.log(`[Socket] Skipping duplicate event: ${wrapped.eventId}`);
      // Still send ACK for duplicates
      if (wrapped.requiresAck) {
        this.sendAck(wrapped.eventId);
      }
      return;
    }
    
    // Track as processed
    this.processedEventIds.add(wrapped.eventId);
    if (this.processedEventIds.size > this.maxProcessedIds) {
      // Remove oldest entries
      const idsArray = Array.from(this.processedEventIds);
      for (let i = 0; i < 100; i++) {
        this.processedEventIds.delete(idsArray[i]);
      }
    }
    
    // Update last received
    this.lastReceivedEventId = wrapped.eventId;
    this.lastReceivedTimestamp = wrapped.timestamp;
    
    // Emit to local listeners with the payload
    this.emit(type, wrapped.payload);
    
    // Send ACK if required
    if (wrapped.requiresAck) {
      this.sendAck(wrapped.eventId);
    }
  }

  /**
   * Set up event handlers for incoming messages
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Order events - handle both wrapped and unwrapped (for backward compatibility)
    this.socket.on('order:created', (data: WrappedEvent<OrderEvent> | OrderEvent) => {
      if ('eventId' in data && 'payload' in data) {
        this.processIncomingEvent('order:created', data);
      } else {
        console.log('[Socket] Order created:', (data as OrderEvent).orderNumber);
        this.emit('order:created', data);
      }
    });

    this.socket.on('order:updated', (data: WrappedEvent<OrderEvent> | OrderEvent) => {
      if ('eventId' in data && 'payload' in data) {
        this.processIncomingEvent('order:updated', data);
      } else {
        console.log('[Socket] Order updated:', (data as OrderEvent).orderNumber);
        this.emit('order:updated', data);
      }
    });

    this.socket.on('order:completed', (data: WrappedEvent<OrderEvent> | OrderEvent) => {
      if ('eventId' in data && 'payload' in data) {
        this.processIncomingEvent('order:completed', data);
      } else {
        console.log('[Socket] Order completed:', (data as OrderEvent).orderNumber);
        this.emit('order:completed', data);
      }
    });

    // Menu events
    this.socket.on('menu:updated', (data: WrappedEvent<MenuUpdateEvent> | MenuUpdateEvent) => {
      if ('eventId' in data && 'payload' in data) {
        this.processIncomingEvent('menu:updated', data);
      } else {
        console.log('[Socket] Menu updated');
        this.emit('menu:updated', data);
      }
    });

    this.socket.on('menu:refresh', (data?: WrappedEvent<unknown>) => {
      if (data && 'eventId' in data) {
        this.processIncomingEvent('menu:refresh', data);
      } else {
        console.log('[Socket] Menu refresh requested');
        this.emit('menu:refresh', {});
      }
    });

    // Sync events
    this.socket.on('sync:status', (data: WrappedEvent<SyncEvent> | SyncEvent) => {
      if ('eventId' in data && 'payload' in data) {
        this.processIncomingEvent('sync:status', data);
      } else {
        console.log('[Socket] Sync status:', (data as SyncEvent).type);
        this.emit('sync:status', data);
      }
    });

    // Terminal events
    this.socket.on('terminal:connected', (data: ConnectedTerminal) => {
      console.log('[Socket] Terminal connected:', data.name);
      this.emit('terminal:connected', data);
    });

    this.socket.on('terminal:disconnected', (data: { terminalId: string; name: string }) => {
      console.log('[Socket] Terminal disconnected:', data.name);
      this.emit('terminal:disconnected', data);
    });
  }

  /**
   * Queue and emit an outgoing event with retry support
   */
  private queueAndEmit<T>(type: string, payload: T): string {
    const eventId = this.generateEventId();
    
    const queuedEvent: QueuedOutgoingEvent = {
      id: eventId,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 5,
      status: 'pending',
    };
    
    this.outgoingQueue.set(eventId, queuedEvent);
    
    // Try to send immediately if connected
    if (this.socket && this.isConnected) {
      queuedEvent.status = 'sent';
      
      this.socket.emit(type, payload, (response: { success: boolean; eventId?: string }) => {
        if (response?.success) {
          queuedEvent.status = 'acked';
          console.log(`[Socket] Event ${eventId} acknowledged by server`);
        } else {
          queuedEvent.status = 'pending';
        }
      });
    }
    
    return eventId;
  }

  /**
   * Register this terminal with the server
   */
  registerTerminal(info: TerminalInfo): Promise<{ success: boolean; connectedTerminals?: ConnectedTerminal[] }> {
    this.terminalInfo = info;
    
    return new Promise((resolve) => {
      if (!this.socket || !this.isConnected) {
        resolve({ success: false });
        return;
      }

      this.socket.emit('terminal:register', info, (response: { success: boolean; connectedTerminals?: ConnectedTerminal[] }) => {
        console.log('[Socket] Terminal registered:', response);
        resolve(response);
      });
    });
  }

  /**
   * Emit order created event (queued with retry)
   */
  emitOrderCreated(order: OrderEvent): string {
    console.log('[Socket] Queueing order:created event');
    return this.queueAndEmit('order:created', order);
  }

  /**
   * Emit order updated event (queued with retry)
   */
  emitOrderUpdated(order: OrderEvent): string {
    console.log('[Socket] Queueing order:updated event');
    return this.queueAndEmit('order:updated', order);
  }

  /**
   * Emit order completed event (queued with retry)
   */
  emitOrderCompleted(order: OrderEvent): string {
    console.log('[Socket] Queueing order:completed event');
    return this.queueAndEmit('order:completed', order);
  }

  /**
   * Emit menu updated event (queued with retry)
   */
  emitMenuUpdated(update: MenuUpdateEvent): string {
    return this.queueAndEmit('menu:updated', update);
  }

  /**
   * Request all POS terminals to refresh their menus
   */
  requestMenuRefresh(locationId?: string): string {
    return this.queueAndEmit('menu:requestRefresh', { locationId });
  }

  /**
   * Emit sync status event
   */
  emitSyncStatus(sync: SyncEvent): string {
    return this.queueAndEmit('sync:status', sync);
  }

  /**
   * Subscribe to an event
   */
  on<T>(event: string, callback: EventCallback<T>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback as EventCallback<unknown>);

    return () => {
      this.eventListeners.get(event)?.delete(callback as EventCallback<unknown>);
    };
  }

  /**
   * Emit event to local listeners
   */
  private emit<T>(event: string, data: T): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[Socket] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): { total: number; pending: number; sent: number; acked: number; failed: number } {
    let pending = 0, sent = 0, acked = 0, failed = 0;
    
    for (const event of this.outgoingQueue.values()) {
      switch (event.status) {
        case 'pending': pending++; break;
        case 'sent': sent++; break;
        case 'acked': acked++; break;
        case 'failed': failed++; break;
      }
    }
    
    return { total: this.outgoingQueue.size, pending, sent, acked, failed };
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    this.stopQueueProcessor();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; serverUrl: string; terminalId?: string; queueStats: { total: number; pending: number; sent: number; acked: number; failed: number } } {
    return {
      connected: this.isConnected,
      serverUrl: this.serverUrl,
      terminalId: this.terminalInfo?.terminalId,
      queueStats: this.getQueueStats(),
    };
  }
}

// Singleton instance
export const socketService = new SocketService();

// React hook for socket events (use hooks from SocketContext.tsx instead)
export function useSocketEvent<T>(event: string, callback: EventCallback<T>): () => void {
  const unsubscribe = socketService.on(event, callback);
  return unsubscribe;
}
