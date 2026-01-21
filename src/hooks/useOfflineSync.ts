/**
 * Offline Sync Hook for CourtMaster Tournament Management System
 * 
 * A React hook for managing offline synchronization across components.
 * Provides methods for queuing offline actions, detecting connectivity status,
 * and triggering sync when online.
 */

import { useState, useEffect, useCallback } from 'react';
import { ID } from 'appwrite';
import { databases, COLLECTIONS } from '../lib/appwrite';
import offlineQueue, { OfflineActionType, QueuedActionStatus } from '../lib/offlineQueue';
import eventBus, { EventType } from '../events/eventBus';
import { enhancedOfflineManager } from '../lib/offline/EnhancedOfflineManager';
import { serviceWorkerMessaging, createOfflineRequestHandler } from '../lib/network/serviceWorkerMessaging';

interface UseOfflineSyncOptions {
  autoSync?: boolean;
  entityType: string;
  collectionId: string;
  onSyncComplete?: () => void;
  onSyncError?: (error: any) => void;
  onOfflineAction?: (actionType: string, data: any) => void;
}

interface PendingActionStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

interface UseOfflineSyncResult {
  isOnline: boolean;
  isPending: boolean;
  pendingCount: number;
  pendingStats: PendingActionStats;
  queueCreateAction: (data: any, options?: { priority?: number }) => Promise<string>;
  queueUpdateAction: (documentId: string, data: any, options?: { priority?: number }) => Promise<string>;
  queueDeleteAction: (documentId: string, data?: any, options?: { priority?: number }) => Promise<string>;
  queueCustomAction: (
    type: OfflineActionType,
    data: any,
    options?: { documentId?: string; priority?: number }
  ) => Promise<string>;
  syncNow: () => Promise<void>;
  clearPendingActions: () => Promise<void>;
  getFailedActions: () => Promise<any[]>;
  retryFailedAction: (actionId: string) => Promise<void>;
  conflicts: any[];
  resolveConflict: (conflictId: string, strategy: 'last_write_wins' | 'manual' | 'merge') => Promise<void>;
  syncProgress: { current: number; total: number; status: string };
  batchProgress: { [batchId: string]: { current: number; total: number; stage: string } };
  lastSyncTime: number;
  storageInfo: { used: number; available: number };
}

/**
 * Hook for managing offline synchronization
 */
