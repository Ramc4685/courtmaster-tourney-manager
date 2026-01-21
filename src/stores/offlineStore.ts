import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { enhancedOfflineManager } from '@/lib/offline/EnhancedOfflineManager';

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  data?: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

interface ConflictResolution {
  id: string;
  localData: any;
  remoteData: any;
  strategy: 'last_write_wins' | 'manual' | 'merge';
  resolved: boolean;
  timestamp: number;
}

interface SyncProgress {
  current: number;
  total: number;
  status: 'idle' | 'syncing' | 'completed' | 'failed';
  error?: string;
}

interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface StorageInfo {
  used: number;
  available: number;
  quota: number;
  usagePercentage: number;
}

interface OfflineState {
  // Network and connectivity
  networkStatus: NetworkStatus;
  isOfflineMode: boolean;
  lastSyncTime: number;

  // Sync operations
  pendingOperations: SyncOperation[];
  syncProgress: SyncProgress;
  failedOperations: SyncOperation[];

  // Conflict resolution
  conflicts: ConflictResolution[];
  autoResolveConflicts: boolean;
  conflictStrategy: 'last_write_wins' | 'manual' | 'merge';

  // Storage and performance
  storageInfo: StorageInfo;
  cacheStats: {
    tournaments: number;
    teams: number;
    matches: number;
    registrations: number;
  };

  // Settings
  settings: {
    syncInterval: number;
    maxRetries: number;
    enableBackgroundSync: boolean;
    enablePushNotifications: boolean;
    cacheStrategy: 'cache_first' | 'network_first' | 'cache_only';
  };

  // Actions
  updateNetworkStatus: (status: Partial<NetworkStatus>) => void;
  setOfflineMode: (enabled: boolean) => void;

  // Sync operations
  queueOperation: (operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>) => Promise<string>;
  updateSyncProgress: (progress: Partial<SyncProgress>) => void;
  clearPendingOperations: () => Promise<void>;
  retryFailedOperation: (operationId: string) => Promise<void>;

  // Conflict resolution
  addConflict: (conflict: Omit<ConflictResolution, 'id' | 'timestamp'>) => void;
  resolveConflict: (conflictId: string, strategy: ConflictResolution['strategy'], resolution?: any) => Promise<void>;
  setConflictStrategy: (strategy: ConflictResolution['strategy']) => void;

  // Storage management
  updateStorageInfo: () => Promise<void>;
  clearCache: (collections?: string[]) => Promise<void>;
  exportData: () => Promise<Blob>;
  importData: (data: Blob) => Promise<void>;

  // Settings
  updateSettings: (settings: Partial<OfflineState['settings']>) => void;

  // Initialization and cleanup
  initialize: () => Promise<void>;
  dispose: () => void;
}

