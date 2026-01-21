/**
 * Offline Queue System for CourtMaster Tournament Management System
 * 
 * Provides offline support using IndexedDB to queue actions when the app
 * is offline and replay them when connectivity is restored.
 * Includes conflict resolution mechanisms for concurrent edits.
 */

// Action types that can be stored for offline processing
export enum OfflineActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  SCORE = 'score',
  CHECK_IN = 'check_in',
  REGISTRATION = 'registration'
}

// Status of a queued action
export enum QueuedActionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CONFLICT = 'conflict'
}

// Represents a queued action
export interface QueuedAction {
  id: string;
  type: OfflineActionType;
  collectionId: string;
  documentId?: string;
  data: any;
  timestamp: number;
  status: QueuedActionStatus;
  retryCount: number;
  errorMessage?: string;
  entityType: string;
  priority: number;
}

// Configuration options for the offline queue
export interface OfflineQueueConfig {
  dbName: string;
  dbVersion: number;
  queueStoreName: string;
  maxRetryCount: number;
  syncIntervalMs: number;
  conflictResolutionStrategy: 'client-wins' | 'server-wins' | 'manual';
}

// Default configuration
const DEFAULT_CONFIG: OfflineQueueConfig = {
  dbName: 'courtmaster_offline',
  dbVersion: 1,
  queueStoreName: 'actions_queue',
  maxRetryCount: 3,
  syncIntervalMs: 5000,
  conflictResolutionStrategy: 'client-wins'
};

/**
 * Manages offline operations using IndexedDB
 */
class OfflineQueue {
  private db: IDBDatabase | null = null;
  private isOnline: boolean = navigator.onLine;
  private config: OfflineQueueConfig;
  private syncInterval: number | null = null;
  private initPromise: Promise<boolean>;
  private initResolver!: (value: boolean) => void;
  
  constructor(config?: Partial<OfflineQueueConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...(config || {}) };
    
    // Create a promise that will resolve when initialization is complete
    this.initPromise = new Promise((resolve) => {
      this.initResolver = resolve;
    });
    
