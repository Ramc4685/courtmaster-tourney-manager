/**
 * Comprehensive Performance Monitoring System
 *
 * Tracks Core Web Vitals, custom metrics, memory usage, network performance,
 * and provides real-time performance insights for the CourtMaster application.
 */

interface PerformanceConfig {
  enableCoreWebVitals: boolean;
  enableCustomMetrics: boolean;
  enableMemoryMonitoring: boolean;
  enableNetworkMonitoring: boolean;
  enableUserTiming: boolean;
  sampleRate: number;
  reportingInterval: number; // milliseconds
  thresholds: PerformanceThresholds;
  apiEndpoint?: string;
  apiKey?: string;
}

interface PerformanceThresholds {
  lcp: number; // Largest Contentful Paint (ms)
  fid: number; // First Input Delay (ms)
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint (ms)
  ttfb: number; // Time to First Byte (ms)
  memoryUsage: number; // Memory usage percentage
  routeTransition: number; // Route transition time (ms)
  apiResponse: number; // API response time (ms)
}

interface CoreWebVital {
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB';
  value: number;
  timestamp: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  url: string;
  sessionId: string;
}

interface CustomMetric {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
  context: Record<string, any>;
}

interface MemoryMetric {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
  percentage: number;
}

interface NetworkMetric {
  url: string;
  method: string;
  status: number;
  responseTime: number;
  responseSize: number;
  timestamp: number;
  success: boolean;
}

interface RouteTransition {
  from: string;
  to: string;
  duration: number;
  timestamp: number;
  trigger: 'navigation' | 'programmatic';
}

interface PerformanceReport {
  sessionId: string;
  timestamp: number;
  duration: number;
  coreWebVitals: CoreWebVital[];
  customMetrics: CustomMetric[];
  memoryMetrics: MemoryMetric[];
  networkMetrics: NetworkMetric[];
  routeTransitions: RouteTransition[];
  performanceScore: number;
  recommendations: PerformanceRecommendation[];
}

interface PerformanceRecommendation {
  type: 'lcp' | 'fid' | 'cls' | 'memory' | 'network' | 'bundle';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  impact: string;
  solution: string;
}

interface PerformanceBudget {
  maxLCP: number;
  maxFID: number;
  maxCLS: number;
  maxMemoryUsage: number;
  maxBundleSize: number;
  maxRouteTransition: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;
  
