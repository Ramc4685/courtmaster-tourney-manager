import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { nanoid } from 'nanoid';

interface OfflineData {
  tournaments: Record<string, any>;
  teams: Record<string, any>;
  matches: Record<string, any>;
  registrations: Record<string, any>;
  lastSync: number;
}

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

interface OfflineDB extends DBSchema {
  data: {
    key: string;
    value: any;
  };
  operations: {
    key: string;
    value: SyncOperation;
  };
  conflicts: {
    key: string;
    value: ConflictResolution;
  };
  metadata: {
    key: string;
    value: any;
  };
}

export class OfflineManager {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private retryTimeouts = new Map<string, NodeJS.Timeout>();
  private listeners = new Set<(data: any) => void>();

  constructor() {
    this.initDB();
    this.setupNetworkListeners();
    this.startPeriodicSync();
  }

  private async initDB(): Promise<void> {
    try {
      this.db = await openDB<OfflineDB>('courtmaster-offline', 3, {
        upgrade(db, oldVersion, newVersion) {
          // Data store for offline tournament data
          if (!db.objectStoreNames.contains('data')) {
            db.createObjectStore('data');
          }

          // Operations queue for pending sync operations
          if (!db.objectStoreNames.contains('operations')) {
            const operationsStore = db.createObjectStore('operations');
            operationsStore.createIndex('timestamp', 'timestamp');
            operationsStore.createIndex('status', 'status');
            operationsStore.createIndex('collection', 'collection');
          }

          // Conflict resolution store
          if (!db.objectStoreNames.contains('conflicts')) {
            const conflictsStore = db.createObjectStore('conflicts');
            conflictsStore.createIndex('timestamp', 'timestamp');
            conflictsStore.createIndex('resolved', 'resolved');
          }

          // Metadata store
          if (!db.objectStoreNames.contains('metadata')) {
            db.createObjectStore('metadata');
          }
        },
      });

      // Initialize metadata if first time
      const lastSync = await this.db.get('metadata', 'lastSync');
      if (!lastSync) {
        await this.db.put('metadata', Date.now(), 'lastSync');
      }
    } catch (error) {
      console.error('Failed to initialize offline database:', error);
    }
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  private handleOnline(): void {
    this.isOnline = true;
    console.log('Network connection restored - starting sync');
    this.syncPendingOperations();
    this.notifyListeners({ type: 'network', status: 'online' });
  }

  private handleOffline(): void {
    this.isOnline = false;
    console.log('Network connection lost - switching to offline mode');
    this.notifyListeners({ type: 'network', status: 'offline' });
  }

  private startPeriodicSync(): void {
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncPendingOperations();
      }
    }, 30000); // Sync every 30 seconds when online
  }

  public async storeData(collection: string, data: Record<string, any>): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.put('data', data, collection);
      this.notifyListeners({ type: 'data_stored', collection, count: Object.keys(data).length });
    } catch (error) {
      console.error(`Failed to store ${collection} data:`, error);
    }
  }

  public async getData(collection: string): Promise<Record<string, any> | null> {
    if (!this.db) return null;

    try {
      return await this.db.get('data', collection) || null;
    } catch (error) {
      console.error(`Failed to get ${collection} data:`, error);
      return null;
    }
  }

  public async queueOperation(
    type: SyncOperation['type'],
    collection: string,
    documentId: string,
    data?: any
  ): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const operation: SyncOperation = {
      id: nanoid(),
      type,
      collection,
      documentId,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    try {
      await this.db.put('operations', operation, operation.id);

      // If online, try to sync immediately
      if (this.isOnline) {
        this.syncOperation(operation);
      }

      this.notifyListeners({
        type: 'operation_queued',
        operation: { id: operation.id, type, collection, documentId }
      });

      return operation.id;
    } catch (error) {
      console.error('Failed to queue operation:', error);
      throw error;
    }
  }

  public async getPendingOperations(): Promise<SyncOperation[]> {
    if (!this.db) return [];

    try {
      const operations = await this.db.getAllFromIndex('operations', 'status', 'pending');
      return operations.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Failed to get pending operations:', error);
      return [];
    }
  }

  public async syncPendingOperations(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    this.notifyListeners({ type: 'sync_started' });

    try {
      const pendingOps = await this.getPendingOperations();

      for (const operation of pendingOps) {
        await this.syncOperation(operation);
      }

      // Update last sync timestamp
      await this.db?.put('metadata', Date.now(), 'lastSync');

      this.notifyListeners({ type: 'sync_completed', operations: pendingOps.length });
    } catch (error) {
      console.error('Sync failed:', error);
      this.notifyListeners({ type: 'sync_failed', error: error.message });
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncOperation(operation: SyncOperation): Promise<void> {
    if (!this.db) return;

    try {
      // Update operation status to syncing
      operation.status = 'syncing';
      await this.db.put('operations', operation, operation.id);

      // Simulate API call - replace with actual Appwrite API calls
      const result = await this.performServerSync(operation);

      if (result.success) {
        // Mark operation as completed
        operation.status = 'completed';
        await this.db.put('operations', operation, operation.id);

        this.notifyListeners({
          type: 'operation_synced',
          operation: { id: operation.id, type: operation.type, collection: operation.collection }
        });
      } else if (result.conflict) {
        // Handle conflict
        await this.handleConflict(operation, result.remoteData);
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      console.error(`Failed to sync operation ${operation.id}:`, error);
      await this.handleSyncError(operation, error);
    }
  }

  private async performServerSync(operation: SyncOperation): Promise<any> {
    // Send operation to worker queue instead of direct Appwrite calls
    const workerUrl = import.meta.env.VITE_WORKER_URL || 'http://localhost:3001';

    try {
      const response = await fetch(`${workerUrl}/sync/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: operation.type,
          collection: operation.collection,
          documentId: operation.documentId,
          data: operation.data
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result };
      } else {
        const error = await response.text();
        return {
          success: false,
          error: `Worker queue error: ${response.status} ${error}`
        };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async handleSyncError(operation: SyncOperation, error: any): Promise<void> {
    if (!this.db) return;

    operation.retryCount++;
    operation.status = 'failed';

    if (operation.retryCount < 3) {
      // Schedule retry with exponential backoff
      const retryDelay = Math.pow(2, operation.retryCount) * 1000;

      const timeoutId = setTimeout(() => {
        operation.status = 'pending';
        this.db?.put('operations', operation, operation.id);
        this.retryTimeouts.delete(operation.id);
      }, retryDelay);

      this.retryTimeouts.set(operation.id, timeoutId);
    }

    await this.db.put('operations', operation, operation.id);

    this.notifyListeners({
      type: 'operation_failed',
      operation: { id: operation.id, type: operation.type, collection: operation.collection },
      error: error.message,
      retryCount: operation.retryCount
    });
  }

  private async handleConflict(operation: SyncOperation, remoteData: any): Promise<void> {
    if (!this.db) return;

    const conflict: ConflictResolution = {
      id: nanoid(),
      localData: operation.data,
      remoteData,
      strategy: 'last_write_wins', // Default strategy
      resolved: false,
      timestamp: Date.now(),
    };

    await this.db.put('conflicts', conflict, conflict.id);

    this.notifyListeners({
      type: 'conflict_detected',
      localData: conflict.localData,
      remoteData: conflict.remoteData,
      conflict: { id: conflict.id, operation: operation.id }
    });

    // Auto-resolve with last write wins strategy
    await this.resolveConflict(conflict.id, 'last_write_wins');
  }

  public async resolveConflict(conflictId: string, strategy: ConflictResolution['strategy']): Promise<void> {
    if (!this.db) return;

    const conflict = await this.db.get('conflicts', conflictId);
    if (!conflict || conflict.resolved) return;

    let resolvedData;

    switch (strategy) {
      case 'last_write_wins':
        resolvedData = conflict.localData.timestamp > conflict.remoteData.timestamp
          ? conflict.localData
          : conflict.remoteData;
        break;

      case 'merge':
        resolvedData = { ...conflict.remoteData, ...conflict.localData };
        break;

      default:
        // Manual resolution required
        return;
    }

    conflict.resolved = true;
    await this.db.put('conflicts', conflict, conflictId);

    this.notifyListeners({
      type: 'conflict_resolved',
      conflict: { id: conflictId, strategy, data: resolvedData }
    });
  }

  public async getUnresolvedConflicts(): Promise<ConflictResolution[]> {
    if (!this.db) return [];

    try {
      return await this.db.getAllFromIndex('conflicts', 'resolved', false);
    } catch (error) {
      console.error('Failed to get unresolved conflicts:', error);
      return [];
    }
  }

  public async getLastSyncTime(): Promise<number> {
    if (!this.db) return 0;

    try {
      return await this.db.get('metadata', 'lastSync') || 0;
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return 0;
    }
  }

  public isOfflineMode(): boolean {
    return !this.isOnline;
  }

  public isSyncing(): boolean {
    return this.syncInProgress;
  }

  public addListener(callback: (data: any) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(data: any): void {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in offline manager listener:', error);
      }
    });
  }

  public async clearOfflineData(): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction(['data', 'operations', 'conflicts'], 'readwrite');
      await Promise.all([
        tx.objectStore('data').clear(),
        tx.objectStore('operations').clear(),
        tx.objectStore('conflicts').clear(),
      ]);
      await tx.done;

      this.notifyListeners({ type: 'data_cleared' });
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }

  public async getStorageInfo(): Promise<{ used: number; available: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: estimate.quota || 0,
      };
    }
    return { used: 0, available: 0 };
  }
}

export const offlineManager = new OfflineManager();