/**
 * Centralized Fetch Wrapper
 * 
 * Provides a single point for fetch interception to avoid conflicts between
 * multiple monitoring systems (ErrorTracker, PerformanceMonitor, etc.)
 */

interface FetchInterceptor {
  id: string;
  priority: number;
  beforeRequest?: (url: string, options?: RequestInit) => Promise<{ url: string; options?: RequestInit }> | { url: string; options?: RequestInit };
  afterResponse?: (response: Response, url: string, duration: number, options?: RequestInit) => Promise<Response> | Response;
  onError?: (error: Error, url: string, duration: number, options?: RequestInit) => void;
}

interface FetchMetrics {
  url: string;
  method: string;
  status: number;
  duration: number;
  size: number;
  timestamp: number;
}

class FetchWrapperManager {
  private interceptors: FetchInterceptor[] = [];
  private originalFetch: typeof fetch;
  private isInitialized = false;
  private metrics: FetchMetrics[] = [];
  private maxMetrics = 1000;

  constructor() {
    this.originalFetch = window.fetch.bind(window);
  }

  /**
   * Initialize the fetch wrapper (should be called once)
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('FetchWrapper already initialized');
      return;
    }

    window.fetch = this.wrappedFetch.bind(this);
    this.isInitialized = true;
    console.log('FetchWrapper initialized');
  }

  /**
   * Register a fetch interceptor
   */
  registerInterceptor(interceptor: FetchInterceptor): void {
    // Remove existing interceptor with same ID
    this.interceptors = this.interceptors.filter(i => i.id !== interceptor.id);
    
    // Add new interceptor and sort by priority (higher priority first)
    this.interceptors.push(interceptor);
    this.interceptors.sort((a, b) => b.priority - a.priority);
    
    console.log(`Registered fetch interceptor: ${interceptor.id} (priority: ${interceptor.priority})`);
  }

  /**
   * Unregister a fetch interceptor
   */
  unregisterInterceptor(id: string): void {
    this.interceptors = this.interceptors.filter(i => i.id !== id);
    console.log(`Unregistered fetch interceptor: ${id}`);
  }

  /**
   * Get fetch metrics
   */
  getMetrics(): FetchMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear fetch metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * The wrapped fetch function
   */
  private async wrappedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const startTime = performance.now();
    let url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    let options = init;

    try {
      // Run beforeRequest interceptors
      for (const interceptor of this.interceptors) {
        if (interceptor.beforeRequest) {
          const result = await interceptor.beforeRequest(url, options);
          url = result.url;
          options = result.options;
        }
      }

      // Make the actual request
      const response = await this.originalFetch(url, options);
      const duration = performance.now() - startTime;

      // Clone response for interceptors (since response can only be read once)
      let processedResponse = response.clone();

      // Run afterResponse interceptors
      for (const interceptor of this.interceptors) {
        if (interceptor.afterResponse) {
          processedResponse = await interceptor.afterResponse(processedResponse, url, duration, options);
        }
      }

      // Record metrics
      this.recordMetrics({
        url,
        method: options?.method || 'GET',
        status: response.status,
        duration,
        size: parseInt(response.headers.get('content-length') || '0'),
        timestamp: Date.now()
      });

      return processedResponse;

    } catch (error) {
      const duration = performance.now() - startTime;

      // Run error interceptors
      for (const interceptor of this.interceptors) {
        if (interceptor.onError) {
          interceptor.onError(error as Error, url, duration, options);
        }
      }

      // Record error metrics
      this.recordMetrics({
        url,
        method: options?.method || 'GET',
        status: 0,
        duration,
        size: 0,
        timestamp: Date.now()
      });

      throw error;
    }
  }

  /**
   * Record fetch metrics
   */
  private recordMetrics(metrics: FetchMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics / 2);
    }
  }
}

// Create singleton instance
export const fetchWrapper = new FetchWrapperManager();

// Initialize immediately
fetchWrapper.initialize();

// Export types and utilities
export type { FetchInterceptor, FetchMetrics };

/**
 * Helper function to create error tracking interceptor
 */
export function createErrorTrackingInterceptor(
  trackAPIError: (endpoint: string, method: string, statusCode: number, error: any) => void
): FetchInterceptor {
  return {
    id: 'error-tracker',
    priority: 100,
    afterResponse: (response, url, duration, options) => {
      if (!response.ok) {
        trackAPIError(
          url,
          options?.method || 'GET',
          response.status,
          { message: `HTTP ${response.status}: ${response.statusText}` }
        );
      }
      return response;
    },
    onError: (error, url, duration, options) => {
      trackAPIError(
        url,
        options?.method || 'GET',
        0,
        { message: error.message, stack: error.stack }
      );
    }
  };
}

/**
 * Helper function to create performance monitoring interceptor
 */
export function createPerformanceMonitoringInterceptor(
  recordNetworkMetric: (name: string, value: number, tags: Record<string, string>) => void
): FetchInterceptor {
  return {
    id: 'performance-monitor',
    priority: 90,
    afterResponse: (response, url, duration, options) => {
      // Record network performance metrics
      recordNetworkMetric('network_request_duration', duration, {
        url: new URL(url).pathname,
        method: options?.method || 'GET',
        status: response.status.toString(),
        type: 'fetch'
      });

      // Record response size if available
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        recordNetworkMetric('network_response_size', parseInt(contentLength), {
          url: new URL(url).pathname,
          method: options?.method || 'GET',
          type: 'fetch'
        });
      }

      return response;
    }
  };
}

/**
 * Helper function to create offline sync interceptor
 */
export function createOfflineSyncInterceptor(
  queueOfflineOperation: (operation: any) => void
): FetchInterceptor {
  return {
    id: 'offline-sync',
    priority: 80,
    onError: (error, url, duration, options) => {
      // Queue operation for offline sync if network error
      if (!navigator.onLine || error.message.includes('fetch')) {
        queueOfflineOperation({
          type: 'network_request',
          url,
          method: options?.method || 'GET',
          body: options?.body,
          headers: options?.headers,
          timestamp: Date.now()
        });
      }
    }
  };
}

export default fetchWrapper;