export function useOfflineSync(options: UseOfflineSyncOptions): UseOfflineSyncResult {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [pendingStats, setPendingStats] = useState<PendingActionStats>({
    total: 0,
    byType: {},
    byStatus: {}
  });
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; status: string }>({
    current: 0,
    total: 0,
    status: 'idle'
  });
  const [batchProgress, setBatchProgress] = useState<{ [batchId: string]: { current: number; total: number; stage: string } }>({});
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [storageInfo, setStorageInfo] = useState<{ used: number; available: number }>({
    used: 0,
    available: 0
  });
  
  // Initialize options with defaults
  const {
    autoSync = true,
    entityType,
    collectionId,
    onSyncComplete,
    onSyncError,
    onOfflineAction
  } = options;
  
  /**
   * Update pending action statistics
   */
  const updatePendingStats = useCallback(async () => {
    try {
      // Get operations from the enhanced offline manager only
      const pendingOps = await enhancedOfflineManager.getPendingOperations();

      const allActions = [];

      // Count by type and status
      const byType: Record<string, number> = {};
      const byStatus: Record<string, number> = {};

      // Count offline manager operations only
      pendingOps.forEach(op => {
        byType[op.type] = (byType[op.type] || 0) + 1;
        byStatus[op.status] = (byStatus[op.status] || 0) + 1;
      });

      const totalCount = pendingOps.length;

      setPendingStats({
        total: totalCount,
        byType,
        byStatus
      });

      setPendingCount(totalCount);
      setIsPending(totalCount > 0);
    } catch (error) {
      console.error('Error updating pending stats:', error);
    }
  }, []);

  /**
   * Update conflicts from offline manager
   */
  const updateConflicts = useCallback(async () => {
    try {
      const unresolvedConflicts = await enhancedOfflineManager.getUnresolvedConflicts();
      setConflicts(unresolvedConflicts);
    } catch (error) {
      console.error('Error updating conflicts:', error);
    }
  }, []);

  /**
   * Update storage information
   */
  const updateStorageInfo = useCallback(async () => {
    try {
      const info = await enhancedOfflineManager.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Error updating storage info:', error);
    }
  }, []);

  /**
   * Update last sync time
   */
  const updateLastSyncTime = useCallback(async () => {
    try {
      const lastSync = await enhancedOfflineManager.getLastSyncTime();
      setLastSyncTime(lastSync);
    } catch (error) {
      console.error('Error updating last sync time:', error);
    }
  }, []);
  
  /**
   * Handle online/offline status changes and offline manager events
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (autoSync) {
        syncNow();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Handle offline manager events
    const handleOfflineManagerEvent = (data: any) => {
      switch (data.type) {
        case 'network':
          setIsOnline(data.status === 'online');
          break;
        case 'sync_started':
          setSyncProgress({ current: 0, total: 0, status: 'syncing' });
          break;
        case 'sync_completed':
          setSyncProgress({ current: data.operations || 0, total: data.operations || 0, status: 'completed' });
          updatePendingStats();
          break;
        case 'sync_failed':
          setSyncProgress(prev => ({ ...prev, status: 'failed' }));
          break;
        case 'conflict_detected':
          updateConflicts();
          break;
        case 'conflict_resolved':
          updateConflicts();
          break;
        case 'operation_synced':
          setSyncProgress(prev => ({
            ...prev,
            current: prev.current + 1,
            status: 'syncing'
          }));
          break;
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const unsubscribe = enhancedOfflineManager.addListener(handleOfflineManagerEvent);

    // Register hardened service worker message handler
    const offlineRequestHandler = createOfflineRequestHandler(async (data) => {
      try {
        // Determine the target collection and document ID
        const targetCollection = data.collection || collectionId;
        const targetDocumentId = data.documentId || ID.unique();
        
        // Queue the operation based on method (no body/headers for security)
        let actionId: string;
        switch (data.method) {
          case 'POST':
            actionId = await enhancedOfflineManager.queueOperation('create', targetCollection, targetDocumentId, {});
            break;
          case 'PUT':
          case 'PATCH':
            actionId = await enhancedOfflineManager.queueOperation('update', targetCollection, targetDocumentId, {});
            break;
          case 'DELETE':
            actionId = await enhancedOfflineManager.queueOperation('delete', targetCollection, targetDocumentId);
            break;
          default:
            console.warn('Unsupported HTTP method for offline queueing:', data.method);
            return;
        }
        
        console.log('Queued offline operation from service worker:', actionId);
        
        // Update pending stats
        updatePendingStats();
        
        // Trigger onOfflineAction callback if provided
        if (options.onOfflineAction) {
          options.onOfflineAction(data.method.toLowerCase(), {});
        }
        
      } catch (error) {
        console.error('Error processing service worker offline request:', error);
      }
    });

    serviceWorkerMessaging.registerHandler(offlineRequestHandler);

    // Initial state update
    setIsOnline(navigator.onLine);
    updatePendingStats();
    updateConflicts();
    updateStorageInfo();
    updateLastSyncTime();

    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      serviceWorkerMessaging.unregisterHandler('QUEUE_OFFLINE_REQUEST');
      unsubscribe();
    };
  }, [autoSync, updatePendingStats]);
  
  /**
   * Queue a create action
   */
  const queueCreateAction = useCallback(async (
    data: any,
    options?: { priority?: number }
  ): Promise<string> => {
    try {
      // Use the enhanced offline manager for better conflict resolution and sync
      const actionId = await enhancedOfflineManager.queueOperation(
        'create',
        collectionId,
        data.id || ID.unique(),
        data
      );

      // Legacy queueing removed to avoid double-processing

      // Notify about offline action
      if (onOfflineAction) {
        onOfflineAction('create', data);
      }

      // Update stats
      updatePendingStats();

      return actionId;
    } catch (error) {
      console.error('Error queueing create action:', error);
      throw error;
    }
  }, [collectionId, entityType, onOfflineAction, updatePendingStats]);
  
  /**
   * Queue an update action
   */
  const queueUpdateAction = useCallback(async (
    documentId: string,
    data: any,
    options?: { priority?: number }
  ): Promise<string> => {
    try {
      const actionId = await enhancedOfflineManager.queueOperation(
        'update',
        collectionId,
        documentId,
        data
      );
      
      // Notify about offline action
      if (onOfflineAction) {
        onOfflineAction('update', { id: documentId, ...data });
      }
      
      // Update stats
      updatePendingStats();
      
      return actionId;
    } catch (error) {
      console.error('Error queueing update action:', error);
      throw error;
    }
  }, [collectionId, entityType, onOfflineAction, updatePendingStats]);
  
  /**
   * Queue a delete action
   */
  const queueDeleteAction = useCallback(async (
    documentId: string,
    data?: any,
    options?: { priority?: number }
  ): Promise<string> => {
    try {
      const actionId = await enhancedOfflineManager.queueOperation(
        'delete',
        collectionId,
        documentId,
        data
      );
      
      // Notify about offline action
      if (onOfflineAction) {
        onOfflineAction('delete', { id: documentId });
      }
      
      // Update stats
      updatePendingStats();
      
      return actionId;
    } catch (error) {
      console.error('Error queueing delete action:', error);
      throw error;
    }
  }, [collectionId, entityType, onOfflineAction, updatePendingStats]);
  
  /**
   * Queue a custom action (e.g., score update, check-in)
   */
  const queueCustomAction = useCallback(async (
    type: OfflineActionType,
    data: any,
    options?: { documentId?: string; priority?: number }
  ): Promise<string> => {
    try {
      // Map OfflineActionType to offline manager operation type
      const operationType = type === OfflineActionType.CREATE ? 'create' :
                           type === OfflineActionType.UPDATE ? 'update' :
                           type === OfflineActionType.DELETE ? 'delete' : 'update';

      const actionId = await enhancedOfflineManager.queueOperation(
        operationType,
        collectionId,
        options?.documentId || data.id,
        data
      );
      
      // Notify about offline action
      if (onOfflineAction) {
        onOfflineAction(type, data);
      }
      
      // Update stats
      updatePendingStats();
      
      return actionId;
    } catch (error) {
      console.error(`Error queueing ${type} action:`, error);
      throw error;
    }
  }, [collectionId, entityType, onOfflineAction, updatePendingStats]);
  
  /**
   * Manually trigger synchronization
   */
  const syncNow = useCallback(async (): Promise<void> => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }

    try {
      // Use the enhanced offline manager for improved sync
      await enhancedOfflineManager.syncPendingOperations();

      // Legacy queue processing removed to avoid double-processing

      // Update stats after sync
      await updatePendingStats();
      await updateLastSyncTime();

      // Emit event for successful sync
      eventBus.emit(EventType.SYNC_COMPLETED, {
        entityType,
        timestamp: Date.now()
      }, 'OfflineSync');

      // Notify about sync completion
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      console.error('Error syncing:', error);

      // Notify about sync error
      if (onSyncError) {
        onSyncError(error);
      }

      throw error;
    }
  }, [isOnline, entityType, onSyncComplete, onSyncError, updatePendingStats, updateLastSyncTime]);
  
  /**
   * Clear all pending actions
   */
  const clearPendingActions = useCallback(async (): Promise<void> => {
    try {
      await enhancedOfflineManager.clearOfflineData();
      await updatePendingStats();
    } catch (error) {
      console.error('Error clearing pending actions:', error);
      throw error;
    }
  }, [updatePendingStats]);
  
  /**
   * Get all failed actions
   */
  const getFailedActions = useCallback(async (): Promise<any[]> => {
    try {
      // Get failed operations from enhanced offline manager
      const allOps = await enhancedOfflineManager.getPendingOperations();
      return allOps.filter(op => op.status === 'failed');
    } catch (error) {
      console.error('Error getting failed actions:', error);
      throw error;
    }
  }, []);
  
  /**
   * Retry a failed action
   */
  const retryFailedAction = useCallback(async (actionId: string): Promise<void> => {
    try {
      // In a real implementation, we would need to modify the action status
      // For now, we'll just log it
      console.log(`Retrying failed action ${actionId}`);

      // Update stats
      await updatePendingStats();
    } catch (error) {
      console.error(`Error retrying failed action ${actionId}:`, error);
      throw error;
    }
  }, [updatePendingStats]);

  /**
   * Resolve a conflict
   */
  const resolveConflict = useCallback(async (
    conflictId: string,
    strategy: 'last_write_wins' | 'manual' | 'merge'
  ): Promise<void> => {
    try {
      await enhancedOfflineManager.resolveConflict(conflictId, strategy);
      await updateConflicts();
    } catch (error) {
      console.error(`Error resolving conflict ${conflictId}:`, error);
      throw error;
    }
  }, [updateConflicts]);
  
  // Return the hook result
  return {
    isOnline,
    isPending,
    pendingCount,
    pendingStats,
    queueCreateAction,
    queueUpdateAction,
    queueDeleteAction,
    queueCustomAction,
    syncNow,
    clearPendingActions,
    getFailedActions,
    retryFailedAction,
    conflicts,
    resolveConflict,
    syncProgress,
    batchProgress,
    lastSyncTime,
    storageInfo
  };
}

