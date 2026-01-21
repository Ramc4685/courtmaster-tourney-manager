/**
 * Clean Performance Monitor
 * 
 * Simplified performance monitoring that integrates with the centralized fetch wrapper
 */

interface NetworkMetric {
  url: string;
  method: string;
  status: number;
  responseTime: number;
  responseSize: number;
  timestamp: number;
  success: boolean;
}

interface CustomMetric {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
}

interface PerformanceConfig {
  enabled: boolean;
  thresholds: {
    apiResponse: number;
    pageLoad: number;
    memoryUsage: number;
  };
}

export class CleanPerformanceMonitor {
  private networkMetrics: NetworkMetric[] = [];
  private customMetrics: CustomMetric[] = [];
  private config: PerformanceConfig;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enabled: true,
      thresholds: {
        apiResponse: 1000,
        pageLoad: 3000,
        memoryUsage: 50 * 1024 * 1024, // 50MB
      },
      ...config
    };

    if (this.config.enabled) {
      this.initNetworkMonitoring();
      this.initCleanup();
    }
  }

  /**
   * Initialize network monitoring with centralized fetch wrapper
   */
  private initNetworkMonitoring(): void {
    // Import fetch wrapper dynamically to avoid circular dependencies
    import('../network/fetchWrapper').then(({ fetchWrapper, createPerformanceMonitoringInterceptor }) => {
      const performanceInterceptor = createPerformanceMonitoringInterceptor(
        (name, value, tags) => {
          // Record custom metric
          this.customMetrics.push({
            name,
            value,
            timestamp: Date.now(),
            tags
          });
          
          // Record network metrics for internal tracking
          if (name === 'network_request_duration') {
            const networkMetric: NetworkMetric = {
              url: tags.url,
              method: tags.method,
              status: parseInt(tags.status),
              responseTime: value,
              responseSize: 0,
              timestamp: Date.now(),
              success: parseInt(tags.status) < 400
            };
            
            this.networkMetrics.push(networkMetric);
            
            // Check response time threshold
            if (value > this.config.thresholds.apiResponse) {
              console.warn(`Slow API response: ${tags.url} took ${value}ms`);
            }
          }
        }
      );
      
      fetchWrapper.registerInterceptor(performanceInterceptor);
      console.log('Performance monitoring initialized with fetch wrapper');
    }).catch(error => {
      console.warn('Failed to initialize network monitoring:', error);
    });
  }

  /**
   * Initialize cleanup intervals
   */
  private initCleanup(): void {
    setInterval(() => {
      // Limit stored metrics to prevent memory leaks
      if (this.networkMetrics.length > 200) {
        this.networkMetrics = this.networkMetrics.slice(-100);
      }
      if (this.customMetrics.length > 500) {
        this.customMetrics = this.customMetrics.slice(-250);
      }
    }, 60000); // Clean up every minute
  }

  /**
   * Get network metrics
   */
  getNetworkMetrics(): NetworkMetric[] {
    return [...this.networkMetrics];
  }

  /**
   * Get custom metrics
   */
  getCustomMetrics(): CustomMetric[] {
    return [...this.customMetrics];
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const recentNetworkMetrics = this.networkMetrics.filter(
      m => Date.now() - m.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );

    const avgResponseTime = recentNetworkMetrics.length > 0
      ? recentNetworkMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentNetworkMetrics.length
      : 0;

    const errorRate = recentNetworkMetrics.length > 0
      ? recentNetworkMetrics.filter(m => !m.success).length / recentNetworkMetrics.length
      : 0;

    return {
      networkRequests: {
        total: recentNetworkMetrics.length,
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 100),
        slowRequests: recentNetworkMetrics.filter(m => m.responseTime > this.config.thresholds.apiResponse).length
      },
      customMetrics: {
        total: this.customMetrics.length,
        recent: this.customMetrics.filter(m => Date.now() - m.timestamp < 5 * 60 * 1000).length
      }
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.networkMetrics = [];
    this.customMetrics = [];
  }
}

// Create and export singleton instance
export const cleanPerformanceMonitor = new CleanPerformanceMonitor();

export default cleanPerformanceMonitor;
