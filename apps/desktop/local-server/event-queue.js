/**
 * BIZPOS Local Event Queue
 * Handles event storage, ACKs, and replay for reliable message delivery on LAN
 * 
 * Flow:
 * 1. Event created → Added to QUEUE with unique ID
 * 2. Event sent via WebSocket
 * 3. Client sends ACK → Event marked as delivered
 * 4. If no ACK → Retry with exponential backoff
 * 5. On reconnect → Replay all unACKed events since last seen
 */

class LocalEventQueue {
  constructor() {
    // In-memory event store
    this.eventQueue = new Map();
    
    // Track last seen event per terminal
    this.terminalLastSeen = new Map();
    
    // Configuration
    this.retentionPeriodMs = 24 * 60 * 60 * 1000; // 24 hours
    this.maxEventsInQueue = 10000;
    this.baseRetryDelayMs = 1000;
    this.maxRetryDelayMs = 30000;
    
    // Start cleanup interval
    setInterval(() => this.cleanupOldEvents(), 60 * 1000);
    
    console.log('[EventQueue] Initialized');
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add event to queue
   */
  queueEvent(type, payload, options = {}) {
    const eventId = this.generateEventId();
    const now = Date.now();

    const event = {
      id: eventId,
      type,
      payload,
      timestamp: now,
      locationId: options.locationId,
      retryCount: 0,
      maxRetries: options.maxRetries || 5,
      status: 'pending',
      targetSocketIds: options.targetSocketIds,
      ackedBy: new Set(),
      createdAt: new Date(),
      sentAt: null,
      deliveredAt: null,
    };

    this.eventQueue.set(eventId, event);

    // Enforce max queue size
    if (this.eventQueue.size > this.maxEventsInQueue) {
      this.cleanupOldestEvents();
    }

    return event;
  }

  /**
   * Mark event as sent
   */
  markEventSent(eventId) {
    const event = this.eventQueue.get(eventId);
    if (event) {
      event.status = 'sent';
      event.sentAt = new Date();
    }
  }

  /**
   * Process ACK from client
   */
  acknowledgeEvent(ack) {
    const event = this.eventQueue.get(ack.eventId);
    if (!event) {
      console.warn(`[EventQueue] ACK for unknown event: ${ack.eventId}`);
      return false;
    }

    event.ackedBy.add(ack.terminalId);
    
    // Update terminal's last seen
    this.terminalLastSeen.set(ack.terminalId, {
      eventId: ack.eventId,
      timestamp: ack.timestamp,
    });

    // Check if all targets have ACKed
    if (!event.targetSocketIds || event.targetSocketIds.every(id => event.ackedBy.has(id))) {
      event.status = 'delivered';
      event.deliveredAt = new Date();
    }

    return true;
  }

  /**
   * Get events that need retry
   */
  getEventsForRetry() {
    const now = Date.now();
    const eventsToRetry = [];

    for (const event of this.eventQueue.values()) {
      if (event.status === 'sent' && event.retryCount < event.maxRetries) {
        const retryDelay = this.calculateRetryDelay(event.retryCount);
        const sentAt = event.sentAt?.getTime() || now;
        
        if (now - sentAt > retryDelay) {
          eventsToRetry.push(event);
        }
      }
    }

    return eventsToRetry;
  }

  /**
   * Increment retry count for event
   */
  incrementRetry(eventId) {
    const event = this.eventQueue.get(eventId);
    if (event) {
      event.retryCount++;
      event.status = 'pending';
      
      if (event.retryCount >= event.maxRetries) {
        event.status = 'failed';
        console.warn(`[EventQueue] Event failed after ${event.retryCount} retries: ${eventId}`);
      }
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(retryCount) {
    const delay = this.baseRetryDelayMs * Math.pow(2, retryCount);
    return Math.min(delay, this.maxRetryDelayMs);
  }

  /**
   * Get events for replay on reconnect
   */
  getEventsForReplay(request) {
    const events = [];
    let startTimestamp = request.lastTimestamp || 0;

    // If we have last event ID, find its timestamp
    if (request.lastEventId) {
      const lastEvent = this.eventQueue.get(request.lastEventId);
      if (lastEvent) {
        startTimestamp = lastEvent.timestamp;
      }
    }

    // Get events after the last seen timestamp
    for (const event of this.eventQueue.values()) {
      // Skip if event is before last seen
      if (event.timestamp <= startTimestamp) continue;
      
      // Skip if already ACKed by this terminal
      if (event.ackedBy.has(request.terminalId)) continue;
      
      // Filter by location if specified
      if (request.locationId && event.locationId && event.locationId !== request.locationId) {
        continue;
      }

      // Only replay non-failed events
      if (event.status !== 'failed') {
        events.push(event);
      }
    }

    // Sort by timestamp
    events.sort((a, b) => a.timestamp - b.timestamp);
    
    console.log(`[EventQueue] Replay request from ${request.terminalId}: ${events.length} events`);
    return events;
  }

  /**
   * Update terminal's last seen event
   */
  updateTerminalLastSeen(terminalId, eventId) {
    const event = this.eventQueue.get(eventId);
    if (event) {
      this.terminalLastSeen.set(terminalId, {
        eventId,
        timestamp: event.timestamp,
      });
    }
  }

  /**
   * Get terminal's last seen event
   */
  getTerminalLastSeen(terminalId) {
    return this.terminalLastSeen.get(terminalId);
  }

  /**
   * Clean up old events
   */
  cleanupOldEvents() {
    const cutoffTime = Date.now() - this.retentionPeriodMs;
    let cleaned = 0;

    for (const [eventId, event] of this.eventQueue.entries()) {
      if (event.timestamp < cutoffTime) {
        this.eventQueue.delete(eventId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[EventQueue] Cleaned ${cleaned} old events`);
    }
  }

  /**
   * Clean up oldest events when queue is full
   */
  cleanupOldestEvents() {
    const events = Array.from(this.eventQueue.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = Math.floor(events.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.eventQueue.delete(events[i][0]);
    }

    console.log(`[EventQueue] Cleaned ${toRemove} oldest events`);
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    let pending = 0, sent = 0, delivered = 0, failed = 0;

    for (const event of this.eventQueue.values()) {
      switch (event.status) {
        case 'pending': pending++; break;
        case 'sent': sent++; break;
        case 'delivered': delivered++; break;
        case 'failed': failed++; break;
      }
    }

    return { total: this.eventQueue.size, pending, sent, delivered, failed };
  }

  /**
   * Get event by ID
   */
  getEvent(eventId) {
    return this.eventQueue.get(eventId);
  }
}

module.exports = { LocalEventQueue };
