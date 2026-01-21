/**
 * Comprehensive Error Tracking and Monitoring System
 *
 * Provides centralized error tracking, performance monitoring, user session recording,
 * and real-time alerting for the CourtMaster application.
 * Integrates with Sentry for production error tracking.
 */

import { 
  captureSentryException, 
  captureSentryMessage, 
  addSentryBreadcrumb, 
  setSentryUser,
  setSentryTournamentContext,
  setSentryMatchContext,
  isSentryEnabled 
} from './sentry';
import { fetchWrapper, createErrorTrackingInterceptor } from '../network/fetchWrapper';

interface ErrorContext {
  userId?: string;
  tournamentId?: string;
  matchId?: string;
  teamId?: string;
  sessionId: string;
  userAgent: string;
  url: string;
  timestamp: number;
  buildVersion: string;
  environment: string;
  userRole?: string;
  tournamentPhase?: string;
}

interface ErrorInfo {
  id: string;
  message: string;
  stack?: string;
  type: 'javascript' | 'promise' | 'network' | 'api' | 'validation' | 'offline' | 'performance';
  severity: 'critical' | 'error' | 'warning' | 'info';
  context: ErrorContext;
  fingerprint: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
  tags: Record<string, string>;
  breadcrumbs: Breadcrumb[];
  userImpact: 'blocking' | 'degraded' | 'minimal' | 'none';
  resolved: boolean;
}

interface Breadcrumb {
  timestamp: number;
  category: 'navigation' | 'user' | 'api' | 'system' | 'console';
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context: ErrorContext;
  tags: Record<string, string>;
}

interface AlertRule {
  id: string;
  name: string;
  condition: 'error_rate' | 'error_count' | 'performance_threshold' | 'custom';
  threshold: number;
  timeWindow: number; // minutes
  enabled: boolean;
  channels: ('console' | 'webhook' | 'email')[];
  filters: Record<string, any>;
}

interface SessionRecording {
  sessionId: string;
  events: SessionEvent[];
  startTime: number;
  endTime?: number;
  errorCount: number;
  performanceScore: number;
  userAgent: string;
  screenResolution: string;
}

interface SessionEvent {
  timestamp: number;
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'error' | 'performance';
  target?: string;
  data?: Record<string, any>;
}

interface MonitoringConfig {
  enableErrorTracking: boolean;
  enablePerformanceMonitoring: boolean;
  enableSessionRecording: boolean;
  enableRealTimeAlerts: boolean;
  sampleRate: number;
  maxBreadcrumbs: number;
  maxSessionEvents: number;
  apiEndpoint?: string;
  apiKey?: string;
  environment: string;
  buildVersion: string;
}

export class ErrorTracker {
  private config: MonitoringConfig;
  private errors = new Map<string, ErrorInfo>();
  private breadcrumbs: Breadcrumb[] = [];
  private alertRules: AlertRule[] = [];
  private sessionEvents: SessionEvent[] = [];
  private sessionId: string;
  private performanceObserver?: PerformanceObserver;
  private mutationObserver?: MutationObserver;
  private isRecording = false;

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();

    if (config.enableErrorTracking) {
      this.initErrorTracking();
    }

    if (config.enablePerformanceMonitoring) {
      this.initPerformanceMonitoring();
    }

    if (config.enableSessionRecording) {
      this.initSessionRecording();
    }

    if (config.enableRealTimeAlerts) {
      this.initAlertSystem();
    }

