/**
 * Hardened Service Worker Messaging
 * 
 * Provides secure communication with service workers, preventing header/body leakage
 * and ensuring data sanitization
 */

interface ServiceWorkerMessage {
  type: string;
  data?: any;
  timestamp: number;
  origin: string;
}

interface QueueOfflineRequestData {
  url: string;
  method: string;
  collection: string;
  documentId: string;
  // Note: headers and body are intentionally excluded for security
}

interface ServiceWorkerMessageHandler {
  type: string;
  handler: (data: any, event: MessageEvent) => Promise<void> | void;
  validator?: (data: any) => boolean;
}

class ServiceWorkerMessagingManager {
  private handlers = new Map<string, ServiceWorkerMessageHandler>();
  private allowedOrigins = new Set<string>();
  private isInitialized = false;

  constructor() {
    // Add current origin as allowed by default
    this.allowedOrigins.add(window.location.origin);
  }

  /**
   * Initialize the service worker messaging system
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('ServiceWorkerMessaging already initialized');
      return;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', this.handleMessage.bind(this));
      this.isInitialized = true;
      console.log('ServiceWorkerMessaging initialized');
    } else {
      console.warn('Service Worker not supported');
    }
  }

  /**
   * Register a message handler for a specific message type
   */
  registerHandler(handler: ServiceWorkerMessageHandler): void {
    this.handlers.set(handler.type, handler);
    console.log(`Registered service worker handler: ${handler.type}`);
  }

  /**
   * Unregister a message handler
   */
  unregisterHandler(type: string): void {
    this.handlers.delete(type);
    console.log(`Unregistered service worker handler: ${type}`);
  }

  /**
   * Add an allowed origin for message validation
   */
  addAllowedOrigin(origin: string): void {
    this.allowedOrigins.add(origin);
  }

  /**
   * Handle incoming service worker messages with security validation
   */
  private async handleMessage(event: MessageEvent): Promise<void> {
    try {
      // Validate message structure
      if (!this.isValidMessage(event)) {
        console.warn('Invalid service worker message received', event);
        return;
      }

      const message = event.data as ServiceWorkerMessage;

      // Validate origin
      if (!this.isAllowedOrigin(message.origin || event.origin)) {
        console.warn('Service worker message from unauthorized origin', message.origin || event.origin);
        return;
      }

      // Validate message age (prevent replay attacks)
      if (!this.isRecentMessage(message.timestamp)) {
        console.warn('Service worker message too old, ignoring');
        return;
      }

      // Find and execute handler
      const handler = this.handlers.get(message.type);
      if (!handler) {
        console.warn(`No handler registered for service worker message type: ${message.type}`);
        return;
      }

      // Validate data if validator exists
      if (handler.validator && !handler.validator(message.data)) {
        console.warn(`Service worker message data validation failed for type: ${message.type}`);
        return;
      }

      // Sanitize data before processing
      const sanitizedData = this.sanitizeMessageData(message.data, message.type);

      // Execute handler
      await handler.handler(sanitizedData, event);

    } catch (error) {
      console.error('Error handling service worker message:', error);
    }
  }

  /**
   * Validate message structure
   */
  private isValidMessage(event: MessageEvent): boolean {
    if (!event.data || typeof event.data !== 'object') {
      return false;
    }

    const message = event.data;
    return (
      typeof message.type === 'string' &&
      typeof message.timestamp === 'number' &&
      message.type.length > 0 &&
      message.type.length < 100 // Prevent excessively long type names
    );
  }

  /**
   * Check if origin is allowed
   */
  private isAllowedOrigin(origin: string): boolean {
    return this.allowedOrigins.has(origin);
  }

  /**
   * Check if message is recent (within 5 minutes)
   */
  private isRecentMessage(timestamp: number): boolean {
    const maxAge = 5 * 60 * 1000; // 5 minutes
    return Date.now() - timestamp < maxAge;
  }

  /**
   * Sanitize message data to prevent leakage
   */
  private sanitizeMessageData(data: any, messageType: string): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Create a clean copy
    const sanitized = { ...data };

    // Remove sensitive fields that should never be passed through service worker messages
    const sensitiveFields = [
      'headers', 'authorization', 'cookie', 'session', 'token', 'password',
      'body', 'payload', 'content', 'data', 'credentials', 'auth'
    ];

    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        delete sanitized[field];
        console.warn(`Removed sensitive field '${field}' from service worker message`);
      }
    });

    // Type-specific sanitization
    if (messageType === 'QUEUE_OFFLINE_REQUEST') {
      return this.sanitizeOfflineRequestData(sanitized);
    }

    return sanitized;
  }

  /**
   * Sanitize offline request data specifically
   */
  private sanitizeOfflineRequestData(data: any): QueueOfflineRequestData {
    const sanitized: Partial<QueueOfflineRequestData> = {};

    // Only allow specific, safe fields
    if (typeof data.url === 'string' && data.url.length < 2000) {
      // Remove query parameters that might contain sensitive data
      try {
        const url = new URL(data.url);
        url.search = ''; // Remove all query parameters
        sanitized.url = url.toString();
      } catch {
        // If URL parsing fails, reject the message
        console.warn('Invalid URL in offline request data');
        return null;
      }
    }

    if (typeof data.method === 'string' && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(data.method.toUpperCase())) {
      sanitized.method = data.method.toUpperCase();
    }

    if (typeof data.collection === 'string' && data.collection.length < 100) {
      sanitized.collection = data.collection.replace(/[^a-zA-Z0-9_-]/g, ''); // Only allow safe characters
    }

    if (typeof data.documentId === 'string' && data.documentId.length < 100) {
      sanitized.documentId = data.documentId.replace(/[^a-zA-Z0-9_-]/g, ''); // Only allow safe characters
    }

    // Validate that all required fields are present
    if (!sanitized.url || !sanitized.method || !sanitized.collection || !sanitized.documentId) {
      console.warn('Missing required fields in offline request data');
      return null;
    }

    return sanitized as QueueOfflineRequestData;
  }

  /**
   * Cleanup when shutting down
   */
  cleanup(): void {
    if (this.isInitialized && 'serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', this.handleMessage.bind(this));
      this.isInitialized = false;
    }
    this.handlers.clear();
  }
}

// Create singleton instance
export const serviceWorkerMessaging = new ServiceWorkerMessagingManager();

// Initialize immediately
serviceWorkerMessaging.initialize();

// Helper function to create a secure offline request handler
export function createOfflineRequestHandler(
  queueOfflineOperation: (operation: QueueOfflineRequestData) => Promise<void>
): ServiceWorkerMessageHandler {
  return {
    type: 'QUEUE_OFFLINE_REQUEST',
    handler: async (data: QueueOfflineRequestData) => {
      if (data) {
        await queueOfflineOperation(data);
      }
    },
    validator: (data: any) => {
      return data && 
             typeof data.url === 'string' && 
             typeof data.method === 'string' && 
             typeof data.collection === 'string' && 
             typeof data.documentId === 'string';
    }
  };
}

export default serviceWorkerMessaging;