    // Set up event listeners for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Initialize the database
    this.initDatabase();
  }
  
  /**
   * Initialize the IndexedDB database
   */
  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.dbVersion);
      
      request.onerror = (event) => {
        console.error('Failed to open offline database:', event);
        this.initResolver(false);
        reject(new Error('Failed to open offline database'));
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('Offline database opened successfully');
        this.initResolver(true);
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create the actions queue object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.config.queueStoreName)) {
          const store = db.createObjectStore(this.config.queueStoreName, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('collectionId', 'collectionId', { unique: false });
          store.createIndex('entityType', 'entityType', { unique: false });
          console.log('Created actions queue object store');
        }
      };
    });
  }
  
  /**
   * Wait for initialization to complete
   */
  async waitForInit(): Promise<boolean> {
    return this.initPromise;
  }
  
  /**
   * Handle going online
   */
  private handleOnline(): void {
    console.log('App is online, starting sync');
    this.isOnline = true;
    this.startSync();
  }
  
  /**
   * Handle going offline
   */
  private handleOffline(): void {
    console.log('App is offline, pausing sync');
    this.isOnline = false;
    this.stopSync();
  }
  
  /**
   * Start the sync interval
   */
  private startSync(): void {
    if (this.syncInterval === null) {
      this.syncInterval = window.setInterval(
        this.processPendingActions.bind(this),
        this.config.syncIntervalMs
      );
      // Also trigger an immediate sync
      this.processPendingActions();
    }
  }
  
  /**
   * Stop the sync interval
   */
  private stopSync(): void {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  
  /**
   * Process all pending actions in the queue
   */
  async processPendingActions(): Promise<void> {
    if (!this.isOnline || !this.db) {
      return;
    }
    
    try {
      const pendingActions = await this.getPendingActions();
      
      if (pendingActions.length === 0) {
        return;
      }
      
      console.log(`Processing ${pendingActions.length} pending actions`);
      
      // Sort actions by priority and timestamp
      const sortedActions = pendingActions.sort((a, b) => {
        // First by priority (higher number = higher priority)
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        // Then by timestamp (older first)
        return a.timestamp - b.timestamp;
      });
      
      for (const action of sortedActions) {
        await this.processAction(action);
      }
    } catch (error) {
      console.error('Error processing pending actions:', error);
    }
  }
  
  /**
   * Process a single action
   */
  private async processAction(action: QueuedAction): Promise<void> {
    if (!this.isOnline) {
      return;
    }
    
    try {
      // Update action status to processing
      await this.updateActionStatus(action.id, QueuedActionStatus.PROCESSING);
      
      // Process the action based on its type
      let result;
      switch (action.type) {
        case OfflineActionType.CREATE:
          result = await this.processCreateAction(action);
          break;
        case OfflineActionType.UPDATE:
          result = await this.processUpdateAction(action);
          break;
        case OfflineActionType.DELETE:
          result = await this.processDeleteAction(action);
          break;
        case OfflineActionType.SCORE:
          result = await this.processScoreAction(action);
          break;
        case OfflineActionType.CHECK_IN:
          result = await this.processCheckInAction(action);
          break;
        case OfflineActionType.REGISTRATION:
          result = await this.processRegistrationAction(action);
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
      
      // Mark the action as completed
      await this.updateActionStatus(action.id, QueuedActionStatus.COMPLETED);
      console.log(`Action ${action.id} completed:`, result);
    } catch (error) {
      console.error(`Error processing action ${action.id}:`, error);
      
      // Check if it's a conflict error
      if (error && typeof error === 'object' && 'code' in error && error.code === 409) {
        await this.handleConflict(action);
      } else {
        // Increment retry count and update status
        const updatedAction = {
          ...action,
          retryCount: action.retryCount + 1,
          status: action.retryCount >= this.config.maxRetryCount - 1 
            ? QueuedActionStatus.FAILED 
            : QueuedActionStatus.PENDING,
          errorMessage: error instanceof Error ? error.message : String(error)
        };
        
        await this.updateAction(updatedAction);
      }
    }
  }
  
  /**
   * Handle a conflict when processing an action
   */
  private async handleConflict(action: QueuedAction): Promise<void> {
    console.log(`Conflict detected for action ${action.id}`);
    
    switch (this.config.conflictResolutionStrategy) {
      case 'client-wins':
        // Retry with force update
        action.data._conflictResolution = 'client-wins';
        await this.updateAction({
          ...action,
          status: QueuedActionStatus.PENDING
        });
        break;
      case 'server-wins':
        // Mark as completed (i.e., discard local changes)
        await this.updateActionStatus(action.id, QueuedActionStatus.COMPLETED);
        break;
      case 'manual':
        // Mark as conflict for manual resolution
        await this.updateActionStatus(action.id, QueuedActionStatus.CONFLICT);
        break;
    }
  }
  
  /**
   * Process a create action
   */
  private async processCreateAction(action: QueuedAction): Promise<any> {
    const workerUrl = import.meta.env.VITE_WORKER_URL || 'http://localhost:3001';
    const response = await fetch(`${workerUrl}/sync/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'create',
        collection: action.collectionId,
        documentId: action.documentId,
        data: action.data
      })
    });

    if (!response.ok) {
      throw new Error(`Worker queue failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Process an update action
   */
  private async processUpdateAction(action: QueuedAction): Promise<any> {
    const workerUrl = import.meta.env.VITE_WORKER_URL || 'http://localhost:3001';
    const response = await fetch(`${workerUrl}/sync/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'update',
        collection: action.collectionId,
        documentId: action.documentId,
        data: action.data
      })
    });

    if (!response.ok) {
      throw new Error(`Worker queue failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Process a delete action
   */
  private async processDeleteAction(action: QueuedAction): Promise<any> {
    const workerUrl = import.meta.env.VITE_WORKER_URL || 'http://localhost:3001';
    const response = await fetch(`${workerUrl}/sync/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'delete',
        collection: action.collectionId,
        documentId: action.documentId
      })
    });

    if (!response.ok) {
      throw new Error(`Worker queue failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Process a score update action
   */
  private async processScoreAction(action: QueuedAction): Promise<any> {
    const workerUrl = import.meta.env.VITE_WORKER_URL || 'http://localhost:3001';
    const response = await fetch(`${workerUrl}/sync/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'update',
        collection: action.collectionId,
        documentId: action.documentId,
        data: action.data
      })
    });

    if (!response.ok) {
      throw new Error(`Worker queue failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Process a check-in action
   */
  private async processCheckInAction(action: QueuedAction): Promise<any> {
    const workerUrl = import.meta.env.VITE_WORKER_URL || 'http://localhost:3001';
    const response = await fetch(`${workerUrl}/sync/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'update',
        collection: action.collectionId,
        documentId: action.documentId,
        data: action.data
      })
    });

    if (!response.ok) {
      throw new Error(`Worker queue failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Process a registration action
   */
  private async processRegistrationAction(action: QueuedAction): Promise<any> {
    const workerUrl = import.meta.env.VITE_WORKER_URL || 'http://localhost:3001';
    const response = await fetch(`${workerUrl}/sync/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: action.type === OfflineActionType.CREATE ? 'create' : 'update',
        collection: action.collectionId,
        documentId: action.documentId,
        data: action.data
      })
    });

    if (!response.ok) {
      throw new Error(`Worker queue failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
  
  /**
   * Queue an action to be processed when online
   */
  async queueAction(
    type: OfflineActionType,
    collectionId: string,
    data: any,
    options: {
      documentId?: string;
      entityType: string;
      priority?: number;
    }
  ): Promise<string> {
    await this.waitForInit();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const action: QueuedAction = {
      id,
      type,
      collectionId,
      documentId: options.documentId,
      data,
      timestamp: Date.now(),
      status: QueuedActionStatus.PENDING,
      retryCount: 0,
      entityType: options.entityType,
      priority: options.priority || 1
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.config.queueStoreName, 'readwrite');
      const store = transaction.objectStore(this.config.queueStoreName);
      const request = store.add(action);
      
      request.onsuccess = () => {
        console.log(`Action ${id} queued for offline processing`);
        
        // If we're online, start processing right away
        if (this.isOnline) {
          this.processPendingActions();
        }
        
        resolve(id);
      };
      
      request.onerror = (event) => {
        console.error('Error queueing action:', event);
        reject(new Error('Failed to queue action'));
      };
    });
  }
  
  /**
   * Get all pending actions from the queue
   */
  async getPendingActions(): Promise<QueuedAction[]> {
    await this.waitForInit();
    
    if (!this.db) {
      return [];
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.config.queueStoreName, 'readonly');
      const store = transaction.objectStore(this.config.queueStoreName);
      const index = store.index('status');
      const request = index.getAll(QueuedActionStatus.PENDING);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error('Error getting pending actions:', event);
        reject(new Error('Failed to get pending actions'));
      };
    });
  }
  
  /**
   * Get all actions with a specific status
   */
  async getActionsByStatus(status: QueuedActionStatus): Promise<QueuedAction[]> {
    await this.waitForInit();
    
    if (!this.db) {
      return [];
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.config.queueStoreName, 'readonly');
      const store = transaction.objectStore(this.config.queueStoreName);
      const index = store.index('status');
      const request = index.getAll(status);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error(`Error getting actions with status ${status}:`, event);
        reject(new Error(`Failed to get actions with status ${status}`));
      };
    });
  }
  
  /**
   * Update the status of an action
   */
  private async updateActionStatus(id: string, status: QueuedActionStatus): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.config.queueStoreName, 'readwrite');
      const store = transaction.objectStore(this.config.queueStoreName);
      const request = store.get(id);
      
      request.onsuccess = () => {
        const action = request.result;
        if (!action) {
          reject(new Error(`Action with ID ${id} not found`));
          return;
        }
        
        action.status = status;
        const updateRequest = store.put(action);
        
        updateRequest.onsuccess = () => {
          resolve();
        };
        
        updateRequest.onerror = (event) => {
          console.error(`Error updating action ${id} status:`, event);
          reject(new Error(`Failed to update action ${id} status`));
        };
      };
      
      request.onerror = (event) => {
        console.error(`Error getting action ${id}:`, event);
        reject(new Error(`Failed to get action ${id}`));
      };
    });
  }
  
  /**
   * Update an action in the queue
   */
  private async updateAction(action: QueuedAction): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.config.queueStoreName, 'readwrite');
      const store = transaction.objectStore(this.config.queueStoreName);
      const request = store.put(action);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error(`Error updating action ${action.id}:`, event);
        reject(new Error(`Failed to update action ${action.id}`));
      };
    });
  }
  
  /**
   * Delete an action from the queue
   */
  async deleteAction(id: string): Promise<void> {
    await this.waitForInit();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.config.queueStoreName, 'readwrite');
      const store = transaction.objectStore(this.config.queueStoreName);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error(`Error deleting action ${id}:`, event);
        reject(new Error(`Failed to delete action ${id}`));
      };
    });
  }
  
  /**
   * Clear all actions from the queue
   */
  async clearQueue(): Promise<void> {
    await this.waitForInit();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.config.queueStoreName, 'readwrite');
      const store = transaction.objectStore(this.config.queueStoreName);
      const request = store.clear();
      
      request.onsuccess = () => {
        console.log('Queue cleared');
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Error clearing queue:', event);
        reject(new Error('Failed to clear queue'));
      };
    });
  }
  
  /**
   * Get the current online status
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

export default new OfflineQueue();