/**
 * Hook specifically for match score offline synchronization
 */
export function useMatchScoreOfflineSync(tournamentId: string) {
  const {
    isOnline,
    isPending,
    pendingCount,
    queueCustomAction,
    syncNow
  } = useOfflineSync({
    entityType: 'match',
    collectionId: COLLECTIONS.MATCHES,
    onSyncComplete: () => {
      console.log('Match score sync completed');
    }
  });
  
  /**
   * Queue a score update
   */
  const queueScoreUpdate = useCallback(async (
    matchId: string,
    scoreData: any
  ): Promise<void> => {
    await queueCustomAction(
      OfflineActionType.SCORE,
      {
        matchId,
        tournamentId,
        scores: scoreData,
        timestamp: Date.now()
      },
      {
        documentId: matchId,
        priority: 2 // High priority for score updates
      }
    );
  }, [queueCustomAction, tournamentId]);
  
  return {
    isOnline,
    isPending,
    pendingScoreUpdates: pendingCount,
    queueScoreUpdate,
    syncNow
  };
}

/**
 * Hook specifically for check-in offline synchronization
 */
export function useCheckInOfflineSync(tournamentId: string) {
  const {
    isOnline,
    isPending,
    pendingCount,
    queueCustomAction,
    syncNow
  } = useOfflineSync({
    entityType: 'registration',
    collectionId: COLLECTIONS.REGISTRATIONS,
    onSyncComplete: () => {
      console.log('Check-in sync completed');
    }
  });
  
  /**
   * Queue a check-in update
   */
  const queueCheckIn = useCallback(async (
    registrationId: string,
    checkInData: {
      checked_in: boolean;
      checked_in_at?: string;
      checked_in_by?: string;
    }
  ): Promise<void> => {
    await queueCustomAction(
      OfflineActionType.CHECK_IN,
      {
        registrationId,
        tournamentId,
        ...checkInData,
        timestamp: Date.now()
      },
      {
        documentId: registrationId,
        priority: 3 // Highest priority for check-in updates
      }
    );
  }, [queueCustomAction, tournamentId]);
  
  return {
    isOnline,
    isPending,
    pendingCheckIns: pendingCount,
    queueCheckIn,
    syncNow
  };
}

