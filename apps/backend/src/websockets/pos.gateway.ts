/**
 * BIZPOS WebSocket Gateway
 * Handles real-time communication between server and clients
 * 
 * Features:
 * - Event Queue: All events are queued before sending
 * - Message ACKs: Clients acknowledge receipt of events
 * - Reconnect Logic: Automatic reconnection handling
 * - Missed Event Replay: Replay unACKed events on reconnect
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { EventQueueService } from './event-queue.service';
import type { EventAck, QueuedEvent } from './event-queue.service';

// Re-define interface locally for decorator metadata
interface EventAckDTO {
  eventId: string;
  terminalId: string;
  timestamp: number;
}

// Event types for type safety
export interface OrderEvent {
  orderId: string;
  orderNumber: number;
  status: string;
  total: number;
  locationId?: string;
  terminalId?: string;
}

export interface MenuUpdateEvent {
  type: 'category' | 'product' | 'modifier' | 'full';
  action: 'create' | 'update' | 'delete' | 'sync';
  data?: any;
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
  locationId: string;
  name: string;
  type: 'pos' | 'admin' | 'owner';
}

// Wrapped event with metadata for ACK tracking
export interface WrappedEvent<T = unknown> {
  eventId: string;
  type: string;
  payload: T;
  timestamp: number;
  requiresAck: boolean;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/pos',
})
export class PosGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('PosGateway');
  private connectedTerminals = new Map<string, TerminalInfo>();
  private eventQueue: EventQueueService;
  private retryInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize event queue service
    this.eventQueue = new EventQueueService();
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    
    // Start retry processor
    this.startRetryProcessor();
  }

  /**
   * Start periodic retry processor for unACKed events
   */
  private startRetryProcessor(): void {
    this.retryInterval = setInterval(() => {
      const eventsToRetry = this.eventQueue.getEventsForRetry();
      
      for (const event of eventsToRetry) {
        this.retryEvent(event);
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Retry sending an event
   */
  private retryEvent(event: QueuedEvent): void {
    this.logger.debug(`Retrying event: ${event.id} (attempt ${event.retryCount + 1})`);
    
    const wrappedEvent: WrappedEvent = {
      eventId: event.id,
      type: event.type,
      payload: event.payload,
      timestamp: event.timestamp,
      requiresAck: true,
    };

    // Emit to location or broadcast
    if (event.locationId) {
      this.server.to(`location:${event.locationId}`).emit(event.type, wrappedEvent);
    } else {
      this.server.emit(event.type, wrappedEvent);
    }

    this.eventQueue.incrementRetry(event.id);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Notify others that a terminal disconnected
    const terminalInfo = this.connectedTerminals.get(client.id);
    if (terminalInfo) {
      this.server.emit('terminal:disconnected', {
        terminalId: terminalInfo.terminalId,
        name: terminalInfo.name,
      });
    }
    
    this.connectedTerminals.delete(client.id);
  }

  // Terminal registration
  @SubscribeMessage('terminal:register')
  handleTerminalRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TerminalInfo,
  ) {
    this.connectedTerminals.set(client.id, data);
    
    // Join location-specific room
    if (data.locationId) {
      client.join(`location:${data.locationId}`);
    }
    
    // Join role-specific room
    client.join(`role:${data.type}`);
    
    this.logger.log(`Terminal registered: ${data.name} (${data.terminalId})`);
    
    // Notify others
    this.server.emit('terminal:connected', {
      terminalId: data.terminalId,
      name: data.name,
      type: data.type,
    });
    
    return { success: true, connectedTerminals: this.getConnectedTerminalsList() };
  }

  // Event acknowledgment handler
  @SubscribeMessage('event:ack')
  handleEventAck(
    @ConnectedSocket() client: Socket,
    @MessageBody() ack: EventAckDTO,
  ) {
    const terminal = this.connectedTerminals.get(client.id);
    if (terminal) {
      ack.terminalId = terminal.terminalId;
    }
    
    const success = this.eventQueue.acknowledgeEvent(ack);
    return { success };
  }

  // Missed event replay request
  @SubscribeMessage('events:replay')
  handleEventsReplay(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lastEventId?: string; lastTimestamp?: number },
  ) {
    const terminal = this.connectedTerminals.get(client.id);
    if (!terminal) {
      return { success: false, error: 'Terminal not registered' };
    }

    const events = this.eventQueue.getEventsForReplay({
      terminalId: terminal.terminalId,
      lastEventId: data.lastEventId,
      lastTimestamp: data.lastTimestamp,
      locationId: terminal.locationId,
    });

    // Send missed events
    for (const event of events) {
      const wrappedEvent: WrappedEvent = {
        eventId: event.id,
        type: event.type,
        payload: event.payload,
        timestamp: event.timestamp,
        requiresAck: true,
      };
      
      client.emit(event.type, wrappedEvent);
    }

    this.logger.log(`Replayed ${events.length} events to terminal ${terminal.name}`);
    return { 
      success: true, 
      replayedCount: events.length,
      events: events.map(e => ({ eventId: e.id, type: e.type, timestamp: e.timestamp }))
    };
  }

  // Get queue statistics
  @SubscribeMessage('queue:stats')
  handleQueueStats() {
    return this.eventQueue.getQueueStats();
  }

  /**
   * Queue and emit an event with ACK tracking
   */
  private queueAndEmit<T>(
    type: string,
    payload: T,
    options: {
      locationId?: string;
      excludeClient?: Socket;
      targetRoles?: string[];
    } = {},
  ): string {
    // Queue the event
    const event = this.eventQueue.queueEvent(type, payload, {
      locationId: options.locationId,
    });

    // Create wrapped event
    const wrappedEvent: WrappedEvent<T> = {
      eventId: event.id,
      type,
      payload,
      timestamp: event.timestamp,
      requiresAck: true,
    };

    // Emit based on options
    if (options.excludeClient) {
      if (options.locationId) {
        options.excludeClient.to(`location:${options.locationId}`).emit(type, wrappedEvent);
      } else {
        options.excludeClient.broadcast.emit(type, wrappedEvent);
      }
    } else {
      if (options.locationId) {
        this.server.to(`location:${options.locationId}`).emit(type, wrappedEvent);
      } else {
        this.server.emit(type, wrappedEvent);
      }
    }

    // Also send to specific roles if requested
    if (options.targetRoles) {
      for (const role of options.targetRoles) {
        this.server.to(`role:${role}`).emit(type, wrappedEvent);
      }
    }

    this.eventQueue.markEventSent(event.id);
    return event.id;
  }

  // Order events
  @SubscribeMessage('order:created')
  handleOrderCreated(
    @ConnectedSocket() client: Socket,
    @MessageBody() order: OrderEvent,
  ) {
    this.logger.log(`Order created: #${order.orderNumber}`);
    
    const eventId = this.queueAndEmit('order:created', order, {
      locationId: order.locationId,
      excludeClient: client,
      targetRoles: ['admin', 'owner'],
    });
    
    return { success: true, eventId };
  }

  @SubscribeMessage('order:updated')
  handleOrderUpdated(
    @ConnectedSocket() client: Socket,
    @MessageBody() order: OrderEvent,
  ) {
    this.logger.log(`Order updated: #${order.orderNumber} - ${order.status}`);
    
    const eventId = this.queueAndEmit('order:updated', order, {
      locationId: order.locationId,
      excludeClient: client,
      targetRoles: ['admin', 'owner'],
    });
    
    return { success: true, eventId };
  }

  @SubscribeMessage('order:completed')
  handleOrderCompleted(
    @ConnectedSocket() client: Socket,
    @MessageBody() order: OrderEvent,
  ) {
    this.logger.log(`Order completed: #${order.orderNumber}`);
    
    const eventId = this.queueAndEmit('order:completed', order, {
      locationId: order.locationId,
    });
    
    return { success: true, eventId };
  }

  // Menu update events
  @SubscribeMessage('menu:updated')
  handleMenuUpdated(
    @ConnectedSocket() client: Socket,
    @MessageBody() update: MenuUpdateEvent,
  ) {
    this.logger.log(`Menu updated: ${update.type} - ${update.action}`);
    
    const eventId = this.queueAndEmit('menu:updated', update, {
      locationId: update.locationId,
      excludeClient: client,
      targetRoles: ['pos'],
    });
    
    return { success: true, eventId };
  }

  // Sync events
  @SubscribeMessage('sync:status')
  handleSyncStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() sync: SyncEvent,
  ) {
    this.logger.log(`Sync ${sync.type}: ${sync.status}`);
    
    const eventId = this.queueAndEmit('sync:status', sync, {
      targetRoles: ['admin', 'owner'],
    });
    
    return { success: true, eventId };
  }

  // Request menu refresh (from owner/admin to POS terminals)
  @SubscribeMessage('menu:requestRefresh')
  handleMenuRefreshRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { locationId?: string },
  ) {
    this.logger.log('Menu refresh requested');
    
    const eventId = this.queueAndEmit('menu:refresh', data, {
      locationId: data.locationId,
      targetRoles: ['pos'],
    });
    
    return { success: true, eventId };
  }

  // Get connected terminals list
  private getConnectedTerminalsList() {
    return Array.from(this.connectedTerminals.values());
  }

  // Public method to emit events from other services
  emitOrderEvent(event: string, order: OrderEvent): string {
    return this.queueAndEmit(event, order, { locationId: order.locationId });
  }

  emitMenuUpdate(update: MenuUpdateEvent): string {
    return this.queueAndEmit('menu:updated', update, { 
      locationId: update.locationId,
      targetRoles: ['pos'],
    });
  }

  emitToLocation(locationId: string, event: string, data: any): string {
    return this.queueAndEmit(event, data, { locationId });
  }
}
