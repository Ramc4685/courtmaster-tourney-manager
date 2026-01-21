/**
 * React Hook for Performance Monitoring
 *
 * Provides component-level performance tracking with automatic reporting
 * to the monitoring system and performance optimization suggestions.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { performanceMonitor } from '@/lib/monitoring/PerformanceMonitor';

interface PerformanceMetrics {
  renderTime: number;
  mountTime: number;
  updateCount: number;
  memoryUsage?: number;
  isOptimized: boolean;
}

interface PerformanceHookOptions {
  componentName?: string;
  trackRenders?: boolean;
  trackMemory?: boolean;
  trackUpdates?: boolean;
  autoOptimize?: boolean;
  threshold?: number; // milliseconds for slow render warning
}

interface PerformanceHookReturn {
  metrics: PerformanceMetrics;
  startMeasurement: (name: string) => void;
  endMeasurement: (name: string) => number;
  trackEvent: (eventName: string, value: number, tags?: Record<string, string>) => void;
  isSlowComponent: boolean;
  optimizationSuggestions: string[];
}

export function usePerformanceMonitoring(
  options: PerformanceHookOptions = {}
): PerformanceHookReturn {
  const {
    componentName = 'UnknownComponent',
    trackRenders = true,
    trackMemory = false,
    trackUpdates = true,
    autoOptimize = false,
    threshold = 16 // 60fps = ~16ms per frame
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    mountTime: 0,
    updateCount: 0,
    isOptimized: false
  });

  const [optimizationSuggestions, setOptimizationSuggestions] = useState<string[]>([]);
  const [isSlowComponent, setIsSlowComponent] = useState(false);

  const renderStartTime = useRef<number>(0);
  const mountStartTime = useRef<number>(0);
  const measurementTimes = useRef<Map<string, number>>(new Map());
  const renderTimes = useRef<number[]>([]);
  const updateCountRef = useRef(0);

  // Start render measurement
  useEffect(() => {
    if (trackRenders) {
      renderStartTime.current = performance.now();
    }
  });

  // Mount time tracking
  useEffect(() => {
    if (trackRenders) {
      const mountTime = performance.now() - mountStartTime.current;

      setMetrics(prev => ({
        ...prev,
        mountTime
      }));

      // Report mount time to performance monitor
      performanceMonitor.trackComponentRender(`${componentName}_mount`, mountTime);

      // Set mount start time for future reference
      mountStartTime.current = performance.now();
    }
  }, [componentName, trackRenders]);

  // Render time tracking
  useEffect(() => {
    if (trackRenders && renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;

      // Store render time
      renderTimes.current.push(renderTime);

      // Keep only recent render times (last 10)
      if (renderTimes.current.length > 10) {
        renderTimes.current = renderTimes.current.slice(-10);
      }

      const avgRenderTime = renderTimes.current.reduce((sum, time) => sum + time, 0) / renderTimes.current.length;

      setMetrics(prev => ({
        ...prev,
        renderTime: avgRenderTime
      }));

      // Check if component is slow
      const isSlow = renderTime > threshold;
      setIsSlowComponent(isSlow);

      if (isSlow) {
        performanceMonitor.recordCustomMetric('slow_component_render', renderTime, {
          component: componentName,
          threshold: threshold.toString(),
          category: 'component-performance'
        });
      }

      // Report render time to performance monitor
      performanceMonitor.trackComponentRender(componentName, renderTime);

      // Update optimization suggestions
      updateOptimizationSuggestions(renderTime, renderTimes.current);
    }
  });

  // Update count tracking
  useEffect(() => {
    if (trackUpdates) {
      updateCountRef.current += 1;

      setMetrics(prev => ({
        ...prev,
        updateCount: updateCountRef.current
      }));
    }
  });

  // Memory tracking
  useEffect(() => {
    if (trackMemory && 'memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

        setMetrics(prev => ({
          ...prev,
          memoryUsage
        }));

        // Report high memory usage
        if (memoryUsage > 80) {
          performanceMonitor.recordCustomMetric('high_component_memory', memoryUsage, {
            component: componentName,
            category: 'memory-usage'
          });
        }
      };

      const memoryCheckInterval = setInterval(checkMemory, 5000); // Check every 5 seconds
      checkMemory(); // Initial check

      return () => clearInterval(memoryCheckInterval);
    }
  }, [trackMemory, componentName]);

  // Auto-optimization
  useEffect(() => {
    if (autoOptimize && isSlowComponent) {
      // Suggest React.memo or useMemo optimizations
      console.warn(`🐌 Slow component detected: ${componentName}`, {
        renderTime: metrics.renderTime,
        suggestions: optimizationSuggestions
      });
    }
  }, [autoOptimize, isSlowComponent, componentName, metrics.renderTime, optimizationSuggestions]);

  /**
   * Start a custom performance measurement
   */
  const startMeasurement = useCallback((name: string) => {
    measurementTimes.current.set(name, performance.now());
    performance.mark(`${componentName}-${name}-start`);
  }, [componentName]);

  /**
   * End a custom performance measurement and return duration
   */
  const endMeasurement = useCallback((name: string): number => {
    const startTime = measurementTimes.current.get(name);
    if (!startTime) {
      console.warn(`No start time found for measurement: ${name}`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    performance.mark(`${componentName}-${name}-end`);
    performance.measure(`${componentName}-${name}`, `${componentName}-${name}-start`, `${componentName}-${name}-end`);

    // Report custom measurement
    performanceMonitor.recordCustomMetric(`${componentName}_${name}`, duration, {
      component: componentName,
      measurement: name,
      category: 'custom-measurement'
    });

    measurementTimes.current.delete(name);
    return duration;
  }, [componentName]);

  /**
   * Track custom events
   */
  const trackEvent = useCallback((eventName: string, value: number, tags: Record<string, string> = {}) => {
    performanceMonitor.recordCustomMetric(eventName, value, {
      component: componentName,
      ...tags,
      category: 'component-event'
    });
  }, [componentName]);

  /**
   * Update optimization suggestions based on performance data
   */
  const updateOptimizationSuggestions = useCallback((currentRenderTime: number, recentRenderTimes: number[]) => {
    const suggestions: string[] = [];

    // Slow render suggestions
    if (currentRenderTime > threshold) {
      suggestions.push('Consider using React.memo() to prevent unnecessary re-renders');

      if (currentRenderTime > threshold * 2) {
        suggestions.push('Split component into smaller components');
        suggestions.push('Use useMemo() for expensive calculations');
      }

      if (currentRenderTime > threshold * 3) {
        suggestions.push('Consider virtualization for large lists');
        suggestions.push('Implement lazy loading for heavy content');
      }
    }

    // Frequent updates suggestions
    if (updateCountRef.current > 50) {
      suggestions.push('High update frequency detected - check for unnecessary state changes');
      suggestions.push('Consider debouncing rapid state updates');
    }

    // Inconsistent render times
    const variance = calculateVariance(recentRenderTimes);
    if (variance > threshold) {
      suggestions.push('Inconsistent render times - check for conditional logic in render');
    }

    // Memory suggestions
    if (metrics.memoryUsage && metrics.memoryUsage > 70) {
      suggestions.push('High memory usage - check for memory leaks or large data structures');
    }

    setOptimizationSuggestions(suggestions);
  }, [threshold, metrics.memoryUsage]);

  // Initialize mount start time
  useEffect(() => {
    mountStartTime.current = performance.now();
  }, []);

  return {
    metrics,
    startMeasurement,
    endMeasurement,
    trackEvent,
    isSlowComponent,
    optimizationSuggestions
  };
}

/**
 * Hook for tracking specific operations within components
 */
export function useOperationTracking(operationName: string) {
  const startTimeRef = useRef<number>(0);

  const startOperation = useCallback(() => {
    startTimeRef.current = performance.now();
    performance.mark(`${operationName}-start`);
  }, [operationName]);

  const endOperation = useCallback((tags: Record<string, string> = {}) => {
    if (startTimeRef.current === 0) {
      console.warn(`Operation ${operationName} was not started`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTimeRef.current;

    performance.mark(`${operationName}-end`);
    performance.measure(operationName, `${operationName}-start`, `${operationName}-end`);

    // Report to performance monitor
    performanceMonitor.recordCustomMetric(operationName, duration, {
      ...tags,
      category: 'operation-timing'
    });

    startTimeRef.current = 0;
    return duration;
  }, [operationName]);

  return {
    startOperation,
    endOperation
  };
}

/**
 * Hook for tournament-specific performance tracking
 */
export function useTournamentPerformance(tournamentId?: string) {
  const { trackEvent } = usePerformanceMonitoring({
    componentName: 'Tournament',
    trackRenders: true,
    trackMemory: true
  });

  const trackTournamentLoad = useCallback((startTime: number) => {
    if (tournamentId) {
      performanceMonitor.trackTournamentLoad(tournamentId, startTime);
    }
  }, [tournamentId]);

  const trackMatchScoring = useCallback((matchId: string, startTime: number) => {
    if (tournamentId) {
      performanceMonitor.trackMatchScoringTime(matchId, startTime);
    }
  }, [tournamentId]);

  const trackBracketGeneration = useCallback((teamCount: number, startTime: number) => {
    if (tournamentId) {
      performanceMonitor.trackBracketGenerationTime(tournamentId, teamCount, startTime);
    }
  }, [tournamentId]);

  return {
    trackEvent,
    trackTournamentLoad,
    trackMatchScoring,
    trackBracketGeneration
  };
}

/**
 * Hook for network request performance tracking
 */
export function useNetworkPerformance() {
  const trackRequest = useCallback((
    url: string,
    method: string,
    startTime: number,
    success: boolean,
    status?: number
  ) => {
    const duration = performance.now() - startTime;

    performanceMonitor.recordCustomMetric('api_request_time', duration, {
      url,
      method,
      success: success.toString(),
      status: status?.toString() || '0',
      category: 'network-performance'
    });

    return duration;
  }, []);

  return { trackRequest };
}

// Utility functions
function calculateVariance(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;

  return variance;
}

// Performance debugging utilities
export const PerformanceDebugger = {
  /**
   * Log component render reasons
   */
  logRenderReasons: (componentName: string, props: any, prevProps?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔍 ${componentName} Render Analysis`);

      if (prevProps) {
        const changedProps = Object.keys(props).filter(key => props[key] !== prevProps[key]);
        if (changedProps.length > 0) {
          console.log('Changed props:', changedProps);
          changedProps.forEach(prop => {
            console.log(`  ${prop}:`, { old: prevProps[prop], new: props[prop] });
          });
        } else {
          console.log('No prop changes detected - check parent re-renders');
        }
      } else {
        console.log('Initial render');
      }

      console.groupEnd();
    }
  },

  /**
   * Profile component render performance
   */
  profileRender: (componentName: string, renderFunction: () => void) => {
    const startTime = performance.now();

    renderFunction();

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    if (renderTime > 16) { // Slower than 60fps
      console.warn(`🐌 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }

    return renderTime;
  }
};