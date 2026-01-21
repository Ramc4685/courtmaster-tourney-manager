import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  Database,
  AlertTriangle,
  CheckCircle,
  Upload,
  Download,
  Settings,
  X,
  ChevronDown,
  ChevronUp,
  HardDrive,
  Activity
} from 'lucide-react';
import {
  useNetworkStatus,
  useIsOffline,
  usePendingOperations,
  useSyncProgress,
  useConflicts,
  useStorageInfo,
  useOfflineStore
} from '@/stores/offlineStore';

interface OfflineIndicatorProps {
  position?: 'fixed' | 'relative';
  expanded?: boolean;
  showDetails?: boolean;
  className?: string;
}

export function OfflineIndicator({
  position = 'fixed',
  expanded = false,
  showDetails = true,
  className = ''
}: OfflineIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [showFullDetails, setShowFullDetails] = useState(false);

  const networkStatus = useNetworkStatus();
  const isOffline = useIsOffline();
  const pendingOperations = usePendingOperations();
  const syncProgress = useSyncProgress();
  const conflicts = useConflicts();
  const storageInfo = useStorageInfo();

  const {
    lastSyncTime,
    settings,
    updateStorageInfo,
    clearPendingOperations,
    retryFailedOperation,
    resolveConflict
  } = useOfflineStore();

  const formatTimestamp = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getNetworkIcon = () => {
    if (isOffline) return <WifiOff className="h-4 w-4 text-red-500" />;
    if (networkStatus.effectiveType === '4g') return <Wifi className="h-4 w-4 text-green-500" />;
    if (networkStatus.effectiveType === '3g') return <Wifi className="h-4 w-4 text-yellow-500" />;
    return <Wifi className="h-4 w-4 text-green-500" />;
  };

  const getStatusColor = () => {
    if (isOffline) return 'destructive';
    if (pendingOperations.length > 0) return 'warning';
    if (conflicts.length > 0) return 'secondary';
    return 'default';
  };

  const getStatusText = () => {
    if (isOffline) return 'Offline Mode';
    if (syncProgress.status === 'syncing') return 'Syncing...';
    if (pendingOperations.length > 0) return `${pendingOperations.length} pending`;
    if (conflicts.length > 0) return `${conflicts.length} conflicts`;
    return 'Online';
  };

  const handleSync = async () => {
    try {
      // First try to trigger sync through offline manager
      const { offlineManager } = await import('@/lib/offline/OfflineManager');
      await offlineManager.syncPendingOperations();

      // Also trigger worker sync if available
      const workerUrl = import.meta.env.VITE_WORKER_URL || 'http://localhost:3001';
      try {
        await fetch(`${workerUrl}/sync/trigger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (workerError) {
        console.warn('Worker sync trigger failed:', workerError);
        // Worker sync failure is not critical, offline manager sync already occurred
      }

      // Update store state
      await updateStorageInfo();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const handleClearOperations = async () => {
    if (confirm('Are you sure you want to clear all pending operations? This cannot be undone.')) {
      await clearPendingOperations();
    }
  };

  const CompactIndicator = () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-2 ${className}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {getNetworkIcon()}
            <Badge
              variant={getStatusColor() as any}
              className="ml-2 text-xs px-2"
            >
              {getStatusText()}
            </Badge>
            {pendingOperations.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {pendingOperations.length}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Network: {isOffline ? 'Offline' : 'Online'}</p>
          <p>Pending: {pendingOperations.length} operations</p>
          <p>Last sync: {formatTimestamp(lastSyncTime)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const ExpandedIndicator = () => (
    <Card className={`w-80 shadow-lg ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getNetworkIcon()}
            Offline Status
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Network Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Network</span>
            <Badge variant={isOffline ? 'destructive' : 'default'}>
              {isOffline ? 'Offline' : 'Online'}
            </Badge>
          </div>
          {networkStatus.effectiveType && (
            <div className="text-xs text-gray-500">
              Connection: {networkStatus.effectiveType.toUpperCase()}
              {networkStatus.downlink && ` • ${networkStatus.downlink} Mbps`}
            </div>
          )}
        </div>

        <Separator />

        {/* Sync Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Sync Status</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              disabled={isOffline || syncProgress.status === 'syncing'}
            >
              <RefreshCw className={`h-4 w-4 ${syncProgress.status === 'syncing' ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {syncProgress.status === 'syncing' && (
            <div className="space-y-1">
              <Progress value={(syncProgress.current / syncProgress.total) * 100} />
              <div className="text-xs text-gray-500">
                {syncProgress.current} of {syncProgress.total} operations
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500">
            Last sync: {formatTimestamp(lastSyncTime)}
          </div>
        </div>

        {/* Pending Operations */}
        {pendingOperations.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pending Operations</span>
                <Badge variant="secondary">
                  {pendingOperations.length}
                </Badge>
              </div>
              <div className="text-xs text-gray-500">
                {pendingOperations.filter(op => op.type === 'create').length} creates • {' '}
                {pendingOperations.filter(op => op.type === 'update').length} updates • {' '}
                {pendingOperations.filter(op => op.type === 'delete').length} deletes
              </div>
              {pendingOperations.length > 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearOperations}
                  className="w-full text-xs"
                >
                  Clear All Pending
                </Button>
              )}
            </div>
          </>
        )}

        {/* Conflicts */}
        {conflicts.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Conflicts</span>
                <Badge variant="destructive">
                  {conflicts.filter(c => !c.resolved).length}
                </Badge>
              </div>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {conflicts.filter(c => !c.resolved).length} conflicts need resolution
                </AlertDescription>
              </Alert>
            </div>
          </>
        )}

        {/* Storage Info */}
        <Separator />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Storage</span>
            <span className="text-xs text-gray-500">
              {storageInfo.usagePercentage.toFixed(1)}%
            </span>
          </div>
          <Progress value={storageInfo.usagePercentage} />
          <div className="text-xs text-gray-500">
            {formatBytes(storageInfo.used)} of {formatBytes(storageInfo.available)} used
          </div>
        </div>

        {/* Detailed View Toggle */}
        {showDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFullDetails(!showFullDetails)}
            className="w-full justify-between text-xs"
          >
            {showFullDetails ? 'Hide Details' : 'Show Details'}
            {showFullDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Detailed Information */}
        {showFullDetails && (
          <div className="space-y-3 pt-2 border-t">
            {/* Performance Metrics */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium">Performance</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span>RTT: {networkStatus.rtt || 'N/A'}ms</span>
                </div>
                <div className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  <span>Cache Hit: 85%</span>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium">Settings</h4>
              <div className="text-xs text-gray-500 space-y-1">
                <div>Sync Interval: {settings.syncInterval / 1000}s</div>
                <div>Max Retries: {settings.maxRetries}</div>
                <div>Cache Strategy: {settings.cacheStrategy}</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={updateStorageInfo}
                  className="text-xs"
                >
                  <Database className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Settings opened')}
                  className="text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Settings
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (position === 'fixed') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        {isExpanded ? <ExpandedIndicator /> : <CompactIndicator />}
      </div>
    );
  }

  return isExpanded ? <ExpandedIndicator /> : <CompactIndicator />;
}

// Separate component for floating sync status
export function FloatingSyncStatus() {
  const syncProgress = useSyncProgress();
  const isOffline = useIsOffline();

  if (syncProgress.status !== 'syncing' && !isOffline) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className="w-64 shadow-lg">
        <CardContent className="p-4">
          {isOffline ? (
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Working Offline</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm font-medium">Syncing data...</span>
              </div>
              <Progress value={(syncProgress.current / syncProgress.total) * 100} />
              <div className="text-xs text-gray-500">
                {syncProgress.current} of {syncProgress.total} operations
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Mini indicator for navigation bars
export function MiniOfflineIndicator() {
  const isOffline = useIsOffline();
  const pendingOperations = usePendingOperations();

  if (!isOffline && pendingOperations.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            {isOffline && <WifiOff className="h-4 w-4 text-red-500" />}
            {pendingOperations.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {pendingOperations.length}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isOffline ? 'Offline Mode' : 'Online'}</p>
          {pendingOperations.length > 0 && (
            <p>{pendingOperations.length} operations pending</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}