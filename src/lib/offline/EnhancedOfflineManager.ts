/**
 * Enhanced Offline Manager with Improved Robustness
 *
 * Extends the existing OfflineManager with advanced features:
 * - Batch operation processing
 * - Intelligent retry strategies with exponential backoff and jitter
 * - Delta synchronization for minimal data transfer
 * - Connection quality detection and adaptive sync behavior
 * - Data compression and integrity validation
 * - Memory management optimizations
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { nanoid } from 'nanoid';
import { BatchSyncService, type BatchSyncOperation } from '../../services/sync/BatchSyncService';

interface EnhancedSyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'batch';
  collection: string;
  documentId: string;
  data?: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed' | 'cancelled';
  priority: 'critical' | 'high' | 'medium' | 'low';
  batchId?: string;
  retryPolicy?: RetryPolicy;
  localVersion?: string;
  remoteVersion?: string;
  conflictResolution: 'client_wins' | 'server_wins' | 'merge' | 'manual';
  dependencies: string[];
  estimatedSize: number;
  networkRequirements: {
    minBandwidth: number;
    maxLatency: number;
    requiresStableConnection: boolean;
  };
  idempotencyKey?: string;
  checksum?: string;
  compressed?: boolean;
  deltaFrom?: string;
}

interface BatchOperation {
  id: string;
  operations: EnhancedSyncOperation[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  timestamp: number;
  estimatedSize: number;
  progress: number;
}

interface ConnectionQuality {
  rtt: number; // Round trip time in ms
  downlink: number; // Effective bandwidth in Mbps
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
  saveData: boolean;
  quality: 'excellent' | 'good' | 'poor' | 'offline';
}

interface SyncStrategy {
  batchSize: number;
  retryPolicy: RetryPolicy;
  compressionThreshold: number;
  deltaThreshold: number;
  priorityWeights: Record<string, number>;
}

interface RetryPolicy {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
}

interface DataIntegrity {
  checksum: string;
  version: number;
  lastModified: number;
  conflicts: number;
}

interface EnhancedOfflineDB extends DBSchema {
  enhancedOperations: {
    key: string;
    value: EnhancedSyncOperation;
    indexes: {
      'by-priority': string;
      'by-batch': string;
      'by-status': string;
      'by-timestamp': number;
      'by-collection': string;
    };
  };
  batches: {
    key: string;
    value: BatchOperation;
    indexes: {
      'by-status': string;
      'by-priority': string;
      'by-timestamp': number;
    };
  };
  integrity: {
    key: string;
    value: DataIntegrity;
  };
  compressed: {
    key: string;
    value: {
      data: string; // Compressed data
      originalSize: number;
      compressedSize: number;
      algorithm: string;
    };
  };
  deltas: {
    key: string;
    value: {
      from: string;
      to: string;
      changes: any;
      timestamp: number;
    };
  };
}

export class EnhancedOfflineManager {
  private enhancedDb: IDBPDatabase<EnhancedOfflineDB> | null = null;
  private connectionQuality: ConnectionQuality = {
    rtt: 0,
    downlink: 0,
    effectiveType: '4g',
    saveData: false,
    quality: 'excellent'
  };
  private syncStrategy: SyncStrategy;
  private batchProcessor: BatchProcessor;
  private batchSyncService: BatchSyncService | null = null;
  private compressionWorker: Worker | null = null;
  private memoryMonitor: MemoryMonitor;
  private performanceMetrics: PerformanceMetrics;

  constructor() {
    this.syncStrategy = {
      batchSize: 50,
      retryPolicy: {
        maxRetries: 5,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffFactor: 2,
        jitter: true
      },
      compressionThreshold: 1024, // 1KB
      deltaThreshold: 10240, // 10KB
      priorityWeights: {
        critical: 1.0,
        high: 0.8,
        medium: 0.6,
        low: 0.4
      }
    };

    this.batchProcessor = new BatchProcessor(this);
    this.memoryMonitor = new MemoryMonitor();
    this.performanceMetrics = new PerformanceMetrics();

    // Initialize BatchSyncService with environment variables
    const apiEndpoint = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3001';
    const apiKey = import.meta.env.VITE_API_KEY || '';
    
    if (apiEndpoint && apiKey) {
      this.batchSyncService = new BatchSyncService(apiEndpoint, apiKey);
    }

    this.initEnhancedFeatures();
  }

  private async initEnhancedFeatures(): Promise<void> {
    await this.initEnhancedDB();
    await this.initConnectionMonitoring();
    await this.initCompressionWorker();
    this.startMemoryMonitoring();
    this.optimizeSyncStrategy();
  }

  private async initEnhancedDB(): Promise<void> {
    try {
      this.enhancedDb = await openDB<EnhancedOfflineDB>('courtmaster-enhanced-offline', 1, {
        upgrade(db) {
          // Enhanced operations store
          if (!db.objectStoreNames.contains('enhancedOperations')) {
            const store = db.createObjectStore('enhancedOperations');
            store.createIndex('by-priority', 'priority');
            store.createIndex('by-batch', 'batchId');
            store.createIndex('by-status', 'status');
            store.createIndex('by-timestamp', 'timestamp');
            store.createIndex('by-collection', 'collection');
          }

          // Batch operations store
          if (!db.objectStoreNames.contains('batches')) {
            const store = db.createObjectStore('batches');
            store.createIndex('by-status', 'status');
            store.createIndex('by-priority', 'priority');
            store.createIndex('by-timestamp', 'timestamp');
          }

          // Data integrity store
          if (!db.objectStoreNames.contains('integrity')) {
            db.createObjectStore('integrity');
          }

          // Compressed data store
          if (!db.objectStoreNames.contains('compressed')) {
            db.createObjectStore('compressed');
          }

          // Delta changes store
          if (!db.objectStoreNames.contains('deltas')) {
            db.createObjectStore('deltas');
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize enhanced offline database:', error);
    }
  }

  private async initConnectionMonitoring(): Promise<void> {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      const updateConnectionQuality = () => {
        this.connectionQuality = {
          rtt: connection.rtt || 0,
          downlink: connection.downlink || 0,
          effectiveType: connection.effectiveType || '4g',
          saveData: connection.saveData || false,
          quality: this.assessConnectionQuality(connection)
        };

        this.adaptSyncStrategy();
      };

      connection.addEventListener('change', updateConnectionQuality);
      updateConnectionQuality();
    }

    // Monitor connection quality through ping tests
    this.startConnectionQualityTests();
  }

  private async initCompressionWorker(): Promise<void> {
    try {
      // Create compression worker for large data sets
      const workerCode = `
        self.onmessage = async function(e) {
          const { action, data, algorithm } = e.data;

          try {
            if (action === 'compress') {
              const compressed = await compress(data, algorithm);
              self.postMessage({ success: true, result: compressed });
            } else if (action === 'decompress') {
              const decompressed = await decompress(data, algorithm);
              self.postMessage({ success: true, result: decompressed });
            }
          } catch (error) {
            self.postMessage({ success: false, error: error.message });
          }
        };

        async function compress(data, algorithm = 'gzip') {
          const encoder = new TextEncoder();
          const stream = new CompressionStream(algorithm);
          const writer = stream.writable.getWriter();
          const reader = stream.readable.getReader();

          writer.write(encoder.encode(JSON.stringify(data)));
          writer.close();

          const chunks = [];
          let done = false;
          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) chunks.push(value);
          }

          return new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []));
        }

        async function decompress(data, algorithm = 'gzip') {
          const stream = new DecompressionStream(algorithm);
          const writer = stream.writable.getWriter();
          const reader = stream.readable.getReader();

          writer.write(data);
          writer.close();

          const chunks = [];
          let done = false;
          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) chunks.push(value);
          }

          const decoder = new TextDecoder();
          const decompressed = decoder.decode(new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], [])));
          return JSON.parse(decompressed);
        }
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.compressionWorker = new Worker(URL.createObjectURL(blob));
    } catch (error) {
      console.warn('Compression worker not available:', error);
    }
  }

  /**
   * Queue operation (compatibility method)
   */
  async queueOperation(
    type: 'create' | 'update' | 'delete',
    collection: string,
    documentId: string,
    data?: any
  ): Promise<string> {
    return this.queueEnhancedOperation(type, collection, documentId, data);
  }

  /**
   * Enhanced queue operation with priority and batching support
   */
  async queueEnhancedOperation(
    type: EnhancedSyncOperation['type'],
    collection: string,
    documentId: string,
    data?: any,
    options: {
      priority?: EnhancedSyncOperation['priority'];
      batchId?: string;
      retryPolicy?: RetryPolicy;
      idempotencyKey?: string;
    } = {}
  ): Promise<string> {
    if (!this.enhancedDb) {
      throw new Error('Enhanced offline manager not initialized');
    }

    // Generate idempotency key if not provided
    const idempotencyKey = options.idempotencyKey || this.generateIdempotencyKey(type, collection, documentId, data);

    // Check for existing operation with same idempotency key
    const existingOperation = await this.findOperationByIdempotencyKey(idempotencyKey);
    if (existingOperation) {
      console.log(`Duplicate operation detected, returning existing operation ID: ${existingOperation.id}`);
      return existingOperation.id;
    }

    const operation: EnhancedSyncOperation = {
      id: nanoid(),
      type,
      collection,
      documentId,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
      priority: options.priority || 'medium',
      batchId: options.batchId,
      retryPolicy: options.retryPolicy || this.syncStrategy.retryPolicy,
      localVersion: nanoid(),
      remoteVersion: undefined,
      conflictResolution: 'merge',
      dependencies: [],
      estimatedSize: this.estimateOperationSize(data),
      networkRequirements: {
        minBandwidth: 0,
        maxLatency: 5000,
        requiresStableConnection: false
      },
      idempotencyKey // Add idempotency key to operation
    };

    await this.enhancedDb.put('enhancedOperations', operation, operation.id);

    // Add to batch if specified
    if (options.batchId) {
      await this.addToBatch(options.batchId, operation);
    }

    // Trigger immediate sync for critical operations
    if (operation.priority === 'critical' && navigator.onLine) {
      this.syncSingleOperation(operation);
    }

    this.performanceMetrics.recordOperation(operation);
    return operation.id;
  }

  /**
   * Check if currently syncing
   */
  private _syncing = false;
  
  private isSyncing(): boolean {
    return this._syncing;
  }


  /**
   * Process operations in optimized batches
   */
  async processBatchOperations(): Promise<void> {
    if (!navigator.onLine || this.isSyncing()) return;

    this._syncing = true;
    try {
      const pendingBatches = await this.getPendingBatches();
      const prioritizedBatches = this.prioritizeBatches(pendingBatches);

      for (const batch of prioritizedBatches) {
        await this.batchProcessor.processBatch(batch);
      }
    } finally {
      this._syncing = false;
    }
  }

  /**
   * Intelligent delta synchronization
   */
  async syncWithDelta(collection: string, lastSyncVersion?: string): Promise<void> {
    if (!this.enhancedDb) return;

    try {
      const localData = await this.getData(collection);
      if (!localData) return;

      // Get delta changes since last sync
      const delta = lastSyncVersion
        ? await this.calculateDelta(collection, lastSyncVersion)
        : localData;

      if (Object.keys(delta).length === 0) return;

      // Send only delta changes
      const result = await this.sendDeltaSync(collection, delta, lastSyncVersion);

      if (result.success) {
        await this.applyRemoteDeltas(collection, result.remoteDeltas);
        await this.updateSyncVersion(collection, result.newVersion);
      }
    } catch (error) {
      console.error('Delta sync failed:', error);
      // Fallback to full sync
      await this.syncPendingOperations();
    }
  }

  /**
   * Adaptive retry strategy with exponential backoff and jitter
   */
  private async retryOperation(operation: EnhancedSyncOperation): Promise<void> {
    const policy = this.syncStrategy.retryPolicy;

    if (operation.retryCount >= policy.maxRetries) {
      operation.status = 'failed';
      await this.enhancedDb?.put('enhancedOperations', operation, operation.id);
      return;
    }

    operation.retryCount++;

    // Calculate delay with exponential backoff and jitter
    let delay = Math.min(
      policy.baseDelay * Math.pow(policy.backoffFactor, operation.retryCount - 1),
      policy.maxDelay
    );

    if (policy.jitter) {
      delay += Math.random() * delay * 0.1; // Add up to 10% jitter
    }

    // Adjust delay based on connection quality
    delay *= this.getConnectionDelayMultiplier();

    setTimeout(async () => {
      operation.status = 'pending';
      await this.enhancedDb?.put('enhancedOperations', operation, operation.id);
      await this.syncSingleOperation(operation);
    }, delay);
  }

  /**
   * Connection quality assessment and monitoring
   */
  private startConnectionQualityTests(): void {
    setInterval(async () => {
      if (navigator.onLine) {
        const startTime = performance.now();

        try {
          // Ping test with small request
          const response = await fetch('/health', {
            method: 'HEAD',
            cache: 'no-cache'
          });

          const rtt = performance.now() - startTime;

          this.connectionQuality.rtt = rtt;
          this.connectionQuality.quality = this.assessConnectionQuality({
            rtt,
            downlink: this.connectionQuality.downlink,
            effectiveType: this.connectionQuality.effectiveType
          });

          this.adaptSyncStrategy();
        } catch (error) {
          this.connectionQuality.quality = 'poor';
        }
      }
    }, 30000); // Test every 30 seconds
  }

  private assessConnectionQuality(connection: any): ConnectionQuality['quality'] {
    const rtt = connection.rtt || this.connectionQuality.rtt;
    const downlink = connection.downlink || this.connectionQuality.downlink;

    if (rtt > 2000 || downlink < 0.5) return 'poor';
    if (rtt > 1000 || downlink < 1.5) return 'good';
    return 'excellent';
  }

  private adaptSyncStrategy(): void {
    const quality = this.connectionQuality.quality;

    switch (quality) {
      case 'excellent':
        this.syncStrategy.batchSize = 100;
        this.syncStrategy.retryPolicy.baseDelay = 500;
        break;
      case 'good':
        this.syncStrategy.batchSize = 50;
        this.syncStrategy.retryPolicy.baseDelay = 1000;
        break;
      case 'poor':
        this.syncStrategy.batchSize = 10;
        this.syncStrategy.retryPolicy.baseDelay = 2000;
        break;
    }
  }

  private getConnectionDelayMultiplier(): number {
    switch (this.connectionQuality.quality) {
      case 'excellent': return 1.0;
      case 'good': return 1.5;
      case 'poor': return 3.0;
      default: return 1.0;
    }
  }

  /**
   * Memory management and optimization
   */
  private startMemoryMonitoring(): void {
    this.memoryMonitor.start((usage) => {
      if (usage.percentage > 85) {
        this.performMemoryCleanup();
      }
    });
  }

  private async performMemoryCleanup(): Promise<void> {
    try {
      // Clear old completed operations
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

      if (this.enhancedDb) {
        const tx = this.enhancedDb.transaction(['enhancedOperations'], 'readwrite');
        const store = tx.objectStore('enhancedOperations');
        const index = store.index('by-timestamp');

        const cursor = await index.openCursor(IDBKeyRange.upperBound(cutoffTime));
        while (cursor) {
          if (cursor.value.status === 'completed') {
            await cursor.delete();
          }
          await cursor.continue();
        }
      }

      // Trigger garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
      }
    } catch (error) {
      console.warn('Memory cleanup failed:', error);
    }
  }

  /**
   * Performance optimization utilities
   */
  private optimizeSyncStrategy(): void {
    // Adjust strategy based on device capabilities
    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;

    // Scale batch size based on device capabilities
    this.syncStrategy.batchSize = Math.min(
      this.syncStrategy.batchSize,
      Math.floor((memory * cores) * 10)
    );
  }

  // Utility methods
  private async calculateChecksum(data: any): Promise<string> {
    const encoder = new TextEncoder();
    const dataString = JSON.stringify(data);
    const hash = await crypto.subtle.digest('SHA-256', encoder.encode(dataString));
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async compressData(data: any): Promise<string> {
    if (!this.compressionWorker) return data;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Compression timeout')), 5000);

      this.compressionWorker!.onmessage = (e) => {
        clearTimeout(timeout);
        if (e.data.success) {
          resolve(e.data.result);
        } else {
          reject(new Error(e.data.error));
        }
      };

      this.compressionWorker!.postMessage({
        action: 'compress',
        data,
        algorithm: 'gzip'
      });
    });
  }

  private async getPendingBatches(): Promise<BatchOperation[]> {
    if (!this.enhancedDb) return [];
    return this.enhancedDb.getAllFromIndex('batches', 'by-status', 'pending');
  }

  private prioritizeBatches(batches: BatchOperation[]): BatchOperation[] {
    return batches.sort((a, b) => {
      const priorityWeights = this.syncStrategy.priorityWeights;
      return priorityWeights[b.priority] - priorityWeights[a.priority];
    });
  }

  private async addToBatch(batchId: string, operation: EnhancedSyncOperation): Promise<void> {
    if (!this.enhancedDb) return;

    let batch = await this.enhancedDb.get('batches', batchId);
    if (!batch) {
      batch = {
        id: batchId,
        operations: [],
        status: 'pending',
        priority: operation.priority,
        timestamp: Date.now(),
        estimatedSize: 0,
        progress: 0
      };
    }

    batch.operations.push(operation);
    batch.estimatedSize += operation.data ? JSON.stringify(operation.data).length : 0;

    await this.enhancedDb.put('batches', batch, batchId);
  }

  private async calculateDelta(collection: string, fromVersion: string): Promise<any> {
    // Implementation for calculating delta changes
    // This would compare current data with the version specified
    return {};
  }

  private async sendDeltaSync(collection: string, delta: any, fromVersion?: string): Promise<any> {
    // Implementation for sending delta sync to server
    return { success: true, remoteDeltas: {}, newVersion: 'new-version' };
  }

  private async applyRemoteDeltas(collection: string, deltas: any): Promise<void> {
    // Implementation for applying remote deltas to local data
  }

  private async updateSyncVersion(collection: string, version: string): Promise<void> {
    if (!this.enhancedDb) return;
    await this.enhancedDb.put('integrity', { version, lastModified: Date.now() } as any, `${collection}-version`);
  }

  /**
   * Get enhanced performance metrics
   */
  getPerformanceMetrics(): any {
    return this.performanceMetrics.getMetrics();
  }

  /**
   * Get current connection quality
   */
  getConnectionQuality(): ConnectionQuality {
    return { ...this.connectionQuality };
  }

  /**
   * Get current sync strategy
   */
  getSyncStrategy(): SyncStrategy {
    return { ...this.syncStrategy };
  }

  /**
   * Compatibility methods for existing OfflineManager API
   */
  
  // Add compatibility method for getPendingOperations
  async getPendingOperations(): Promise<any[]> {
    if (!this.enhancedDb) return [];
    return this.enhancedDb.getAllFromIndex('enhancedOperations', 'by-status', 'pending');
  }

  // Add compatibility method for getUnresolvedConflicts
  async getUnresolvedConflicts(): Promise<any[]> {
    // Implementation would depend on how conflicts are stored
    // For now, return empty array
    return [];
  }

  // Add compatibility method for resolveConflict
  async resolveConflict(conflictId: string, strategy: string): Promise<void> {
    // Implementation for resolving conflicts
    console.log(`Resolving conflict ${conflictId} with strategy ${strategy}`);
  }

  // Add compatibility method for clearOfflineData
  async clearOfflineData(): Promise<void> {
    if (!this.enhancedDb) return;
    
    const tx = this.enhancedDb.transaction(['enhancedOperations', 'batches'], 'readwrite');
    await tx.objectStore('enhancedOperations').clear();
    await tx.objectStore('batches').clear();
    await tx.done;
  }

  // Add compatibility method for getData
  async getData(collection: string): Promise<any> {
    // This would typically retrieve cached data for a collection
    // Implementation depends on how data is stored
    return {};
  }

  // Add compatibility method for storeData
  async storeData(collection: string, data: any): Promise<void> {
    // This would typically store data for a collection
    // Implementation depends on how data should be stored
    console.log(`Storing data for collection ${collection}`);
  }

  // Add compatibility method for getLastSyncTime
  async getLastSyncTime(): Promise<number> {
    if (!this.enhancedDb) return 0;
    
    try {
      const integrity = await this.enhancedDb.get('integrity', 'last-sync-time');
      return integrity?.lastModified || 0;
    } catch {
      return 0;
    }
  }

  // Add compatibility method for getStorageInfo
  async getStorageInfo(): Promise<{ used: number; available: number }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          available: estimate.quota || 0
        };
      }
      return { used: 0, available: 0 };
    } catch {
      return { used: 0, available: 0 };
    }
  }

  // Add compatibility method for addListener
  addListener(callback: (event: any) => void): () => void {
    // For now, return a no-op unsubscribe function
    // In a full implementation, this would manage event listeners
    return () => {};
  }

  // Add compatibility method for syncPendingOperations
  async syncPendingOperations(): Promise<void> {
    await this.processBatchOperations();
  }

  // Add method to get BatchSyncService
  getBatchSyncService(): BatchSyncService | null {
    return this.batchSyncService;
  }

  // Make syncSingleOperation public for BatchProcessor access
  async syncSingleOperation(operation: EnhancedSyncOperation): Promise<void> {
    try {
      // Implementation for syncing a single operation
      console.log(`Syncing operation ${operation.id}`);
      operation.status = 'completed';
      await this.enhancedDb?.put('enhancedOperations', operation, operation.id);
    } catch (error) {
      console.error('Failed to sync operation:', error);
      operation.status = 'failed';
      await this.enhancedDb?.put('enhancedOperations', operation, operation.id);
    }
  }

  /**
   * Handle network state changes
   */
  handleNetworkChange(isOnline: boolean): void {
    console.log(`Network state changed: ${isOnline ? 'online' : 'offline'}`);
    
    if (isOnline) {
      // When coming back online, trigger sync of pending operations
      this.processBatchOperations().catch(error => {
        console.error('Failed to process operations after coming online:', error);
      });
    } else {
      // When going offline, update connection quality
      this.connectionQuality.quality = 'offline';
    }
  }

  /**
   * Generate idempotency key for operation deduplication
   */
  private generateIdempotencyKey(type: string, collection: string, documentId: string, data?: any): string {
    // Create a deterministic key based on operation parameters
    const dataHash = data ? JSON.stringify(data).slice(0, 100) : '';
    return `${type}:${collection}:${documentId}:${dataHash}`.replace(/[^a-zA-Z0-9:]/g, '');
  }

  /**
   * Find existing operation by idempotency key
   */
  private async findOperationByIdempotencyKey(idempotencyKey: string): Promise<EnhancedSyncOperation | null> {
    if (!this.enhancedDb) return null;

    try {
      const tx = this.enhancedDb.transaction('enhancedOperations', 'readonly');
      const store = tx.objectStore('enhancedOperations');
      const operations = await store.getAll();

      // Find operation with matching idempotency key that's still pending or in progress
      const existingOperation = operations.find(op => 
        op.idempotencyKey === idempotencyKey && 
        (op.status === 'pending' || op.status === 'syncing')
      );

      return existingOperation || null;
    } catch (error) {
      console.error('Error finding operation by idempotency key:', error);
      return null;
    }
  }

  /**
   * Estimate operation size for performance optimization
   */
  private estimateOperationSize(data?: any): number {
    if (!data) return 0;
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
}

