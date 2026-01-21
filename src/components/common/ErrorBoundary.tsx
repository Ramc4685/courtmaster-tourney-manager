/**
 * Comprehensive Error Boundary Component
 *
 * Provides hierarchical error boundaries with monitoring integration,
 * error recovery mechanisms, context preservation, and user-friendly error messages.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug, Download } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  level: 'app' | 'route' | 'component' | 'feature';
  feature?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  enableRecovery?: boolean;
  enableReporting?: boolean;
  context?: Record<string, any>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  isRecovering: boolean;
  showDetails: boolean;
  contextSnapshot: Record<string, any>;
}

interface ErrorReport {
  errorId: string;
  error: Error;
  errorInfo: ErrorInfo;
  context: Record<string, any>;
  userAgent: string;
  url: string;
  timestamp: number;
  retryCount: number;
  level: string;
  feature?: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false,
      showDetails: false,
      contextSnapshot: {}
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.generateErrorId();
    const contextSnapshot = this.captureContext();

    this.setState({
      errorInfo,
      errorId,
      contextSnapshot
    });

    // Report error to monitoring system
    this.reportError(error, errorInfo, errorId, contextSnapshot);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error details for debugging
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Context:', contextSnapshot);
    console.error('Props:', this.props);
    console.groupEnd();
  }

  private generateErrorId(): string {
    return `eb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private captureContext(): Record<string, any> {
    const context: Record<string, any> = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      level: this.props.level,
      feature: this.props.feature,
      ...this.props.context
    };

    // Capture React context if available
    try {
      // Add any additional context from props or global state
      if (typeof window !== 'undefined') {
        context.screenResolution = `${screen.width}x${screen.height}`;
        context.viewport = `${window.innerWidth}x${window.innerHeight}`;
        context.connectionType = (navigator as any).connection?.effectiveType;
        context.onLine = navigator.onLine;
      }
    } catch (e) {
      // Ignore context capture errors
    }

    return context;
  }

  private reportError(
    error: Error,
    errorInfo: ErrorInfo,
    errorId: string,
    context: Record<string, any>
  ): void {
    if (!this.props.enableReporting) return;

    try {
      // Use the global error tracker if available
      const errorTracker = (window as any).__COURTMASTER_ERROR_TRACKER__;

      if (errorTracker) {
        errorTracker.captureError({
          message: error.message,
          stack: error.stack,
          type: 'react_boundary',
          severity: this.getErrorSeverity(),
          component: this.props.feature || 'unknown',
          componentStack: errorInfo.componentStack,
          props: this.sanitizeProps(),
          context,
          boundary: {
            level: this.props.level,
            feature: this.props.feature,
            retryCount: this.state.retryCount
          }
        });
      }

      // Also create a detailed error report
      const report: ErrorReport = {
        errorId,
        error,
        errorInfo,
        context,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now(),
        retryCount: this.state.retryCount,
        level: this.props.level,
        feature: this.props.feature
      };

      // Store error report for potential download
      this.storeErrorReport(report);

    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  private getErrorSeverity(): 'critical' | 'error' | 'warning' {
    switch (this.props.level) {
      case 'app':
        return 'critical';
      case 'route':
        return 'error';
      case 'component':
      case 'feature':
        return 'warning';
      default:
        return 'error';
    }
  }

  private sanitizeProps(): Record<string, any> {
    // Remove sensitive data and circular references
    try {
      return JSON.parse(JSON.stringify(this.props, (key, value) => {
        if (key === 'children' || typeof value === 'function') {
          return '[Removed]';
        }
        return value;
      }));
    } catch {
      return { error: 'Failed to serialize props' };
    }
  }

  private storeErrorReport(report: ErrorReport): void {
    try {
      const reports = JSON.parse(localStorage.getItem('courtmaster-error-reports') || '[]');
      reports.push(report);

      // Keep only last 10 reports
      if (reports.length > 10) {
        reports.splice(0, reports.length - 10);
      }

      localStorage.setItem('courtmaster-error-reports', JSON.stringify(reports));
    } catch (e) {
      console.warn('Failed to store error report:', e);
    }
  }

  private handleRetry = (): void => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({
      isRecovering: true,
      retryCount: this.state.retryCount + 1
    });

    // Add progressive delay for retries
    const delay = this.retryDelay * Math.pow(2, this.state.retryCount);

    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        isRecovering: false,
        showDetails: false
      });
    }, delay);
  };

  private handleRecovery = (): void => {
    // Attempt to recover by clearing error state and reloading data
    this.setState({
      isRecovering: true
    });

    // Clear any cached data that might be causing issues
    if (typeof window !== 'undefined') {
      // Clear relevant caches
      try {
        sessionStorage.removeItem('tournament-cache');
        sessionStorage.removeItem('match-cache');
      } catch (e) {
        // Ignore storage errors
      }
    }

    // Reset error state after a short delay
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        isRecovering: false,
        showDetails: false,
        retryCount: 0
      });
    }, 1000);
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  private toggleDetails = (): void => {
    this.setState({ showDetails: !this.state.showDetails });
  };

  private downloadErrorReport = (): void => {
    if (!this.state.error || !this.state.errorId) return;

    const report = {
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      error: {
        message: this.state.error.message,
        stack: this.state.error.stack
      },
      componentStack: this.state.errorInfo?.componentStack,
      context: this.state.contextSnapshot,
      level: this.props.level,
      feature: this.props.feature,
      retryCount: this.state.retryCount
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${this.state.errorId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private renderErrorMessage(): ReactNode {
    const { level, feature } = this.props;
    const { error, retryCount } = this.state;

    // Customize message based on boundary level and feature
    const messages = {
      app: {
        title: 'Application Error',
        description: 'A critical error occurred that prevented the application from loading properly.',
        suggestion: 'Please refresh the page or contact support if the problem persists.'
      },
      route: {
        title: 'Page Error',
        description: 'An error occurred while loading this page.',
        suggestion: 'Try navigating to a different page or refreshing the browser.'
      },
      component: {
        title: 'Component Error',
        description: `An error occurred in the ${feature || 'component'}.`,
        suggestion: 'This feature may be temporarily unavailable. Other parts of the application should continue to work.'
      },
      feature: {
        title: `${feature} Error`,
        description: `An error occurred in the ${feature} feature.`,
        suggestion: 'Try refreshing or using an alternative workflow.'
      }
    };

    const message = messages[level] || messages.component;

    return (
      <Alert className="border-destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          {message.title}
          {retryCount > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              (Attempt {retryCount + 1})
            </span>
          )}
        </AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{message.description}</p>
          <p className="text-sm text-muted-foreground">{message.suggestion}</p>
          {error && (
            <p className="text-sm font-mono text-destructive">
              {error.message}
            </p>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  private renderActionButtons(): ReactNode {
    const { enableRetry, enableRecovery, level } = this.props;
    const { retryCount, isRecovering } = this.state;

    return (
      <div className="flex flex-wrap gap-2">
        {enableRetry && retryCount < this.maxRetries && (
          <Button
            onClick={this.handleRetry}
            disabled={isRecovering}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRecovering ? 'animate-spin' : ''}`} />
            {isRecovering ? 'Retrying...' : 'Retry'}
          </Button>
        )}

        {enableRecovery && level !== 'app' && (
          <Button
            onClick={this.handleRecovery}
            disabled={isRecovering}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRecovering ? 'animate-spin' : ''}`} />
            {isRecovering ? 'Recovering...' : 'Recover'}
          </Button>
        )}

        {level === 'app' ? (
          <Button onClick={this.handleReload} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Page
          </Button>
        ) : (
          <Button onClick={this.handleGoHome} size="sm" variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        )}

        <Button
          onClick={this.downloadErrorReport}
          size="sm"
          variant="ghost"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>
    );
  }

  private renderErrorDetails(): ReactNode {
    const { error, errorInfo, showDetails, errorId, contextSnapshot } = this.state;

    if (!showDetails || !error) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">Technical Details</CardTitle>
          <CardDescription>
            Error ID: {errorId}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Error Message</h4>
            <pre className="text-sm bg-muted p-3 rounded overflow-auto">
              {error.message}
            </pre>
          </div>

          {error.stack && (
            <div>
              <h4 className="font-medium mb-2">Stack Trace</h4>
              <pre className="text-sm bg-muted p-3 rounded overflow-auto max-h-40">
                {error.stack}
              </pre>
            </div>
          )}

          {errorInfo?.componentStack && (
            <div>
              <h4 className="font-medium mb-2">Component Stack</h4>
              <pre className="text-sm bg-muted p-3 rounded overflow-auto max-h-40">
                {errorInfo.componentStack}
              </pre>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-2">Context</h4>
            <pre className="text-sm bg-muted p-3 rounded overflow-auto max-h-40">
              {JSON.stringify(contextSnapshot, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Check if custom fallback is provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render different UIs based on boundary level
      return (
        <div className="error-boundary p-6 max-w-2xl mx-auto">
          {this.renderErrorMessage()}

          <div className="mt-4 space-y-4">
            {this.renderActionButtons()}

            <div className="flex items-center gap-2">
              <Button
                onClick={this.toggleDetails}
                size="sm"
                variant="ghost"
              >
                <Bug className="h-4 w-4 mr-2" />
                {this.state.showDetails ? 'Hide' : 'Show'} Technical Details
              </Button>
            </div>

            {this.renderErrorDetails()}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy integration
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  boundaryProps: Omit<ErrorBoundaryProps, 'children'> = { level: 'component' }
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...boundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Specialized error boundaries for different contexts
export const AppErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="app"
    enableRetry={false}
    enableRecovery={false}
    enableReporting={true}
  >
    {children}
  </ErrorBoundary>
);

export const RouteErrorBoundary: React.FC<{ children: ReactNode; route?: string }> = ({
  children,
  route
}) => (
  <ErrorBoundary
    level="route"
    feature={route}
    enableRetry={true}
    enableRecovery={true}
    enableReporting={true}
  >
    {children}
  </ErrorBoundary>
);

export const TournamentErrorBoundary: React.FC<{ children: ReactNode; tournamentId?: string }> = ({
  children,
  tournamentId
}) => (
  <ErrorBoundary
    level="feature"
    feature="tournament"
    enableRetry={true}
    enableRecovery={true}
    enableReporting={true}
    context={{ tournamentId }}
  >
    {children}
  </ErrorBoundary>
);

export const ScoringErrorBoundary: React.FC<{ children: ReactNode; matchId?: string }> = ({
  children,
  matchId
}) => (
  <ErrorBoundary
    level="feature"
    feature="scoring"
    enableRetry={true}
    enableRecovery={true}
    enableReporting={true}
    context={{ matchId }}
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;