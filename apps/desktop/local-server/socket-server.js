/**
 * BIZPOS Local WebSocket Server
 * Handles real-time communication between POS terminals on LAN
 * 
 * Features:
 * - Event Queue: All events are queued before sending
 * - Message ACKs: Clients acknowledge receipt of events
 * - Reconnect Logic: Automatic reconnection handling
 * - Missed Event Replay: Replay unACKed events on reconnect
 */

const { Server } = require('socket.io');
const { LocalEventQueue } = require('./event-queue');

class LocalSocketServer {
  constructor() {
    this.io = null;
    this.connectedTerminals = new Map();
    this.eventQueue = new LocalEventQueue();
    this.retryInterval = null;
    this.logger = console;
  }

  /**
   * Initialize Socket.IO server attached to HTTP server
   */
  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/socket.io',
    });

    // Create POS namespace
    const posNamespace = this.io.of('/pos');

    posNamespace.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    // Start retry processor
    this.startRetryProcessor();

    this.logger.log('[LocalSocket] WebSocket server initialized with event queue');
    return this.io;
  }

  /**
   * Start periodic retry processor for unACKed events
   */
  startRetryProcessor() {
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
  retryEvent(event) {
    this.logger.log(`[LocalSocket] Retrying event: ${event.id} (attempt ${event.retryCount + 1})`);
    
    const wrappedEvent = {
      eventId: event.id,
      type: event.type,
      payload: event.payload,
      timestamp: event.timestamp,
      requiresAck: true,
    };

    // Emit to location or broadcast
    if (event.locationId) {
      this.io.of('/pos').to(`location:${event.locationId}`).emit(event.type, wrappedEvent);
    } else {
      this.io.of('/pos').emit(event.type, wrappedEvent);
    }

    this.eventQueue.incrementRetry(event.id);
  }

  /**
   * Queue and emit an event with ACK tracking
   */
  queueAndEmit(socket, type, payload, options = {}) {
    // Queue the event
    const event = this.eventQueue.queueEvent(type, payload, {
      locationId: options.locationId,
    });

    // Create wrapped event
    const wrappedEvent = {
      eventId: event.id,
      type,
      payload,
      timestamp: event.timestamp,
      requiresAck: true,
    };

    // Emit based on options
    if (options.broadcast && socket) {
      socket.broadcast.emit(type, wrappedEvent);
    } else if (options.locationId) {
      this.io.of('/pos').to(`location:${options.locationId}`).emit(type, wrappedEvent);
    } else {
      this.io.of('/pos').emit(type, wrappedEvent);
    }

    // Also send to specific roles if requested
    if (options.targetRoles) {
      for (const role of options.targetRoles) {
        this.io.of('/pos').to(`role:${role}`).emit(type, wrappedEvent);
      }
    }

    this.eventQueue.markEventSent(event.id);
    return event.id;
  }

  /**
   * Handle new socket connection
   */
  handleConnection(socket) {
    this.logger.log(`[LocalSocket] Socket connected: ${socket.id}`);

    // Terminal registration
    socket.on('terminal:register', (data, callback) => {
      this.handleTerminalRegister(socket, data, callback);
    });

    // Event acknowledgment
    socket.on('event:ack', (ack, callback) => {
      this.handleEventAck(socket, ack, callback);
    });

    // Event replay request
    socket.on('events:replay', (data, callback) => {
      this.handleEventsReplay(socket, data, callback);
    });

    // Queue stats
    socket.on('queue:stats', (data, callback) => {
      if (callback) {
        callback(this.eventQueue.getQueueStats());
      }
    });

    // Order events
    socket.on('order:created', (data, callback) => {
      this.handleOrderCreated(socket, data, callback);
    });

    socket.on('order:updated', (data, callback) => {
      this.handleOrderUpdated(socket, data, callback);
    });

    socket.on('order:completed', (data, callback) => {
      this.handleOrderCompleted(socket, data, callback);
    });

    // Menu events
    socket.on('menu:updated', (data, callback) => {
      this.handleMenuUpdated(socket, data, callback);
    });

    socket.on('menu:requestRefresh', (data, callback) => {
      this.handleMenuRefreshRequest(socket, data, callback);
    });

    // Sync events
    socket.on('sync:status', (data, callback) => {
      this.handleSyncStatus(socket, data, callback);
    });

    // Disconnect
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  /**
   * Handle terminal registration
   */
  handleTerminalRegister(socket, data, callback) {
    const terminalInfo = {
      terminalId: data.terminalId || `terminal-${Date.now()}`,
      locationId: data.locationId || 'local',
      name: data.name || 'POS Terminal',
      type: data.type || 'pos',
      socketId: socket.id,
    };

    this.connectedTerminals.set(socket.id, terminalInfo);

    // Join location room
    if (terminalInfo.locationId) {
      socket.join(`location:${terminalInfo.locationId}`);
    }

    // Join role room
    socket.join(`role:${terminalInfo.type}`);

    this.logger.log(`[LocalSocket] Terminal registered: ${terminalInfo.name} (${terminalInfo.terminalId})`);

    // Notify other terminals
    socket.broadcast.emit('terminal:connected', {
      terminalId: terminalInfo.terminalId,
      name: terminalInfo.name,
      type: terminalInfo.type,
    });

    if (callback) {
      callback({
        success: true,
        connectedTerminals: this.getConnectedTerminalsList(),
      });
    }
  }

  /**
   * Handle event acknowledgment
   */
  handleEventAck(socket, ack, callback) {
    const terminal = this.connectedTerminals.get(socket.id);
    if (terminal) {
      ack.terminalId = terminal.terminalId;
    }
    
    const success = this.eventQueue.acknowledgeEvent(ack);
    
    if (callback) {
      callback({ success });
    }
  }

  /**
   * Handle events replay request
   */
  handleEventsReplay(socket, data, callback) {
    const terminal = this.connectedTerminals.get(socket.id);
    if (!terminal) {
      if (callback) {
        callback({ success: false, error: 'Terminal not registered' });
      }
      return;
    }

    const events = this.eventQueue.getEventsForReplay({
      terminalId: terminal.terminalId,
      lastEventId: data.lastEventId,
      lastTimestamp: data.lastTimestamp,
      locationId: terminal.locationId,
    });

    // Send missed events
    for (const event of events) {
      const wrappedEvent = {
        eventId: event.id,
        type: event.type,
        payload: event.payload,
        timestamp: event.timestamp,
        requiresAck: true,
      };
      
      socket.emit(event.type, wrappedEvent);
    }

    this.logger.log(`[LocalSocket] Replayed ${events.length} events to terminal ${terminal.name}`);
    
    if (callback) {
      callback({ 
        success: true, 
        replayedCount: events.length,
        events: events.map(e => ({ eventId: e.id, type: e.type, timestamp: e.timestamp }))
      });
    }
  }

  /**
   * Handle order created
   */
  handleOrderCreated(socket, order, callback) {
    this.logger.log(`[LocalSocket] Order created: #${order.orderNumber}`);

    const eventId = this.queueAndEmit(socket, 'order:created', order, {
      broadcast: true,
      locationId: order.locationId,
      targetRoles: ['admin', 'owner'],
    });

    if (callback) {
      callback({ success: true, eventId });
    }
  }

  /**
   * Handle order updated
   */
  handleOrderUpdated(socket, order, callback) {
    this.logger.log(`[LocalSocket] Order updated: #${order.orderNumber} - ${order.status}`);

    const eventId = this.queueAndEmit(socket, 'order:updated', order, {
      broadcast: true,
      locationId: order.locationId,
      targetRoles: ['admin', 'owner'],
    });

    if (callback) {
      callback({ success: true, eventId });
    }
  }

  /**
   * Handle order completed
   */
  handleOrderCompleted(socket, order, callback) {
    this.logger.log(`[LocalSocket] Order completed: #${order.orderNumber}`);

    const eventId = this.queueAndEmit(null, 'order:completed', order, {
      locationId: order.locationId,
    });

    if (callback) {
      callback({ success: true, eventId });
    }
  }

  /**
   * Handle menu updated
   */
  handleMenuUpdated(socket, update, callback) {
    this.logger.log(`[LocalSocket] Menu updated: ${update.type} - ${update.action}`);

    const eventId = this.queueAndEmit(socket, 'menu:updated', update, {
      locationId: update.locationId,
      targetRoles: ['pos'],
    });

    if (callback) {
      callback({ success: true, eventId });
    }
  }

  /**
   * Handle menu refresh request
   */
  handleMenuRefreshRequest(socket, data, callback) {
    this.logger.log('[LocalSocket] Menu refresh requested');

    const eventId = this.queueAndEmit(null, 'menu:refresh', data, {
      locationId: data?.locationId,
      targetRoles: ['pos'],
    });

    if (callback) {
      callback({ success: true, eventId });
    }
  }

  /**
   * Handle sync status
   */
  handleSyncStatus(socket, sync, callback) {
    this.logger.log(`[LocalSocket] Sync ${sync.type}: ${sync.status}`);

    const eventId = this.queueAndEmit(socket, 'sync:status', sync, {
      broadcast: true,
      targetRoles: ['admin', 'owner'],
    });

    if (callback) {
      callback({ success: true, eventId });
    }
  }

  /**
   * Handle disconnect
   */
  handleDisconnect(socket) {
    this.logger.log(`[LocalSocket] Socket disconnected: ${socket.id}`);

    const terminalInfo = this.connectedTerminals.get(socket.id);
    this.connectedTerminals.delete(socket.id);

    if (terminalInfo) {
      // Notify others
      this.io.of('/pos').emit('terminal:disconnected', {
        terminalId: terminalInfo.terminalId,
        name: terminalInfo.name,
      });
    }
  }

  /**
   * Get list of connected terminals
   */
  getConnectedTerminalsList() {
    return Array.from(this.connectedTerminals.values()).map((t) => ({
      terminalId: t.terminalId,
      name: t.name,
      type: t.type,
    }));
  }

  /**
   * Emit order event from server
   */
  emitOrderEvent(event, order) {
    if (this.io) {
      return this.queueAndEmit(null, event, order, { locationId: order.locationId });
    }
  }

  /**
   * Emit menu update from server
   */
  emitMenuUpdate(update) {
    if (this.io) {
      return this.queueAndEmit(null, 'menu:updated', update, {
        locationId: update.locationId,
        targetRoles: ['pos'],
      });
    }
  }

  /**
   * Emit to specific location
   */
  emitToLocation(locationId, event, data) {
    if (this.io) {
      return this.queueAndEmit(null, event, data, { locationId });
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return this.eventQueue.getQueueStats();
  }
}

module.exports = { LocalSocketServer };