    this.setupDefaultAlertRules();
  }

  /**
   * Initialize comprehensive error tracking
   */
  private initErrorTracking(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        type: 'javascript',
        severity: 'error',
        source: event.filename,
        line: event.lineno,
        column: event.colno
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        type: 'promise',
        severity: 'error',
        reason: event.reason
      });
    });

    // Network errors
    this.interceptNetworkErrors();

    // React error boundary integration
    this.setupReactErrorTracking();
  }

  /**
   * Initialize performance monitoring
   */
  private initPerformanceMonitoring(): void {
    // Core Web Vitals monitoring
    this.monitorCoreWebVitals();

    // Custom performance metrics
    this.monitorCustomMetrics();

    // Long task monitoring
    this.monitorLongTasks();

    // Memory monitoring
    this.monitorMemoryUsage();
  }

  /**
   * Initialize session recording
   */
  private initSessionRecording(): void {
    if (!this.config.enableSessionRecording) return;

    this.isRecording = true;

    // Track user interactions
    this.trackUserInteractions();

    // Track navigation
    this.trackNavigation();

    // Track form interactions
    this.trackFormInteractions();

    // Limit session events to prevent memory issues
    setInterval(() => {
      if (this.sessionEvents.length > this.config.maxSessionEvents) {
        this.sessionEvents = this.sessionEvents.slice(-this.config.maxSessionEvents / 2);
      }
    }, 60000); // Check every minute
  }

  /**
   * Capture and process errors
   */
  captureError(errorData: any): string {
    const errorId = this.generateErrorId(errorData);
    const fingerprint = this.generateFingerprint(errorData);

    const context = this.getCurrentContext();
    const breadcrumbs = [...this.breadcrumbs];

    const errorInfo: ErrorInfo = {
      id: errorId,
      message: errorData.message || 'Unknown error',
      stack: errorData.stack,
      type: errorData.type || 'javascript',
      severity: errorData.severity || 'error',
      context,
      fingerprint,
      count: 1,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      tags: this.extractTags(errorData),
      breadcrumbs,
      userImpact: this.assessUserImpact(errorData),
      resolved: false
    };

    // Check if error already exists
    const existingError = Array.from(this.errors.values())
      .find(e => e.fingerprint === fingerprint);

    if (existingError) {
      existingError.count++;
      existingError.lastSeen = Date.now();
      existingError.breadcrumbs = breadcrumbs;
    } else {
      this.errors.set(errorId, errorInfo);
    }

    // Add breadcrumb for this error
    this.addBreadcrumb({
      timestamp: Date.now(),
      category: 'system',
      message: `Error captured: ${errorInfo.message}`,
      level: 'error',
      data: { errorId, type: errorInfo.type }
    });

    // Check alert rules
    this.checkAlertRules(errorInfo);

    // Send to external service if configured
    if (this.config.apiEndpoint) {
      this.sendErrorToService(errorInfo);
    }

    // Send to Sentry if enabled
    if (isSentryEnabled()) {
      captureSentryException(new Error(errorInfo.message), {
        errorId: errorInfo.id,
        type: errorInfo.type,
        severity: errorInfo.severity,
        context: errorInfo.context,
        tags: errorInfo.tags
      });
    }

    // Record session event
    if (this.isRecording) {
      this.recordSessionEvent({
        timestamp: Date.now(),
        type: 'error',
        data: {
          errorId,
          message: errorInfo.message,
          type: errorInfo.type,
          severity: errorInfo.severity
        }
      });
    }

    return errorId;
  }

  /**
   * Capture performance metrics
   */
  capturePerformanceMetric(name: string, value: number, tags: Record<string, string> = {}): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      context: this.getCurrentContext(),
      tags
    };

    // Send to external service
    if (this.config.apiEndpoint) {
      this.sendMetricToService(metric);
    }

    // Check performance alert rules
    this.checkPerformanceAlerts(metric);

    // Record session event
    if (this.isRecording) {
      this.recordSessionEvent({
        timestamp: Date.now(),
        type: 'performance',
        data: { name, value, tags }
      });
    }
  }

  /**
   * Add contextual breadcrumb
   */
  addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.push(breadcrumb);

    // Limit breadcrumbs to prevent memory issues
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }

    // Send to Sentry if enabled
    if (isSentryEnabled()) {
      addSentryBreadcrumb({
        message: breadcrumb.message,
        category: breadcrumb.category,
        level: breadcrumb.level as any,
        data: breadcrumb.data
      });
    }
  }

  /**
   * Set user context
   */
  setUserContext(context: Partial<ErrorContext>): void {
    Object.assign(this.getCurrentContext(), context);

    // Update Sentry context if enabled
    if (isSentryEnabled()) {
      if (context.userId || context.userRole) {
        setSentryUser({
          id: context.userId,
          role: context.userRole
        });
      }

      if (context.tournamentId) {
        setSentryTournamentContext({
          tournamentId: context.tournamentId,
          phase: context.tournamentPhase
        });
      }

      if (context.matchId) {
        setSentryMatchContext({
          matchId: context.matchId,
          tournamentId: context.tournamentId
        });
      }
    }
  }

  /**
   * Tournament-specific error tracking
   */
  trackTournamentError(tournamentId: string, phase: string, error: any): string {
    this.setUserContext({ tournamentId, tournamentPhase: phase });

    return this.captureError({
      ...error,
      type: 'tournament',
      tags: {
        tournament_id: tournamentId,
        tournament_phase: phase,
        feature: 'tournament_management'
      }
    });
  }

  /**
   * Match scoring error tracking
   */
  trackScoringError(matchId: string, teamId: string, error: any): string {
    this.setUserContext({ matchId, teamId });

    return this.captureError({
      ...error,
      type: 'scoring',
      severity: 'critical', // Scoring errors are always critical
      tags: {
        match_id: matchId,
        team_id: teamId,
        feature: 'match_scoring'
      }
    });
  }

  /**
   * Offline sync error tracking
   */
  trackOfflineError(operation: string, collection: string, error: any): string {
    return this.captureError({
      ...error,
      type: 'offline',
      tags: {
        operation,
        collection,
        feature: 'offline_sync'
      }
    });
  }

  /**
   * API error tracking with enhanced context
   */
  trackAPIError(endpoint: string, method: string, statusCode: number, error: any): string {
    return this.captureError({
      ...error,
      type: 'api',
      severity: statusCode >= 500 ? 'critical' : 'error',
      tags: {
        endpoint,
        method,
        status_code: statusCode.toString(),
        feature: 'api_communication'
      }
    });
  }

  /**
   * Get error statistics and insights
   */
  getErrorStatistics(timeRange: number = 24 * 60 * 60 * 1000): any {
    const now = Date.now();
    const cutoff = now - timeRange;

    const recentErrors = Array.from(this.errors.values())
      .filter(error => error.lastSeen >= cutoff);

    const totalErrors = recentErrors.reduce((sum, error) => sum + error.count, 0);
    const criticalErrors = recentErrors.filter(e => e.severity === 'critical').length;
    const topErrors = recentErrors
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const errorsByType = recentErrors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + error.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      timeRange,
      totalErrors,
      uniqueErrors: recentErrors.length,
      criticalErrors,
      errorRate: totalErrors / Math.max(1, timeRange / (60 * 1000)), // errors per minute
      topErrors: topErrors.map(e => ({
        message: e.message,
        count: e.count,
        type: e.type,
        severity: e.severity
      })),
      errorsByType,
      resolution: {
        resolved: recentErrors.filter(e => e.resolved).length,
        unresolved: recentErrors.filter(e => !e.resolved).length
      }
    };
  }

  /**
   * Get session recording data
   */
  getSessionRecording(): SessionRecording {
    return {
      sessionId: this.sessionId,
      events: [...this.sessionEvents],
      startTime: this.sessionEvents[0]?.timestamp || Date.now(),
      endTime: this.sessionEvents[this.sessionEvents.length - 1]?.timestamp,
      errorCount: this.sessionEvents.filter(e => e.type === 'error').length,
      performanceScore: this.calculateSessionPerformanceScore(),
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`
    };
  }

  // Private helper methods

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(errorData: any): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(errorData: any): string {
    const key = `${errorData.message}_${errorData.type}_${errorData.stack?.split('\n')[0] || ''}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substr(0, 32);
  }

  private getCurrentContext(): ErrorContext {
    return {
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now(),
      buildVersion: this.config.buildVersion,
      environment: this.config.environment
    };
  }

  private extractTags(errorData: any): Record<string, string> {
    const tags: Record<string, string> = {};

    if (errorData.tags) {
      Object.assign(tags, errorData.tags);
    }

    if (errorData.component) {
      tags.component = errorData.component;
    }

    if (errorData.source) {
      tags.source = errorData.source;
    }

    return tags;
  }

  private assessUserImpact(errorData: any): ErrorInfo['userImpact'] {
    if (errorData.type === 'scoring' || errorData.severity === 'critical') {
      return 'blocking';
    }

    if (errorData.type === 'api' || errorData.type === 'offline') {
      return 'degraded';
    }

    if (errorData.severity === 'warning') {
      return 'minimal';
    }

    return 'none';
  }

  private interceptNetworkErrors(): void {
    // Register error tracking interceptor with centralized fetch wrapper
    const errorInterceptor = createErrorTrackingInterceptor(
      (endpoint, method, statusCode, error) => {
        this.trackAPIError(endpoint, method, statusCode, error);
      }
    );
    
    fetchWrapper.registerInterceptor(errorInterceptor);
  }

  private setupReactErrorTracking(): void {
    // This would integrate with React error boundaries
    // The error boundary would call this tracker
    (window as any).__COURTMASTER_ERROR_TRACKER__ = this;
  }

  private monitorCoreWebVitals(): void {
    // First Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.capturePerformanceMetric('fcp', entry.startTime, { type: 'core_web_vital' });
        }
      }
    }).observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.capturePerformanceMetric('lcp', (entry as any).startTime, { type: 'core_web_vital' });
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          this.capturePerformanceMetric('cls', (entry as any).value, { type: 'core_web_vital' });
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private monitorCustomMetrics(): void {
    // Tournament load time
    this.monitorRouteTransitions();

    // Component render times
    this.monitorComponentPerformance();
  }

  private monitorLongTasks(): void {
    if ('PerformanceObserver' in window) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            this.capturePerformanceMetric('long_task', entry.duration, {
              type: 'long_task',
              name: entry.name
            });
          }
        }
      }).observe({ entryTypes: ['longtask'] });
    }
  }

  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.capturePerformanceMetric('memory_used', memory.usedJSHeapSize, { type: 'memory' });
        this.capturePerformanceMetric('memory_total', memory.totalJSHeapSize, { type: 'memory' });
      }, 30000); // Every 30 seconds
    }
  }

  private monitorRouteTransitions(): void {
    let navigationStart = performance.now();

    // Monitor route changes
    const observer = new MutationObserver(() => {
      const now = performance.now();
      const transitionTime = now - navigationStart;

      if (transitionTime > 100) { // Only track meaningful transitions
        this.capturePerformanceMetric('route_transition', transitionTime, {
          type: 'navigation',
          route: window.location.pathname
        });
      }

      navigationStart = now;
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  private monitorComponentPerformance(): void {
    // This would integrate with React profiler or custom performance markers
    // Components would call performance.mark() and performance.measure()
  }

  private trackUserInteractions(): void {
    ['click', 'scroll', 'keydown'].forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        if (this.shouldSampleEvent()) {
          this.recordSessionEvent({
            timestamp: Date.now(),
            type: eventType as any,
            target: this.getElementSelector(event.target as Element),
            data: this.extractEventData(event)
          });
        }
      }, { passive: true });
    });
  }

  private trackNavigation(): void {
    window.addEventListener('popstate', () => {
      this.recordSessionEvent({
        timestamp: Date.now(),
        type: 'navigation',
        data: { url: window.location.href, type: 'popstate' }
      });
    });

    // Override pushState and replaceState
    const originalPushState = history.pushState;
    history.pushState = (...args) => {
      this.recordSessionEvent({
        timestamp: Date.now(),
        type: 'navigation',
        data: { url: args[2], type: 'pushstate' }
      });
      return originalPushState.apply(history, args);
    };
  }

  private trackFormInteractions(): void {
    document.addEventListener('submit', (event) => {
      this.recordSessionEvent({
        timestamp: Date.now(),
        type: 'input',
        target: this.getElementSelector(event.target as Element),
        data: { type: 'form_submit' }
      });
    });

    document.addEventListener('input', (event) => {
      if (this.shouldSampleEvent()) {
        this.recordSessionEvent({
          timestamp: Date.now(),
          type: 'input',
          target: this.getElementSelector(event.target as Element),
          data: { type: 'input_change' }
        });
      }
    });
  }

  private recordSessionEvent(event: SessionEvent): void {
    if (!this.isRecording) return;

    this.sessionEvents.push(event);
  }

  private shouldSampleEvent(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  private getElementSelector(element: Element): string {
    if (!element) return '';

    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private extractEventData(event: Event): Record<string, any> {
    const data: Record<string, any> = {};

    if (event.type === 'click') {
      const clickEvent = event as MouseEvent;
      data.x = clickEvent.clientX;
      data.y = clickEvent.clientY;
    }

    if (event.type === 'scroll') {
      data.scrollX = window.scrollX;
      data.scrollY = window.scrollY;
    }

    if (event.type === 'keydown') {
      const keyEvent = event as KeyboardEvent;
      data.key = keyEvent.key;
      data.code = keyEvent.code;
    }

    return data;
  }

  private calculateSessionPerformanceScore(): number {
    const performanceEvents = this.sessionEvents.filter(e => e.type === 'performance');
    if (performanceEvents.length === 0) return 100;

    // Simple scoring based on performance metrics
    let score = 100;

    performanceEvents.forEach(event => {
      if (event.data?.name === 'lcp' && event.data.value > 2500) score -= 10;
      if (event.data?.name === 'fcp' && event.data.value > 1800) score -= 5;
      if (event.data?.name === 'long_task' && event.data.value > 100) score -= 2;
    });

    return Math.max(0, score);
  }

  private initAlertSystem(): void {
    // Check alert rules periodically
    setInterval(() => {
      this.processAlertRules();
    }, 60000); // Check every minute
  }

  private setupDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: 'error_rate',
        threshold: 10, // errors per minute
        timeWindow: 5,
        enabled: false, // Disable for development
        channels: ['console'],
        filters: { severity: ['critical', 'error'] }
      },
      {
        id: 'critical_errors',
        name: 'Critical Errors',
        condition: 'error_count',
        threshold: 1,
        timeWindow: 1,
        enabled: true,
        channels: ['console'],
        filters: { severity: ['critical'] }
      },
      {
        id: 'poor_performance',
        name: 'Poor Performance',
        condition: 'performance_threshold',
        threshold: 5000, // 5 seconds
        timeWindow: 10,
        enabled: false, // Disable for development
        channels: ['console'],
        filters: { metric: ['lcp', 'route_transition'] }
      }
    ];
  }

  private checkAlertRules(error: ErrorInfo): void {
    this.alertRules.forEach(rule => {
      if (!rule.enabled) return;

      if (this.evaluateAlertRule(rule, error)) {
        this.triggerAlert(rule, error);
      }
    });
  }

  private checkPerformanceAlerts(metric: PerformanceMetric): void {
    this.alertRules.forEach(rule => {
      if (!rule.enabled || rule.condition !== 'performance_threshold') return;

      if (metric.value > rule.threshold) {
        this.triggerPerformanceAlert(rule, metric);
      }
    });
  }

  private evaluateAlertRule(rule: AlertRule, error: ErrorInfo): boolean {
    // Simplified rule evaluation
    if (rule.filters.severity && !rule.filters.severity.includes(error.severity)) {
      return false;
    }

    return true; // Rule matches
  }

  private triggerAlert(rule: AlertRule, error: ErrorInfo): void {
    const alert = {
      rule: rule.name,
      error: error.message,
      severity: error.severity,
      timestamp: Date.now(),
      context: error.context
    };

    rule.channels.forEach(channel => {
      switch (channel) {
        case 'console':
          console.error('🚨 Alert triggered:', alert);
          break;
        case 'webhook':
          this.sendWebhookAlert(alert);
          break;
      }
    });
  }

  private triggerPerformanceAlert(rule: AlertRule, metric: PerformanceMetric): void {
    const alert = {
      rule: rule.name,
      metric: metric.name,
      value: metric.value,
      threshold: rule.threshold,
      timestamp: Date.now()
    };

    console.warn('⚠️ Performance alert:', alert);
  }

  private processAlertRules(): void {
    // Process all active alert rules
    // This would check error rates, counts, etc. over time windows
  }

  private async sendErrorToService(error: ErrorInfo): Promise<void> {
    if (!this.config.apiEndpoint || !this.config.apiKey) return;

    try {
      await fetch(`${this.config.apiEndpoint}/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(error)
      });
    } catch (err) {
      console.warn('Failed to send error to monitoring service:', err);
    }
  }

  private async sendMetricToService(metric: PerformanceMetric): Promise<void> {
    if (!this.config.apiEndpoint || !this.config.apiKey) return;

    try {
      await fetch(`${this.config.apiEndpoint}/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(metric)
      });
    } catch (err) {
      console.warn('Failed to send metric to monitoring service:', err);
    }
  }

  private async sendWebhookAlert(alert: any): Promise<void> {
    // Implementation for webhook alerts
    console.log('Sending webhook alert:', alert);
  }
}

// Default configuration
export const defaultMonitoringConfig: MonitoringConfig = {
  enableErrorTracking: true,
  enablePerformanceMonitoring: true,
  enableSessionRecording: false, // Disabled by default for privacy
  enableRealTimeAlerts: true,
  sampleRate: 0.1, // 10% sampling for events
  maxBreadcrumbs: 50,
  maxSessionEvents: 1000,
  environment: import.meta.env.MODE || 'development',
  buildVersion: import.meta.env.VITE_BUILD_VERSION || 'development',
  apiEndpoint: import.meta.env.VITE_MONITORING_ENDPOINT,
  apiKey: import.meta.env.VITE_MONITORING_API_KEY
};

// Global error tracker instance
export const errorTracker = new ErrorTracker(defaultMonitoringConfig);

// Make error tracker available globally for error boundaries
(window as any).__COURTMASTER_ERROR_TRACKER__ = errorTracker;