export const useOfflineStore = create<OfflineState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    networkStatus: {
      isOnline: navigator.onLine,
      effectiveType: (navigator as any).connection?.effectiveType,
      downlink: (navigator as any).connection?.downlink,
      rtt: (navigator as any).connection?.rtt,
    },
    isOfflineMode: !navigator.onLine,
    lastSyncTime: 0,

    pendingOperations: [],
    syncProgress: {
      current: 0,
      total: 0,
      status: 'idle'
    },
    failedOperations: [],

    conflicts: [],
    autoResolveConflicts: true,
    conflictStrategy: 'last_write_wins',

    storageInfo: {
      used: 0,
      available: 0,
      quota: 0,
      usagePercentage: 0
    },
    cacheStats: {
      tournaments: 0,
      teams: 0,
      matches: 0,
      registrations: 0
    },

    settings: {
      syncInterval: 30000,
      maxRetries: 3,
      enableBackgroundSync: true,
      enablePushNotifications: true,
      cacheStrategy: 'cache_first'
    },

    // Actions
    updateNetworkStatus: (status) => {
      set((state) => ({
        networkStatus: { ...state.networkStatus, ...status },
        isOfflineMode: status.isOnline !== undefined ? !status.isOnline : state.isOfflineMode
      }));
    },

    setOfflineMode: (enabled) => {
      set({ isOfflineMode: enabled });
    },

    queueOperation: async (operation) => {
      const id = await enhancedOfflineManager.queueOperation(
        operation.type,
        operation.collection,
        operation.documentId,
        operation.data
      );

      const newOperation: SyncOperation = {
        ...operation,
        id,
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending'
      };

      set((state) => ({
        pendingOperations: [...state.pendingOperations, newOperation]
      }));

      return id;
    },

    updateSyncProgress: (progress) => {
      set((state) => ({
        syncProgress: { ...state.syncProgress, ...progress }
      }));
    },

    clearPendingOperations: async () => {
      await enhancedOfflineManager.clearOfflineData();
      set({
        pendingOperations: [],
        failedOperations: []
      });
    },

    retryFailedOperation: async (operationId) => {
      const state = get();
      const operation = state.failedOperations.find(op => op.id === operationId);

      if (operation) {
        // Move from failed back to pending
        set((state) => ({
          failedOperations: state.failedOperations.filter(op => op.id !== operationId),
          pendingOperations: [...state.pendingOperations, { ...operation, status: 'pending', retryCount: operation.retryCount + 1 }]
        }));

        // Queue for sync
        await enhancedOfflineManager.queueOperation(
          operation.type,
          operation.collection,
          operation.documentId,
          operation.data
        );
      }
    },

    addConflict: (conflict) => {
      const newConflict: ConflictResolution = {
        ...conflict,
        id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };

      set((state) => ({
        conflicts: [...state.conflicts, newConflict]
      }));
    },

    resolveConflict: async (conflictId, strategy, resolution) => {
      await enhancedOfflineManager.resolveConflict(conflictId, strategy);

      set((state) => ({
        conflicts: state.conflicts.map(conflict =>
          conflict.id === conflictId
            ? { ...conflict, resolved: true, strategy }
            : conflict
        )
      }));
    },

    setConflictStrategy: (strategy) => {
      set({ conflictStrategy: strategy });
    },

    updateStorageInfo: async () => {
      try {
        const info = await enhancedOfflineManager.getStorageInfo();
        const usagePercentage = info.available > 0 ? (info.used / info.available) * 100 : 0;

        set({
          storageInfo: {
            ...info,
            quota: info.available,
            usagePercentage
          }
        });

        // Update cache stats
        const tournaments = await enhancedOfflineManager.getData('tournaments') || {};
        const teams = await enhancedOfflineManager.getData('teams') || {};
        const matches = await enhancedOfflineManager.getData('matches') || {};
        const registrations = await enhancedOfflineManager.getData('registrations') || {};

        set({
          cacheStats: {
            tournaments: Object.keys(tournaments).length,
            teams: Object.keys(teams).length,
            matches: Object.keys(matches).length,
            registrations: Object.keys(registrations).length
          }
        });
      } catch (error) {
        console.error('Failed to update storage info:', error);
      }
    },

    clearCache: async (collections) => {
      if (collections) {
        // Clear specific collections
        for (const collection of collections) {
          await enhancedOfflineManager.storeData(collection, {});
        }
      } else {
        // Clear all data
        await enhancedOfflineManager.clearOfflineData();
      }

      // Update storage info after clearing
      await get().updateStorageInfo();
    },

    exportData: async () => {
      const data = {
        tournaments: await enhancedOfflineManager.getData('tournaments'),
        teams: await enhancedOfflineManager.getData('teams'),
        matches: await enhancedOfflineManager.getData('matches'),
        registrations: await enhancedOfflineManager.getData('registrations'),
        lastSyncTime: await enhancedOfflineManager.getLastSyncTime(),
        exportedAt: Date.now()
      };

      return new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
    },

    importData: async (data) => {
      try {
        const text = await data.text();
        const parsedData = JSON.parse(text);

        // Validate data structure
        if (!parsedData.tournaments || !parsedData.exportedAt) {
          throw new Error('Invalid data format');
        }

        // Import data to offline manager
        await enhancedOfflineManager.storeData('tournaments', parsedData.tournaments);
        await enhancedOfflineManager.storeData('teams', parsedData.teams || {});
        await enhancedOfflineManager.storeData('matches', parsedData.matches || {});
        await enhancedOfflineManager.storeData('registrations', parsedData.registrations || {});

        // Update storage info
        await get().updateStorageInfo();
      } catch (error) {
        console.error('Failed to import data:', error);
        throw new Error('Failed to import data: Invalid format or corrupted file');
      }
    },

    updateSettings: (newSettings) => {
      set((state) => ({
        settings: { ...state.settings, ...newSettings }
      }));

      // Save settings to localStorage for persistence
      localStorage.setItem('courtmaster-offline-settings', JSON.stringify(get().settings));
    },

    initialize: async () => {
      try {
        // Load persisted settings
        const savedSettings = localStorage.getItem('courtmaster-offline-settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          set((state) => ({ settings: { ...state.settings, ...settings } }));
        }

        // Initialize storage info
        await get().updateStorageInfo();

        // Get last sync time
        const lastSync = await enhancedOfflineManager.getLastSyncTime();
        set({ lastSyncTime: lastSync });

        // Setup network status monitoring
        const updateNetworkInfo = () => {
          const connection = (navigator as any).connection;
          get().updateNetworkStatus({
            isOnline: navigator.onLine,
            effectiveType: connection?.effectiveType,
            downlink: connection?.downlink,
            rtt: connection?.rtt
          });
        };

        // Listen for network changes
        window.addEventListener('online', updateNetworkInfo);
        window.addEventListener('offline', updateNetworkInfo);

        if ((navigator as any).connection) {
          (navigator as any).connection.addEventListener('change', updateNetworkInfo);
        }

        // Setup offline manager listeners
        const unsubscribe = enhancedOfflineManager.addListener((event) => {
          switch (event.type) {
            case 'sync_started':
              get().updateSyncProgress({ status: 'syncing', current: 0, total: 0 });
              break;

            case 'sync_completed':
              get().updateSyncProgress({
                status: 'completed',
                current: event.operations || 0,
                total: event.operations || 0
              });
              set({ lastSyncTime: Date.now() });
              get().updateStorageInfo();
              break;

            case 'sync_failed':
              get().updateSyncProgress({ status: 'failed', error: event.error });
              break;

            case 'operation_synced': {
              const currentProgress = get().syncProgress;
              get().updateSyncProgress({
                ...currentProgress,
                current: currentProgress.current + 1
              });
              break;
            }

            case 'conflict_detected':
              // Add conflict to store
              get().addConflict({
                localData: event.localData,
                remoteData: event.remoteData,
                strategy: get().conflictStrategy,
                resolved: false
              });
              break;
          }
        });

        // Store the unsubscribe function for cleanup
        (get() as any)._unsubscribeOfflineManager = unsubscribe;

        console.log('Offline store initialized successfully');
      } catch (error) {
        console.error('Failed to initialize offline store:', error);
      }
    },

    dispose: () => {
      // Cleanup listeners
      const unsubscribe = (get() as any)._unsubscribeOfflineManager;
      if (unsubscribe) {
        unsubscribe();
      }

      // Create dummy event handlers for cleanup
      const dummyHandler = () => {};
      window.removeEventListener('online', dummyHandler);
      window.removeEventListener('offline', dummyHandler);

      if ((navigator as any).connection) {
        (navigator as any).connection.removeEventListener('change', dummyHandler);
      }
    }
  }))
);

// Selectors for common use cases
export const useNetworkStatus = () => useOfflineStore((state) => state.networkStatus);
export const useIsOffline = () => useOfflineStore((state) => state.isOfflineMode);
export const usePendingOperations = () => useOfflineStore((state) => state.pendingOperations);
export const useSyncProgress = () => useOfflineStore((state) => state.syncProgress);
export const useConflicts = () => useOfflineStore((state) => state.conflicts);
export const useStorageInfo = () => useOfflineStore((state) => state.storageInfo);
export const useOfflineSettings = () => useOfflineStore((state) => state.settings);

// Initialize the store on import
if (typeof window !== 'undefined') {
  useOfflineStore.getState().initialize();
}