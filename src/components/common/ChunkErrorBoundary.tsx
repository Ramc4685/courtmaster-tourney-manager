/**
 * Chunk Error Boundary
 * 
 * Specialized error boundary for handling code splitting chunk loading failures
 * with automatic retry and fallback mechanisms
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

interface ChunkErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  route?: string;
  onChunkError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ChunkErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isChunkError: boolean;
  retryCount: number;
  isRetrying: boolean;
}

class ChunkErrorBoundary extends Component<ChunkErrorBoundaryProps, ChunkErrorBoundaryState> {
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(props: ChunkErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isChunkError: false,
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ChunkErrorBoundaryState> {
    // Check if this is a chunk loading error
    const isChunkError = ChunkErrorBoundary.isChunkLoadingError(error);
    
    return {
      hasError: true,
      error,
      isChunkError,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo
    });

    // Log chunk errors for monitoring
    if (this.state.isChunkError) {
      console.error('Chunk loading failed:', {
        error: error.message,
        route: this.props.route,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount
      });
    }

    // Call custom error handler if provided
    if (this.props.onChunkError) {
      this.props.onChunkError(error, errorInfo);
    }
  }

  /**
   * Check if the error is related to chunk loading
   */
  static isChunkLoadingError(error: Error): boolean {
    const chunkErrorPatterns = [
      /loading chunk \d+ failed/i,
      /loading css chunk \d+ failed/i,
      /failed to import/i,
      /network error/i,
      /fetch.*chunk/i,
      /dynamically imported module/i,
      /script error/i
    ];

    return chunkErrorPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.stack || '')
    );
  }

  /**
   * Retry loading the failed chunk
   */
  private handleRetry = async (): Promise<void> => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });

    // Progressive delay for retries
    const delay = this.retryDelay * Math.pow(2, this.state.retryCount);

    try {
      // Clear module cache to force re-fetch
      if ('webpackChunkName' in window) {
        // Clear webpack chunk cache if available
        delete (window as any).__webpack_require__.cache;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));

      // Reset error state to trigger re-render
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false,
        retryCount: this.state.retryCount + 1
      });

    } catch (retryError) {
      console.error('Retry failed:', retryError);
      this.setState({ 
        isRetrying: false,
        retryCount: this.state.retryCount + 1
      });
    }
  };

  /**
   * Force reload the entire page
   */
  private handleReload = (): void => {
    window.location.reload();
  };

  /**
   * Navigate to home page
   */
  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  /**
   * Render error UI for chunk loading failures
   */
  private renderChunkError(): ReactNode {
    const { route } = this.props;
    const { retryCount, isRetrying } = this.state;

    return (
      <div className="chunk-error-boundary p-6 max-w-2xl mx-auto">
        <Alert className="border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            Failed to Load Page
            {retryCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                (Attempt {retryCount + 1})
              </span>
            )}
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              There was a problem loading the {route ? `"${route}"` : 'requested'} page. 
              This might be due to a network issue or a temporary problem with the application.
            </p>
            <p className="text-sm text-muted-foreground">
              Try refreshing the page or check your internet connection.
            </p>
          </AlertDescription>
        </Alert>

        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {retryCount < this.maxRetries && (
              <Button
                onClick={this.handleRetry}
                disabled={isRetrying}
                size="sm"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </Button>
            )}

            <Button onClick={this.handleReload} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>

            <Button onClick={this.handleGoHome} size="sm" variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>

          {retryCount >= this.maxRetries && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Still Having Problems?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  If the problem persists, try:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Clear your browser cache and cookies</li>
                  <li>• Disable browser extensions temporarily</li>
                  <li>• Try using a different browser or incognito mode</li>
                  <li>• Check your internet connection</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  /**
   * Render generic error UI for non-chunk errors
   */
  private renderGenericError(): ReactNode {
    const { error } = this.state;

    return (
      <div className="chunk-error-boundary p-6 max-w-2xl mx-auto">
        <Alert className="border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>An unexpected error occurred while loading this page.</p>
            {error && (
              <p className="text-sm font-mono text-destructive">
                {error.message}
              </p>
            )}
          </AlertDescription>
        </Alert>

        <div className="mt-4">
          <div className="flex gap-2">
            <Button onClick={this.handleReload} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>

            <Button onClick={this.handleGoHome} size="sm" variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Check if custom fallback is provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render appropriate error UI based on error type
      return this.state.isChunkError 
        ? this.renderChunkError() 
        : this.renderGenericError();
    }

    return this.props.children;
  }
}

// Higher-order component for easy integration
export function withChunkErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  route?: string
) {
  const WrappedComponent = (props: P) => (
    <ChunkErrorBoundary route={route}>
      <Component {...props} />
    </ChunkErrorBoundary>
  );

  WrappedComponent.displayName = `withChunkErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

export default ChunkErrorBoundary;
