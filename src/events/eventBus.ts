/**
 * Event Bus for CourtMaster Tournament Management System
 * 
 * Provides a centralized event system for broadcasting and listening to application events.
 * This implementation uses a simple event emitter pattern to decouple components.
 */

// Define event types for tournament lifecycle events
export enum EventType {
  // Registration events
  REGISTRATION_CREATED = 'REGISTRATION_CREATED',
  REGISTRATION_APPROVED = 'REGISTRATION_APPROVED',
  REGISTRATION_REJECTED = 'REGISTRATION_REJECTED',
  REGISTRATION_UPDATED = 'REGISTRATION_UPDATED',
  REGISTRATION_WAITLISTED = 'REGISTRATION_WAITLISTED',
  
  // Match events
  MATCH_CREATED = 'MATCH_CREATED',
  MATCH_SCHEDULED = 'MATCH_SCHEDULED',
  MATCH_STARTED = 'MATCH_STARTED',
  MATCH_COMPLETED = 'MATCH_COMPLETED',
  MATCH_UPDATED = 'MATCH_UPDATED',
  MATCH_SCORE_UPDATED = 'MATCH_SCORE_UPDATED',
  MATCH_COURT_ASSIGNED = 'MATCH_COURT_ASSIGNED',
  MATCH_CANCELLED = 'MATCH_CANCELLED',
  SCORE_UPDATED = 'SCORE_UPDATED',
  
  // Tournament events
  TOURNAMENT_CREATED = 'TOURNAMENT_CREATED',
  TOURNAMENT_UPDATED = 'TOURNAMENT_UPDATED',
  TOURNAMENT_PUBLISHED = 'TOURNAMENT_PUBLISHED',
  TOURNAMENT_CANCELED = 'TOURNAMENT_CANCELED',

  // Court events
  COURT_ASSIGNED = 'COURT_ASSIGNED',
  COURT_RELEASED = 'COURT_RELEASED',
  COURT_STATUS_UPDATED = 'COURT_STATUS_UPDATED',
  
  // Check-in events
  CHECK_IN_COMPLETED = 'CHECK_IN_COMPLETED',
  CHECK_IN_CANCELED = 'CHECK_IN_CANCELED',
  PARTICIPANT_CHECKED_IN = 'PARTICIPANT_CHECKED_IN',
  
  // Communication events
  ANNOUNCEMENT_CREATED = 'ANNOUNCEMENT_CREATED',
  ANNOUNCEMENT_UPDATED = 'ANNOUNCEMENT_UPDATED',
  MESSAGE_SENT = 'MESSAGE_SENT',
  WAIVER_SIGNED = 'WAIVER_SIGNED',
  
  // System events
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SYNC_COMPLETED = 'SYNC_COMPLETED'
}

// Defines the payload structure for events
export interface EventPayload<T = any> {
  type: EventType;
  data: T;
  timestamp: number;
  source?: string;
}

// Define event handler function type
export type EventHandler<T = any> = (payload: EventPayload<T>) => void;

// Event Bus implementation
class EventBus {
  private listeners: Map<EventType, Set<EventHandler>> = new Map();
  
  /**
   * Subscribe to an event
   * @param eventType The event type to subscribe to
   * @param handler The callback function to execute when the event occurs
   * @returns An unsubscribe function
   */
  public subscribe<T = any>(eventType: EventType, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)?.add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.listeners.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }
  
  /**
   * Emit an event to all subscribers
   * @param eventType The type of event to emit
   * @param data The event data
   * @param source Optional source of the event (component or service name)
   */
  public emit<T = any>(eventType: EventType, data: T, source?: string): void {
    const handlers = this.listeners.get(eventType);
    
    if (handlers) {
      const payload: EventPayload<T> = {
        type: eventType,
        data,
        timestamp: Date.now(),
        source
      };
      
      // Execute all handlers for this event type
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error);
        }
      });
    }
  }
  
  /**
   * Subscribe to multiple event types at once
   * @param eventTypes Array of event types to subscribe to
   * @param handler The callback function to execute when any of the events occur
   * @returns An array of unsubscribe functions
   */
  public subscribeToMany<T = any>(eventTypes: EventType[], handler: EventHandler<T>): (() => void)[] {
    return eventTypes.map(eventType => this.subscribe(eventType, handler));
  }
  
  /**
   * Remove all subscriptions for a specific event type
   * @param eventType The event type to clear listeners for
   */
  public clearEventListeners(eventType: EventType): void {
    this.listeners.delete(eventType);
  }
  
  /**
   * Remove all subscriptions
   */
  public clearAllListeners(): void {
    this.listeners.clear();
  }
}

// Create a singleton instance of EventBus
const eventBusInstance = new EventBus();

// Export both named and default exports
export const eventBus = eventBusInstance;
export default eventBusInstance;