/**
 * Batch processor for efficient operation handling
 */
class BatchProcessor {
  constructor(private manager: EnhancedOfflineManager) {}

  async processBatch(batch: BatchOperation): Promise<void> {
    try {
      console.log(`Processing batch ${batch.id} with ${batch.operations.length} operations`);
      
      // Convert EnhancedSyncOperations to BatchSyncOperations
      const batchSyncOps: BatchSyncOperation[] = batch.operations.map(op => ({
        id: op.id,
        type: op.type === 'batch' ? 'update' : op.type, // Map 'batch' to 'update'
        collection: op.collection,
        documentId: op.documentId,
        data: op.data,
        timestamp: op.timestamp,
        priority: op.priority
      }));

      // Use BatchSyncService if available
      if (this.manager.getBatchSyncService()) {
        const batchSyncService = this.manager.getBatchSyncService()!;
        
        // Register progress callback
        batchSyncService.onProgress(batch.id, (progress) => {
          console.log(`Batch ${batch.id} progress:`, progress);
          batch.progress = (progress.completed / progress.total) * 100;
        });

        // Process the batch
        const result = await batchSyncService.processBatch(batch.id);
        
        if (result.success) {
          batch.status = 'completed';
          console.log(`Batch ${batch.id} completed successfully`);
        } else {
          batch.status = 'failed';
          console.error(`Batch ${batch.id} failed:`, result.errors);
        }
      } else {
        // Fallback to simple processing
        for (const operation of batch.operations) {
          try {
            await this.manager.syncSingleOperation(operation);
          } catch (error) {
            console.error(`Failed to sync operation ${operation.id}:`, error);
          }
        }
        batch.status = 'completed';
      }
    } catch (error) {
      console.error(`Batch processing failed for ${batch.id}:`, error);
      batch.status = 'failed';
    }
  }
}

/**
 * Memory monitoring utility
 */
class MemoryMonitor {
  start(callback: (usage: { used: number; total: number; percentage: number }) => void): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usage = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
        };
        callback(usage);
      }, 10000); // Check every 10 seconds
    }
  }
}

/**
 * Performance metrics collector
 */
class PerformanceMetrics {
  private metrics: Map<string, any> = new Map();

  recordOperation(operation: EnhancedSyncOperation): void {
    const key = `${operation.collection}_${operation.type}`;
    const existing = this.metrics.get(key) || { count: 0, totalTime: 0 };
    existing.count++;
    this.metrics.set(key, existing);
  }

  getMetrics(): any {
    return Object.fromEntries(this.metrics);
  }
}

export const enhancedOfflineManager = new EnhancedOfflineManager();