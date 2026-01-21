/**
 * Performance State Management Store
 *
 * Centralized Zustand store for performance metrics, monitoring data,
 * and optimization recommendations with real-time updates.
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { performanceMonitor } from '@/lib/monitoring/PerformanceMonitor';

interface PerformanceState {
  // Current metrics
  currentScore: number;
  coreWebVitals: {
    lcp: number | null;
    fid: number | null;
    cls: number | null;
    fcp: number | null;
    ttfb: number | null;
  };
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  } | null;
  networkMetrics: {
    averageResponseTime: number;
    errorRate: number;
    requestCount: number;
  };

  // Monitoring state
  isMonitoring: boolean;
  lastUpdate: number;

  // Performance budget
  budget: {
    lcp: number;
    fid: number;
    cls: number;
    memoryUsage: number;
    apiResponseTime: number;
  };
  budgetViolations: string[];

  // Recommendations
  recommendations: Array<{
    id: string;
    type: 'optimization' | 'warning' | 'critical';
    message: string;
    impact: string;
    solution: string;
    priority: number;
    timestamp: number;
    acknowledged: boolean;
  }>;

  // Historical data
  performanceHistory: Array<{
    timestamp: number;
    score: number;
    lcp: number | null;
    fid: number | null;
    cls: number | null;
    memoryUsage: number | null;
  }>;

  // Tournament-specific metrics
  tournamentMetrics: {
    [tournamentId: string]: {
      loadTime: number;
      bracketGenerationTime: number;
      matchScoringTimes: number[];
      errorCount: number;
      userCount: number;
    };
  };

  // Component performance
  componentMetrics: {
    [componentName: string]: {
      averageRenderTime: number;
      renderCount: number;
      slowRenders: number;
      lastUpdate: number;
    };
  };

  // Alert configuration
  alertSettings: {
    enableRealTimeAlerts: boolean;
    scoreThreshold: number;
    memoryThreshold: number;
    responseTimeThreshold: number;
    alertChannels: ('browser' | 'console' | 'webhook')[];
  };

  // Actions
  updateMetrics: () => void;
  updateCoreWebVital: (name: string, value: number) => void;
  updateMemoryUsage: (usage: { used: number; total: number; percentage: number }) => void;
  updateNetworkMetrics: (metrics: { averageResponseTime: number; errorRate: number; requestCount: number }) => void;
  addRecommendation: (recommendation: Omit<PerformanceState['recommendations'][0], 'id' | 'timestamp' | 'acknowledged'>) => void;
  acknowledgeRecommendation: (id: string) => void;
  removeRecommendation: (id: string) => void;
  updateTournamentMetrics: (tournamentId: string, metrics: Partial<PerformanceState['tournamentMetrics'][string]>) => void;
  updateComponentMetrics: (componentName: string, renderTime: number) => void;
  setBudget: (budget: Partial<PerformanceState['budget']>) => void;
  checkBudgetViolations: () => void;
  setAlertSettings: (settings: Partial<PerformanceState['alertSettings']>) => void;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  clearHistory: () => void;
  exportMetrics: () => string;
  getPerformanceSummary: () => any;
}

export const usePerformanceStore = create<PerformanceState>()(
  devtools(
    subscribeWithSelector(
      (set, get) => ({
        // Initial state
        currentScore: 100,
        coreWebVitals: {
          lcp: null,
          fid: null,
          cls: null,
          fcp: null,
          ttfb: null,
        },
        memoryUsage: null,
        networkMetrics: {
          averageResponseTime: 0,
          errorRate: 0,
          requestCount: 0,
        },
        isMonitoring: false,
        lastUpdate: Date.now(),

        budget: {
          lcp: 2500,
          fid: 100,
          cls: 0.1,
          memoryUsage: 70,
          apiResponseTime: 1000,
        },
        budgetViolations: [],

        recommendations: [],
        performanceHistory: [],
        tournamentMetrics: {},
        componentMetrics: {},

        alertSettings: {
          enableRealTimeAlerts: true,
          scoreThreshold: 70,
          memoryThreshold: 80,
          responseTimeThreshold: 2000,
          alertChannels: ['browser', 'console'],
        },

        // Actions
        updateMetrics: () => {
          const metrics = performanceMonitor.getCurrentMetrics();

          set((state) => {
            const newState = {
              ...state,
              currentScore: metrics.score,
              lastUpdate: Date.now(),
            };

            // Update Core Web Vitals
            if (metrics.coreWebVitals && metrics.coreWebVitals.length > 0) {
              const latestVitals = metrics.coreWebVitals.reduce((acc, vital) => {
                acc[vital.name.toLowerCase()] = vital.value;
                return acc;
              }, {} as any);

              newState.coreWebVitals = {
                ...state.coreWebVitals,
                ...latestVitals,
              };
            }

            // Update memory usage
            if (metrics.memoryUsage) {
              newState.memoryUsage = metrics.memoryUsage;
            }

            // Update network metrics
            if (metrics.networkPerformance) {
              newState.networkMetrics = {
                averageResponseTime: metrics.networkPerformance.averageResponseTime,
                errorRate: metrics.networkPerformance.errorRate,
                requestCount: state.networkMetrics.requestCount,
              };
            }

            // Add to history
            newState.performanceHistory = [
              ...state.performanceHistory,
              {
                timestamp: Date.now(),
                score: metrics.score,
                lcp: newState.coreWebVitals.lcp,
                fid: newState.coreWebVitals.fid,
                cls: newState.coreWebVitals.cls,
                memoryUsage: newState.memoryUsage?.percentage || null,
              },
            ].slice(-100); // Keep last 100 entries

            // Update recommendations from monitor
            if (metrics.recommendations && metrics.recommendations.length > 0) {
              const newRecommendations = metrics.recommendations.map((rec: any) => ({
                id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: rec.severity === 'critical' ? 'critical' : 'optimization',
                message: rec.message,
                impact: rec.impact,
                solution: rec.solution,
                priority: rec.severity === 'critical' ? 1 : rec.severity === 'warning' ? 2 : 3,
                timestamp: Date.now(),
                acknowledged: false,
              }));

              newState.recommendations = [
                ...state.recommendations.filter(r => !r.acknowledged),
                ...newRecommendations,
              ];
            }

            return newState;
          });

          // Check budget violations after state update
          get().checkBudgetViolations();
        },

        updateCoreWebVital: (name: string, value: number) => {
          set((state) => ({
            coreWebVitals: {
              ...state.coreWebVitals,
              [name.toLowerCase()]: value,
            },
            lastUpdate: Date.now(),
          }));

          get().checkBudgetViolations();
        },

        updateMemoryUsage: (usage) => {
          set({
            memoryUsage: usage,
            lastUpdate: Date.now(),
          });

          // Check memory threshold
          const { alertSettings } = get();
          if (usage.percentage > alertSettings.memoryThreshold && alertSettings.enableRealTimeAlerts) {
            get().addRecommendation({
              type: 'warning',
              message: `High memory usage: ${usage.percentage.toFixed(1)}%`,
              impact: 'Application performance may degrade',
              solution: 'Close unused tabs, clear caches, or restart the application',
              priority: 2,
            });
          }
        },

        updateNetworkMetrics: (metrics) => {
          set((state) => ({
            networkMetrics: {
              ...state.networkMetrics,
              ...metrics,
            },
            lastUpdate: Date.now(),
          }));

          // Check response time threshold
          const { alertSettings } = get();
          if (metrics.averageResponseTime > alertSettings.responseTimeThreshold && alertSettings.enableRealTimeAlerts) {
            get().addRecommendation({
              type: 'warning',
              message: `Slow API responses: ${metrics.averageResponseTime.toFixed(0)}ms average`,
              impact: 'Users may experience delays in tournament operations',
              solution: 'Check network connection or contact support if issues persist',
              priority: 2,
            });
          }
        },

        addRecommendation: (recommendation) => {
          set((state) => ({
            recommendations: [
              {
                ...recommendation,
                id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
                acknowledged: false,
              },
              ...state.recommendations,
            ].slice(0, 50), // Keep only 50 most recent recommendations
          }));
        },

        acknowledgeRecommendation: (id) => {
          set((state) => ({
            recommendations: state.recommendations.map((rec) =>
              rec.id === id ? { ...rec, acknowledged: true } : rec
            ),
          }));
        },

        removeRecommendation: (id) => {
          set((state) => ({
            recommendations: state.recommendations.filter((rec) => rec.id !== id),
          }));
        },

        updateTournamentMetrics: (tournamentId, metrics) => {
          set((state) => ({
            tournamentMetrics: {
              ...state.tournamentMetrics,
              [tournamentId]: {
                ...state.tournamentMetrics[tournamentId],
                ...metrics,
              },
            },
          }));
        },

        updateComponentMetrics: (componentName, renderTime) => {
          set((state) => {
            const existing = state.componentMetrics[componentName] || {
              averageRenderTime: 0,
              renderCount: 0,
              slowRenders: 0,
              lastUpdate: 0,
            };

            const newRenderCount = existing.renderCount + 1;
            const newAverageRenderTime =
              (existing.averageRenderTime * existing.renderCount + renderTime) / newRenderCount;

            return {
              componentMetrics: {
                ...state.componentMetrics,
                [componentName]: {
                  averageRenderTime: newAverageRenderTime,
                  renderCount: newRenderCount,
                  slowRenders: existing.slowRenders + (renderTime > 16 ? 1 : 0),
                  lastUpdate: Date.now(),
                },
              },
            };
          });
        },

        setBudget: (budget) => {
          set((state) => ({
            budget: {
              ...state.budget,
              ...budget,
            },
          }));

          get().checkBudgetViolations();
        },

        checkBudgetViolations: () => {
          const { coreWebVitals, memoryUsage, networkMetrics, budget } = get();
          const violations: string[] = [];

          if (coreWebVitals.lcp && coreWebVitals.lcp > budget.lcp) {
            violations.push(`LCP exceeds budget: ${coreWebVitals.lcp}ms > ${budget.lcp}ms`);
          }

          if (coreWebVitals.fid && coreWebVitals.fid > budget.fid) {
            violations.push(`FID exceeds budget: ${coreWebVitals.fid}ms > ${budget.fid}ms`);
          }

          if (coreWebVitals.cls && coreWebVitals.cls > budget.cls) {
            violations.push(`CLS exceeds budget: ${coreWebVitals.cls} > ${budget.cls}`);
          }

          if (memoryUsage && memoryUsage.percentage > budget.memoryUsage) {
            violations.push(`Memory usage exceeds budget: ${memoryUsage.percentage.toFixed(1)}% > ${budget.memoryUsage}%`);
          }

          if (networkMetrics.averageResponseTime > budget.apiResponseTime) {
            violations.push(`API response time exceeds budget: ${networkMetrics.averageResponseTime}ms > ${budget.apiResponseTime}ms`);
          }

          set({ budgetViolations: violations });

          // Trigger alerts for new violations
          if (violations.length > 0 && get().alertSettings.enableRealTimeAlerts) {
            violations.forEach((violation) => {
              get().addRecommendation({
                type: 'critical',
                message: `Budget violation: ${violation}`,
                impact: 'Performance targets not being met',
                solution: 'Review performance optimizations and consider budget adjustments',
                priority: 1,
              });
            });
          }
        },

        setAlertSettings: (settings) => {
          set((state) => ({
            alertSettings: {
              ...state.alertSettings,
              ...settings,
            },
          }));
        },

        startMonitoring: () => {
          set({ isMonitoring: true });

          // Start periodic updates
          const updateInterval = setInterval(() => {
            if (get().isMonitoring) {
              get().updateMetrics();
            } else {
              clearInterval(updateInterval);
            }
          }, 5000); // Update every 5 seconds
        },

        stopMonitoring: () => {
          set({ isMonitoring: false });
        },

        clearHistory: () => {
          set({
            performanceHistory: [],
            recommendations: [],
            tournamentMetrics: {},
            componentMetrics: {},
          });
        },

        exportMetrics: () => {
          const state = get();
          const exportData = {
            timestamp: new Date().toISOString(),
            currentScore: state.currentScore,
            coreWebVitals: state.coreWebVitals,
            memoryUsage: state.memoryUsage,
            networkMetrics: state.networkMetrics,
            budget: state.budget,
            budgetViolations: state.budgetViolations,
            recommendations: state.recommendations,
            performanceHistory: state.performanceHistory,
            tournamentMetrics: state.tournamentMetrics,
            componentMetrics: state.componentMetrics,
          };

          return JSON.stringify(exportData, null, 2);
        },

        getPerformanceSummary: () => {
          const state = get();
          const recentHistory = state.performanceHistory.slice(-10);

          return {
            currentScore: state.currentScore,
            trend: recentHistory.length > 1
              ? (state.currentScore - recentHistory[0].score)
              : 0,
            criticalIssues: state.recommendations.filter(r => r.type === 'critical' && !r.acknowledged).length,
            budgetViolations: state.budgetViolations.length,
            memoryUsage: state.memoryUsage?.percentage || 0,
            averageResponseTime: state.networkMetrics.averageResponseTime,
            slowComponents: Object.entries(state.componentMetrics)
              .filter(([_, metrics]) => metrics.averageRenderTime > 16)
              .length,
            lastUpdate: state.lastUpdate,
          };
        },
      })
    ),
    {
      name: 'performance-store',
      partialize: (state) => ({
        budget: state.budget,
        alertSettings: state.alertSettings,
        // Don't persist real-time data
      }),
    }
  )
);

// Selectors for specific data
export const usePerformanceScore = () => usePerformanceStore((state) => state.currentScore);
export const useCoreWebVitals = () => usePerformanceStore((state) => state.coreWebVitals);
export const useMemoryUsage = () => usePerformanceStore((state) => state.memoryUsage);
export const useRecommendations = () => usePerformanceStore((state) => state.recommendations);
export const useBudgetViolations = () => usePerformanceStore((state) => state.budgetViolations);
export const usePerformanceHistory = () => usePerformanceStore((state) => state.performanceHistory);
export const useTournamentMetrics = (tournamentId: string) =>
  usePerformanceStore((state) => state.tournamentMetrics[tournamentId]);
export const useComponentMetrics = () => usePerformanceStore((state) => state.componentMetrics);

// Initialize monitoring on store creation
if (typeof window !== 'undefined') {
  // Auto-start monitoring in development
  if (import.meta.env.DEV) {
    usePerformanceStore.getState().startMonitoring();
  }
}