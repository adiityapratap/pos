/**
 * BIZPOS Event Queue Service
 * Handles event storage, ACKs, and replay for reliable message delivery
 * 
 * Flow:
 * 1. Event created → Added to QUEUE with unique ID
 * 2. Event sent via WebSocket
 * 3. Client sends ACK → Event marked as delivered
 * 4. If no ACK → Retry with exponential backoff
 * 5. On reconnect → Replay all unACKed events since last seen
 */

import { Injectable, Logger } from '@nestjs/common';

export interface QueuedEvent {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
  locationId?: string;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  targetSocketIds?: string[];
  ackedBy: Set<string>;
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
}

export interface EventAck {
  eventId: string;
  terminalId: string;
  timestamp: number;
}

export interface ReplayRequest {
  terminalId: string;
  lastEventId?: string;
  lastTimestamp?: number;
  locationId?: string;
}

@Injectable()
export class EventQueueService {
  private readonly logger = new Logger('EventQueueService');
  
  // In-memory event store (in production, use Redis or database)
  private eventQueue: Map<string, QueuedEvent> = new Map();
  
  // Track last seen event per terminal for replay
  private terminalLastSeen: Map<string, { eventId: string; timestamp: number }> = new Map();
  
  // Event retention period (24 hours)
  private readonly retentionPeriodMs = 24 * 60 * 60 * 1000;
  
  // Max events to store
  private readonly maxEventsInQueue = 10000;
  
  // Retry configuration
  private readonly baseRetryDelayMs = 1000;
  private readonly maxRetryDelayMs = 30000;

  constructor() {
    // Clean up old events periodically
    setInterval(() => this.cleanupOldEvents(), 60 * 1000);
  }

  /**
   * Generate unique event ID
   */
  generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add event to queue
   */
  queueEvent(
    type: string,
    payload: unknown,
    options: {
      locationId?: string;
      targetSocketIds?: string[];
      maxRetries?: number;
    } = {},
  ): QueuedEvent {
    const eventId = this.generateEventId();
    const now = Date.now();

    const event: QueuedEvent = {
      id: eventId,
      type,
      payload,
      timestamp: now,
      locationId: options.locationId,
      retryCount: 0,
      maxRetries: options.maxRetries ?? 5,
      status: 'pending',
      targetSocketIds: options.targetSocketIds,
      ackedBy: new Set(),
      createdAt: new Date(),
    };

    this.eventQueue.set(eventId, event);
    this.logger.debug(`Event queued: ${eventId} (${type})`);

    // Enforce max queue size
    if (this.eventQueue.size > this.maxEventsInQueue) {
      this.cleanupOldestEvents();
    }

    return event;
  }

  /**
   * Mark event as sent
   */
  markEventSent(eventId: string): void {
    const event = this.eventQueue.get(eventId);
    if (event) {
      event.status = 'sent';
      event.sentAt = new Date();
      this.logger.debug(`Event sent: ${eventId}`);
    }
  }

  /**
   * Process ACK from client
   */
  acknowledgeEvent(ack: EventAck): boolean {
    const event = this.eventQueue.get(ack.eventId);
    if (!event) {
      this.logger.warn(`ACK for unknown event: ${ack.eventId}`);
      return false;
    }

    event.ackedBy.add(ack.terminalId);
    
    // Update terminal's last seen
    this.terminalLastSeen.set(ack.terminalId, {
      eventId: ack.eventId,
      timestamp: ack.timestamp,
    });

    // Check if all targets have ACKed (or no specific targets)
    if (!event.targetSocketIds || event.targetSocketIds.every(id => event.ackedBy.has(id))) {
      event.status = 'delivered';
      event.deliveredAt = new Date();
      this.logger.debug(`Event delivered: ${ack.eventId} (ACKed by ${ack.terminalId})`);
    }

    return true;
  }

  /**
   * Get events that need retry
   */
  getEventsForRetry(): QueuedEvent[] {
    const now = Date.now();
    const eventsToRetry: QueuedEvent[] = [];

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
  incrementRetry(eventId: string): void {
    const event = this.eventQueue.get(eventId);
    if (event) {
      event.retryCount++;
      event.status = 'pending';
      
      if (event.retryCount >= event.maxRetries) {
        event.status = 'failed';
        this.logger.warn(`Event failed after ${event.retryCount} retries: ${eventId}`);
      }
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    const delay = this.baseRetryDelayMs * Math.pow(2, retryCount);
    return Math.min(delay, this.maxRetryDelayMs);
  }

  /**
   * Get events for replay on reconnect
   */
  getEventsForReplay(request: ReplayRequest): QueuedEvent[] {
    const events: QueuedEvent[] = [];
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
      
      // Skip if event was already ACKed by this terminal
      if (event.ackedBy.has(request.terminalId)) continue;
      
      // Filter by location if specified
      if (request.locationId && event.locationId && event.locationId !== request.locationId) {
        continue;
      }

      // Only replay sent/pending events (not failed)
      if (event.status !== 'failed') {
        events.push(event);
      }
    }

    // Sort by timestamp
    events.sort((a, b) => a.timestamp - b.timestamp);
    
    this.logger.log(`Replay request from ${request.terminalId}: ${events.length} events to replay`);
    return events;
  }

  /**
   * Update terminal's last seen event
   */
  updateTerminalLastSeen(terminalId: string, eventId: string): void {
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
  getTerminalLastSeen(terminalId: string): { eventId: string; timestamp: number } | undefined {
    return this.terminalLastSeen.get(terminalId);
  }

  /**
   * Clean up old events
   */
  private cleanupOldEvents(): void {
    const cutoffTime = Date.now() - this.retentionPeriodMs;
    let cleaned = 0;

    for (const [eventId, event] of this.eventQueue.entries()) {
      if (event.timestamp < cutoffTime) {
        this.eventQueue.delete(eventId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} old events`);
    }
  }

  /**
   * Clean up oldest events when queue is full
   */
  private cleanupOldestEvents(): void {
    const events = Array.from(this.eventQueue.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 10%
    const toRemove = Math.floor(events.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.eventQueue.delete(events[i][0]);
    }

    this.logger.debug(`Cleaned up ${toRemove} oldest events (queue was full)`);
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): {
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
  } {
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
  getEvent(eventId: string): QueuedEvent | undefined {
    return this.eventQueue.get(eventId);
  }
}