  private config: PerformanceConfig;
  private sessionId: string;
  private startTime: number;
  private coreWebVitals: CoreWebVital[] = [];
  private customMetrics: CustomMetric[] = [];
  private memoryMetrics: MemoryMetric[] = [];
  private networkMetrics: NetworkMetric[] = [];
  private routeTransitions: RouteTransition[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private isMonitoring = false;
  private reportingTimer: NodeJS.Timeout | null = null;
  private currentRoute = '';
  private routeStartTime = 0;

  constructor(config: PerformanceConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.startTime = performance.now();
    this.currentRoute = window.location.pathname;

    // Set static instance for singleton access
    PerformanceMonitor.instance = this;

    this.initializeMonitoring();
  }

  /**
   * Initialize all monitoring systems
   */
  private initializeMonitoring(): void {
    if (this.config.enableCoreWebVitals) {
      this.initCoreWebVitalsMonitoring();
    }

    if (this.config.enableMemoryMonitoring) {
      this.initMemoryMonitoring();
    }

    if (this.config.enableNetworkMonitoring) {
      this.initNetworkMonitoring();
    }

    if (this.config.enableUserTiming) {
      this.initUserTimingMonitoring();
    }

    if (this.config.enableCustomMetrics) {
      this.initCustomMetricsTracking();
    }

    this.initRouteTransitionTracking();
    this.startPeriodicReporting();
    this.isMonitoring = true;
  }

  /**
   * Core Web Vitals monitoring
   */
  private initCoreWebVitalsMonitoring(): void {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const lcp = entry as PerformanceEventTiming;
        this.recordCoreWebVital('LCP', lcp.startTime);
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    this.observers.set('lcp', lcpObserver);

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = entry as PerformanceEventTiming;
        this.recordCoreWebVital('FID', fid.processingStart - fid.startTime);
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
    this.observers.set('fid', fidObserver);

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as any;
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value;
          this.recordCoreWebVital('CLS', clsValue);
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
    this.observers.set('cls', clsObserver);

    // First Contentful Paint (FCP)
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordCoreWebVital('FCP', entry.startTime);
        }
      }
    });
    fcpObserver.observe({ type: 'paint', buffered: true });
    this.observers.set('fcp', fcpObserver);

    // Time to First Byte (TTFB)
    const navigationObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const nav = entry as PerformanceNavigationTiming;
        const ttfb = nav.responseStart - nav.requestStart;
        this.recordCoreWebVital('TTFB', ttfb);
      }
    });
    navigationObserver.observe({ type: 'navigation', buffered: true });
    this.observers.set('navigation', navigationObserver);
  }

  /**
   * Memory monitoring
   */
  private initMemoryMonitoring(): void {
    if (!('memory' in performance)) return;

    const checkMemory = () => {
      const memory = (performance as any).memory;
      const memoryMetric: MemoryMetric = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: Date.now(),
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };

      this.memoryMetrics.push(memoryMetric);

      // Check memory threshold
      if (memoryMetric.percentage > this.config.thresholds.memoryUsage) {
        this.recordCustomMetric('memory_threshold_exceeded', memoryMetric.percentage, {
          category: 'performance',
          severity: 'warning'
        });
      }

      // Limit stored metrics
      if (this.memoryMetrics.length > 100) {
        this.memoryMetrics = this.memoryMetrics.slice(-50);
      }
    };

    // Check memory every 30 seconds
    setInterval(checkMemory, 30000);
    checkMemory(); // Initial check
  }

  /**
   * Network monitoring
   */
  private initNetworkMonitoring(): void {
    // Import fetch wrapper dynamically to avoid circular dependencies
    import('../network/fetchWrapper').then(({ fetchWrapper, createPerformanceMonitoringInterceptor }) => {
      // Register performance monitoring interceptor with centralized fetch wrapper
      const performanceInterceptor = createPerformanceMonitoringInterceptor(
        (name, value, tags) => {
          // Record custom metric (simplified)
          this.customMetrics.push({
            name,
            value,
            timestamp: Date.now(),
            tags,
            context: {
              source: 'network_monitoring',
              interceptor: 'fetchWrapper'
            }
          });
          
          // Also record network metrics for internal tracking
          if (name === 'network_request_duration') {
            const networkMetric: NetworkMetric = {
              url: tags.url,
              method: tags.method,
              status: parseInt(tags.status),
              responseTime: value,
              responseSize: 0, // Will be updated by response size metric
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
    }).catch(error => {
      console.warn('Failed to initialize network monitoring:', error);
    });

    // Limit stored metrics
    setInterval(() => {
      if (this.networkMetrics.length > 200) {
        this.networkMetrics = this.networkMetrics.slice(-100);
      }
      if (this.customMetrics.length > 500) {
        this.customMetrics = this.customMetrics.slice(-250);
      }
    }, 60000); // Clean up every minute
  }

  /**
   * User timing monitoring
   */
  private initUserTimingMonitoring(): void {
    const userTimingObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          this.recordCustomMetric(entry.name, entry.duration, {
            category: 'user-timing',
            type: 'measure'
          });
        }
      }
    });
    userTimingObserver.observe({ entryTypes: ['measure'] });
    this.observers.set('user-timing', userTimingObserver);
  }

  /**
   * Custom metrics tracking
   */
  private initCustomMetricsTracking(): void {
    // Tournament-specific metrics
    this.setupTournamentMetrics();

    // Component render tracking
    this.setupComponentTracking();

    // Bundle loading tracking
    this.setupBundleTracking();
  }

  /**
   * Route transition tracking
   */
  private initRouteTransitionTracking(): void {
    this.routeStartTime = performance.now();

    // Monitor hash changes
    window.addEventListener('hashchange', () => {
      this.trackRouteTransition('navigation');
    });

    // Monitor popstate (back/forward)
    window.addEventListener('popstate', () => {
      this.trackRouteTransition('navigation');
    });

    // Monitor programmatic navigation (via router)
    this.interceptRouterNavigation();
  }

  /**
   * Record Core Web Vital metric
   */
  private recordCoreWebVital(name: CoreWebVital['name'], value: number): void {
    const rating = this.getCoreWebVitalRating(name, value);

    const vital: CoreWebVital = {
      name,
      value,
      timestamp: Date.now(),
      rating,
      url: window.location.href,
      sessionId: this.sessionId
    };

    this.coreWebVitals.push(vital);

    // Check thresholds and emit warnings
    if (rating === 'poor') {
      this.recordCustomMetric(`poor_${name.toLowerCase()}`, value, {
        category: 'core-web-vitals',
        severity: 'warning',
        threshold: this.config.thresholds[name.toLowerCase() as keyof PerformanceThresholds].toString()
      });
    }

    // Limit stored vitals
    if (this.coreWebVitals.length > 50) {
      this.coreWebVitals = this.coreWebVitals.slice(-25);
    }
  }

  /**
   * Record custom metric
   */
  recordCustomMetric(name: string, value: number, tags: Record<string, string> = {}): void {
    const metric: CustomMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
      context: {
        url: window.location.href,
        sessionId: this.sessionId,
        route: this.currentRoute
      }
    };

    this.customMetrics.push(metric);

    // Limit stored metrics
    if (this.customMetrics.length > 500) {
      this.customMetrics = this.customMetrics.slice(-250);
    }
  }

  /**
   * Tournament-specific metrics
   */
  trackTournamentLoad(tournamentId: string, startTime: number): void {
    const loadTime = performance.now() - startTime;
    this.recordCustomMetric('tournament_load_time', loadTime, {
      tournamentId,
      category: 'tournament',
      type: 'load'
    });
  }

  trackMatchScoringTime(matchId: string, startTime: number): void {
    const scoringTime = performance.now() - startTime;
    this.recordCustomMetric('match_scoring_time', scoringTime, {
      matchId,
      category: 'scoring',
      type: 'input'
    });
  }

  trackBracketGenerationTime(tournamentId: string, teamCount: number, startTime: number): void {
    const generationTime = performance.now() - startTime;
    this.recordCustomMetric('bracket_generation_time', generationTime, {
      tournamentId,
      teamCount: teamCount.toString(),
      category: 'tournament',
      type: 'generation'
    });
  }

  trackOfflineSyncTime(operationCount: number, startTime: number): void {
    const syncTime = performance.now() - startTime;
    this.recordCustomMetric('offline_sync_time', syncTime, {
      operationCount: operationCount.toString(),
      category: 'offline',
      type: 'sync'
    });
  }

  /**
   * Component performance tracking
   */
  trackComponentRender(componentName: string, renderTime: number): void {
    this.recordCustomMetric('component_render_time', renderTime, {
      component: componentName,
      category: 'component',
      type: 'render'
    });
  }

  /**
   * Bundle loading tracking
   */
  private setupBundleTracking(): void {
    // Note: Dynamic imports cannot be directly intercepted at runtime
    // Instead, we'll track bundle loading through other means:
    
    // Track resource loading via Performance Observer
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource' && 
              (entry.name.includes('.js') || entry.name.includes('.css'))) {
            this.recordCustomMetric('bundle_load_time', entry.duration, {
              resource: entry.name,
              category: 'bundle',
              type: 'resource-load',
              size: String((entry as PerformanceResourceTiming).transferSize || 0)
            });
          }
        }
      });
      
      observer.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Helper method for components to track their own dynamic imports
   * Usage: await PerformanceMonitor.trackDynamicImport(() => import('./MyComponent'))
   */
  public static async trackDynamicImport<T>(
    importFn: () => Promise<T>, 
    specifier?: string
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const module = await importFn();
      const loadTime = performance.now() - startTime;
      
      if (PerformanceMonitor.instance) {
        PerformanceMonitor.instance.recordCustomMetric('dynamic_import_time', loadTime, {
          specifier: specifier || 'unknown',
          category: 'bundle',
          type: 'dynamic-import'
        });
      }
      
      return module;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      
      if (PerformanceMonitor.instance) {
        PerformanceMonitor.instance.recordCustomMetric('dynamic_import_error', loadTime, {
          specifier: specifier || 'unknown',
          category: 'bundle',
          type: 'dynamic-import-error'
        });
      }
      
      throw error;
    }
  }

  /**
   * Tournament metrics setup
   */
  private setupTournamentMetrics(): void {
    // These would be called by tournament components
    (window as any).__COURTMASTER_PERF_MONITOR__ = this;
  }

  /**
   * Component tracking setup
   */
  private setupComponentTracking(): void {
    // React DevTools profiler integration would go here
    // Components would call this.trackComponentRender()
  }

  /**
   * Route transition tracking
   */
  private trackRouteTransition(trigger: 'navigation' | 'programmatic'): void {
    const endTime = performance.now();
    const duration = endTime - this.routeStartTime;
    const newRoute = window.location.pathname;

    if (this.currentRoute !== newRoute && duration > 50) { // Only track meaningful transitions
      const transition: RouteTransition = {
        from: this.currentRoute,
        to: newRoute,
        duration,
        timestamp: Date.now(),
        trigger
      };

      this.routeTransitions.push(transition);

      // Check route transition threshold
      if (duration > this.config.thresholds.routeTransition) {
        this.recordCustomMetric('slow_route_transition', duration, {
          from: this.currentRoute,
          to: newRoute,
          trigger,
          category: 'navigation'
        });
      }

      // Limit stored transitions
      if (this.routeTransitions.length > 50) {
        this.routeTransitions = this.routeTransitions.slice(-25);
      }
    }

    this.currentRoute = newRoute;
    this.routeStartTime = endTime;
  }

  /**
   * Intercept router navigation for programmatic tracking
   */
  private interceptRouterNavigation(): void {
    // Override history methods
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      this.trackRouteTransition('programmatic');
      return originalPushState.apply(history, args);
    };

    history.replaceState = (...args) => {
      this.trackRouteTransition('programmatic');
      return originalReplaceState.apply(history, args);
    };
  }

  /**
   * Get Core Web Vital rating
   */
  private getCoreWebVitalRating(name: CoreWebVital['name'], value: number): CoreWebVital['rating'] {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[name];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const now = Date.now();
    const duration = performance.now() - this.startTime;

    const report: PerformanceReport = {
      sessionId: this.sessionId,
      timestamp: now,
      duration,
      coreWebVitals: [...this.coreWebVitals],
      customMetrics: [...this.customMetrics],
      memoryMetrics: [...this.memoryMetrics],
      networkMetrics: [...this.networkMetrics],
      routeTransitions: [...this.routeTransitions],
      performanceScore: this.calculatePerformanceScore(),
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(): number {
    let score = 100;

    // Core Web Vitals impact
    const recentVitals = this.coreWebVitals.filter(v => v.timestamp > Date.now() - 60000);
    recentVitals.forEach(vital => {
      switch (vital.rating) {
        case 'poor': score -= 15; break;
        case 'needs-improvement': score -= 8; break;
      }
    });

    // Memory usage impact
    const recentMemory = this.memoryMetrics.filter(m => m.timestamp > Date.now() - 60000);
    if (recentMemory.length > 0) {
      const avgMemoryUsage = recentMemory.reduce((sum, m) => sum + m.percentage, 0) / recentMemory.length;
      if (avgMemoryUsage > 80) score -= 10;
      else if (avgMemoryUsage > 60) score -= 5;
    }

    // Network performance impact
    const recentNetwork = this.networkMetrics.filter(n => n.timestamp > Date.now() - 60000);
    const slowRequests = recentNetwork.filter(n => n.responseTime > this.config.thresholds.apiResponse);
    score -= Math.min(slowRequests.length * 2, 20);

    return Math.max(0, score);
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    // Analyze Core Web Vitals
    const poorLCP = this.coreWebVitals.filter(v => v.name === 'LCP' && v.rating === 'poor');
    if (poorLCP.length > 0) {
      recommendations.push({
        type: 'lcp',
        severity: 'critical',
        message: 'Largest Contentful Paint is poor',
        impact: 'Users experience slow page loading',
        solution: 'Optimize images, implement lazy loading, reduce server response times'
      });
    }

    // Analyze memory usage
    const highMemory = this.memoryMetrics.filter(m => m.percentage > 85);
    if (highMemory.length > 0) {
      recommendations.push({
        type: 'memory',
        severity: 'warning',
        message: 'High memory usage detected',
        impact: 'Application may become sluggish or crash',
        solution: 'Implement memory cleanup, optimize component lifecycle, reduce data caching'
      });
    }

    // Analyze network performance
    const slowRequests = this.networkMetrics.filter(n => n.responseTime > this.config.thresholds.apiResponse);
    if (slowRequests.length > 5) {
      recommendations.push({
        type: 'network',
        severity: 'warning',
        message: 'Multiple slow API requests detected',
        impact: 'Degraded user experience and slower interactions',
        solution: 'Implement request batching, add caching, optimize API responses'
      });
    }

    return recommendations;
  }

  /**
   * Start periodic reporting
   */
  private startPeriodicReporting(): void {
    this.reportingTimer = setInterval(() => {
      if (this.config.apiEndpoint) {
        this.sendReportToService();
      }
    }, this.config.reportingInterval);
  }

  /**
   * Send performance report to service
   */
  private async sendReportToService(): Promise<void> {
    if (!this.config.apiEndpoint || !this.config.apiKey) return;

    try {
      const report = this.generateReport();

      await fetch(`${this.config.apiEndpoint}/performance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(report)
      });
    } catch (error) {
      console.warn('Failed to send performance report:', error);
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;

    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Clear reporting timer
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
      this.reportingTimer = null;
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): any {
    return {
      score: this.calculatePerformanceScore(),
      coreWebVitals: this.coreWebVitals.slice(-10),
      memoryUsage: this.memoryMetrics.slice(-1)[0],
      networkPerformance: {
        averageResponseTime: this.getAverageResponseTime(),
        errorRate: this.getNetworkErrorRate()
      },
      recommendations: this.generateRecommendations()
    };
  }

  // Utility methods
  private generateSessionId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAverageResponseTime(): number {
    const recent = this.networkMetrics.filter(n => n.timestamp > Date.now() - 300000); // Last 5 minutes
    if (recent.length === 0) return 0;
    return recent.reduce((sum, n) => sum + n.responseTime, 0) / recent.length;
  }

  private getNetworkErrorRate(): number {
    const recent = this.networkMetrics.filter(n => n.timestamp > Date.now() - 300000);
    if (recent.length === 0) return 0;
    const errors = recent.filter(n => !n.success).length;
    return (errors / recent.length) * 100;
  }
}

// Default configuration
export const defaultPerformanceConfig: PerformanceConfig = {
  enableCoreWebVitals: true,
  enableCustomMetrics: true,
  enableMemoryMonitoring: true,
  enableNetworkMonitoring: true,
  enableUserTiming: true,
  sampleRate: 1.0,
  reportingInterval: 60000, // 1 minute
  thresholds: {
    lcp: 2500,
    fid: 100,
    cls: 0.1,
    fcp: 1800,
    ttfb: 800,
    memoryUsage: 70,
    routeTransition: 1000,
    apiResponse: 1000
  },
  apiEndpoint: import.meta.env.VITE_PERFORMANCE_ENDPOINT,
  apiKey: import.meta.env.VITE_PERFORMANCE_API_KEY
};

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor(defaultPerformanceConfig);

// Make performance monitor available globally
(window as any).__COURTMASTER_PERF_MONITOR__ = performanceMonitor;