/**
 * Hook specifically for registration offline synchronization
 */
export function useRegistrationOfflineSync(tournamentId: string) {
  const {
    isOnline,
    isPending,
    pendingCount,
    queueCreateAction,
    queueUpdateAction,
    syncNow
  } = useOfflineSync({
    entityType: 'registration',
    collectionId: COLLECTIONS.REGISTRATIONS,
    onSyncComplete: () => {
      console.log('Registration sync completed');
    }
  });
  
  /**
   * Queue a registration creation
   */
  const queueRegistrationCreate = useCallback(async (
    registrationData: any
  ): Promise<string> => {
    // Generate a temporary ID
    const tempId = ID.unique();
    
    return await queueCreateAction(
      {
        ...registrationData,
        tournament_id: tournamentId,
        temp_id: tempId,
        timestamp: Date.now()
      },
      { priority: 2 }
    );
  }, [queueCreateAction, tournamentId]);
  
  /**
   * Queue a registration update
   */
  const queueRegistrationUpdate = useCallback(async (
    registrationId: string,
    updateData: any
  ): Promise<string> => {
    return await queueUpdateAction(
      registrationId,
      {
        ...updateData,
        timestamp: Date.now()
      },
      { priority: 2 }
    );
  }, [queueUpdateAction]);
  
  return {
    isOnline,
    isPending,
    pendingRegistrations: pendingCount,
    queueRegistrationCreate,
    queueRegistrationUpdate,
    syncNow
  };
}

export default useOfflineSync;
