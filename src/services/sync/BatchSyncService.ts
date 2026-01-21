/**
 * Batch Synchronization Service
 *
 * Provides efficient batch operations for offline data synchronization
 * with conflict resolution, progress tracking, and integration with existing services.
 */

import { nanoid } from 'nanoid';

interface BatchSyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  data?: any;
  timestamp: number;
  localVersion?: string;
  remoteVersion?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface BatchSyncRequest {
  id: string;
  operations: BatchSyncOperation[];
  options: BatchSyncOptions;
  timestamp: number;
  retryCount: number;
}

interface BatchSyncOptions {
  maxBatchSize: number;
  timeout: number;
  conflictResolution: 'client_wins' | 'server_wins' | 'merge' | 'manual';
  enableCompression: boolean;
  enableDelta: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface BatchSyncResult {
  batchId: string;
  success: boolean;
  processedCount: number;
  failedCount: number;
  conflicts: ConflictInfo[];
  errors: BatchError[];
  syncToken?: string;
  metrics: SyncMetrics;
}

interface ConflictInfo {
  operationId: string;
  collection: string;
  documentId: string;
  localData: any;
  remoteData: any;
  conflictType: 'version' | 'content' | 'delete';
  resolution?: 'client' | 'server' | 'merged' | 'pending';
  resolvedData?: any;
}

interface BatchError {
  operationId: string;
  collection: string;
  documentId: string;
  error: string;
  retryable: boolean;
  timestamp: number;
}

interface SyncMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  bytesTransferred: number;
  compressionRatio?: number;
  networkTime: number;
  processingTime: number;
  conflictResolutionTime: number;
}

interface SyncProgress {
  batchId: string;
  total: number;
  completed: number;
  failed: number;
  currentOperation?: string;
  estimatedTimeRemaining: number;
  bytesTransferred: number;
  stage: 'preparing' | 'uploading' | 'processing' | 'resolving' | 'completed' | 'failed';
}

interface RetryStrategy {
  maxRetries: number;
  baseDelay: number;
  backoffFactor: number;
  jitter: boolean;
}

export class BatchSyncService {
  private activeBatches = new Map<string, BatchSyncRequest>();
  private progressCallbacks = new Map<string, (progress: SyncProgress) => void>();
  private conflictResolvers = new Map<string, (conflict: ConflictInfo) => Promise<ConflictInfo>>();

  private readonly defaultOptions: BatchSyncOptions = {
    maxBatchSize: 100,
    timeout: 30000,
    conflictResolution: 'merge',
    enableCompression: true,
    enableDelta: true,
    priority: 'medium'
  };

  private readonly retryStrategy: RetryStrategy = {
    maxRetries: 3,
    baseDelay: 1000,
    backoffFactor: 2,
    jitter: true
  };

  constructor(
    private apiEndpoint: string,
    private apiKey: string
  ) {}

  /**
   * Queue operations for batch synchronization
   */
  async queueBatchSync(
    operations: BatchSyncOperation[],
    options: Partial<BatchSyncOptions> = {}
  ): Promise<string> {
    const batchId = nanoid();
    const mergedOptions = { ...this.defaultOptions, ...options };

    // Split operations into chunks based on batch size
    const chunks = this.chunkOperations(operations, mergedOptions.maxBatchSize);

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = chunks.length > 1 ? `${batchId}-${i}` : batchId;
      const request: BatchSyncRequest = {
        id: chunkId,
        operations: chunks[i],
        options: mergedOptions,
        timestamp: Date.now(),
        retryCount: 0
      };

      this.activeBatches.set(chunkId, request);
    }

    // Start processing immediately if online
    if (navigator.onLine) {
      this.processBatch(batchId);
    }

    return batchId;
  }

  /**
   * Process a batch of operations
   */
  async processBatch(batchId: string): Promise<BatchSyncResult> {
    const request = this.activeBatches.get(batchId);
    if (!request) {
      throw new Error(`Batch ${batchId} not found`);
    }

    const startTime = performance.now();
    this.updateProgress(batchId, {
      batchId,
      total: request.operations.length,
      completed: 0,
      failed: 0,
      estimatedTimeRemaining: 0,
      bytesTransferred: 0,
      stage: 'preparing'
    });

    try {
      // Prepare operations
      const preparedOps = await this.prepareOperations(request.operations, request.options);

      this.updateProgress(batchId, {
        batchId,
        total: request.operations.length,
        completed: 0,
        failed: 0,
        estimatedTimeRemaining: this.estimateRemainingTime(request.operations.length),
        bytesTransferred: 0,
        stage: 'uploading'
      });

      // Send batch to server
      const response = await this.sendBatchRequest(batchId, preparedOps, request.options);

      this.updateProgress(batchId, {
        batchId,
        total: request.operations.length,
        completed: 0,
        failed: 0,
        estimatedTimeRemaining: this.estimateRemainingTime(request.operations.length),
        bytesTransferred: response.bytesTransferred,
        stage: 'processing'
      });

      // Process response and handle conflicts
      const result = await this.processResponse(batchId, response, request.options);

      if (result.conflicts.length > 0) {
        this.updateProgress(batchId, {
          batchId,
          total: request.operations.length,
          completed: result.processedCount,
          failed: result.failedCount,
          estimatedTimeRemaining: this.estimateConflictResolutionTime(result.conflicts.length),
          bytesTransferred: response.bytesTransferred,
          stage: 'resolving'
        });

        // Resolve conflicts
        await this.resolveConflicts(batchId, result.conflicts, request.options);
      }

      const endTime = performance.now();
      result.metrics.endTime = endTime;
      result.metrics.duration = endTime - startTime;

      this.updateProgress(batchId, {
        batchId,
        total: request.operations.length,
        completed: result.processedCount,
        failed: result.failedCount,
        estimatedTimeRemaining: 0,
        bytesTransferred: response.bytesTransferred,
        stage: 'completed'
      });

      // Clean up
      this.activeBatches.delete(batchId);
      this.progressCallbacks.delete(batchId);

      return result;

    } catch (error) {
      console.error(`Batch sync failed for ${batchId}:`, error);

      // Handle retry logic
      if (request.retryCount < this.retryStrategy.maxRetries) {
        await this.scheduleRetry(request);
        throw error;
      }

      const failedResult: BatchSyncResult = {
        batchId,
        success: false,
        processedCount: 0,
        failedCount: request.operations.length,
        conflicts: [],
        errors: [{
          operationId: 'batch',
          collection: 'batch',
          documentId: batchId,
          error: error.message,
          retryable: false,
          timestamp: Date.now()
        }],
        metrics: {
          startTime,
          endTime: performance.now(),
          duration: performance.now() - startTime,
          bytesTransferred: 0,
          networkTime: 0,
          processingTime: 0,
          conflictResolutionTime: 0
        }
      };

      this.updateProgress(batchId, {
        batchId,
        total: request.operations.length,
        completed: 0,
        failed: request.operations.length,
        estimatedTimeRemaining: 0,
        bytesTransferred: 0,
        stage: 'failed'
      });

      this.activeBatches.delete(batchId);
      this.progressCallbacks.delete(batchId);

      return failedResult;
    }
  }

  /**
   * Register progress callback for a batch
   */
  onProgress(batchId: string, callback: (progress: SyncProgress) => void): void {
    this.progressCallbacks.set(batchId, callback);
  }

  /**
   * Register conflict resolver for a collection
   */
  registerConflictResolver(
    collection: string,
    resolver: (conflict: ConflictInfo) => Promise<ConflictInfo>
  ): void {
    this.conflictResolvers.set(collection, resolver);
  }

  /**
   * Get current sync status for all batches
   */
  getAllBatchStatuses(): Array<{ batchId: string; stage: string; progress: number }> {
    return Array.from(this.activeBatches.keys()).map(batchId => {
      const request = this.activeBatches.get(batchId)!;
      return {
        batchId,
        stage: 'pending', // This would be dynamically determined
        progress: 0
      };
    });
  }

  /**
   * Cancel a batch operation
   */
  async cancelBatch(batchId: string): Promise<boolean> {
    const request = this.activeBatches.get(batchId);
    if (!request) return false;

    // Send cancellation request to server if batch is in progress
    try {
      await fetch(`${this.apiEndpoint}/sync/batch/${batchId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.warn(`Failed to cancel batch ${batchId} on server:`, error);
    }

    this.activeBatches.delete(batchId);
    this.progressCallbacks.delete(batchId);

    return true;
  }

  // Private helper methods

  private chunkOperations(operations: BatchSyncOperation[], chunkSize: number): BatchSyncOperation[][] {
    const chunks: BatchSyncOperation[][] = [];

    // Sort operations by priority and timestamp
    const sortedOps = [...operations].sort((a, b) => {
      const priorityWeights = { critical: 4, high: 3, medium: 2, low: 1 };
      if (priorityWeights[a.priority] !== priorityWeights[b.priority]) {
        return priorityWeights[b.priority] - priorityWeights[a.priority];
      }
      return a.timestamp - b.timestamp;
    });

    for (let i = 0; i < sortedOps.length; i += chunkSize) {
      chunks.push(sortedOps.slice(i, i + chunkSize));
    }

    return chunks;
  }

  private async prepareOperations(
    operations: BatchSyncOperation[],
    options: BatchSyncOptions
  ): Promise<any> {
    const prepared = {
      operations: operations,
      options: {
        compression: options.enableCompression,
        delta: options.enableDelta,
        conflictResolution: options.conflictResolution
      },
      metadata: {
        clientId: this.getClientId(),
        timestamp: Date.now(),
        version: '1.0'
      }
    };

    // Apply compression if enabled
    if (options.enableCompression) {
      return this.compressPayload(prepared);
    }

    return prepared;
  }

  private async sendBatchRequest(
    batchId: string,
    payload: any,
    options: BatchSyncOptions
  ): Promise<any> {
    const networkStartTime = performance.now();

    const response = await fetch(`${this.apiEndpoint}/sync/batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-Batch-ID': batchId,
        'X-Batch-Options': JSON.stringify({
          timeout: options.timeout,
          priority: options.priority
        })
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(options.timeout)
    });

    const networkTime = performance.now() - networkStartTime;

    if (!response.ok) {
      throw new Error(`Batch sync request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    result.networkTime = networkTime;
    result.bytesTransferred = JSON.stringify(payload).length;

    return result;
  }

  private async processResponse(
    batchId: string,
    response: any,
    options: BatchSyncOptions
  ): Promise<BatchSyncResult> {
    const processingStartTime = performance.now();

    const result: BatchSyncResult = {
      batchId,
      success: response.success || false,
      processedCount: response.processed?.length || 0,
      failedCount: response.failed?.length || 0,
      conflicts: this.parseConflicts(response.conflicts || []),
      errors: this.parseErrors(response.errors || []),
      syncToken: response.syncToken,
      metrics: {
        startTime: response.startTime || Date.now(),
        endTime: 0, // Will be set later
        duration: 0, // Will be calculated later
        bytesTransferred: response.bytesTransferred || 0,
        networkTime: response.networkTime || 0,
        processingTime: 0, // Will be calculated
        conflictResolutionTime: 0
      }
    };

    result.metrics.processingTime = performance.now() - processingStartTime;

    return result;
  }

  private parseConflicts(conflictsData: any[]): ConflictInfo[] {
    return conflictsData.map(conflict => ({
      operationId: conflict.operationId,
      collection: conflict.collection,
      documentId: conflict.documentId,
      localData: conflict.localData,
      remoteData: conflict.remoteData,
      conflictType: conflict.type,
      resolution: undefined,
      resolvedData: undefined
    }));
  }

  private parseErrors(errorsData: any[]): BatchError[] {
    return errorsData.map(error => ({
      operationId: error.operationId,
      collection: error.collection,
      documentId: error.documentId,
      error: error.message,
      retryable: error.retryable || false,
      timestamp: error.timestamp || Date.now()
    }));
  }

  private async resolveConflicts(
    batchId: string,
    conflicts: ConflictInfo[],
    options: BatchSyncOptions
  ): Promise<void> {
    const conflictStartTime = performance.now();

    for (const conflict of conflicts) {
      try {
        const resolver = this.conflictResolvers.get(conflict.collection);

        if (resolver) {
          // Use custom conflict resolver
          const resolved = await resolver(conflict);
          conflict.resolution = resolved.resolution;
          conflict.resolvedData = resolved.resolvedData;
        } else {
          // Use default resolution strategy
          conflict.resolvedData = this.applyDefaultResolution(conflict, options.conflictResolution);
          conflict.resolution = this.getResolutionType(options.conflictResolution);
        }

        // Apply resolved changes locally
        await this.applyConflictResolution(conflict);

      } catch (error) {
        console.error(`Failed to resolve conflict for ${conflict.operationId}:`, error);
        conflict.resolution = 'pending';
      }
    }

    const conflictResolutionTime = performance.now() - conflictStartTime;
    // Update metrics (would be passed back to calling function)
  }

  private applyDefaultResolution(conflict: ConflictInfo, strategy: string): any {
    switch (strategy) {
      case 'client_wins':
        return conflict.localData;
      case 'server_wins':
        return conflict.remoteData;
      case 'merge':
        return this.mergeData(conflict.localData, conflict.remoteData);
      default:
        return conflict.remoteData; // Default to server wins
    }
  }

  private mergeData(localData: any, remoteData: any): any {
    // Intelligent merge strategy - prefer newer timestamps for conflicts
    const merged = { ...remoteData };

    if (localData && remoteData) {
      Object.keys(localData).forEach(key => {
        if (key === 'updatedAt' || key === 'timestamp') {
          // Use the more recent timestamp
          merged[key] = Math.max(
            new Date(localData[key]).getTime(),
            new Date(remoteData[key]).getTime()
          );
        } else if (localData[key] !== undefined && remoteData[key] === undefined) {
          // Keep local data if remote doesn't have it
          merged[key] = localData[key];
        }
        // For conflicts, prefer remote data (server wins for field-level conflicts)
      });
    }

    return merged;
  }

  private getResolutionType(strategy: string): ConflictInfo['resolution'] {
    switch (strategy) {
      case 'client_wins': return 'client';
      case 'server_wins': return 'server';
      case 'merge': return 'merged';
      default: return 'server';
    }
  }

  private async applyConflictResolution(conflict: ConflictInfo): Promise<void> {
    // Apply the resolved data to local storage
    // This would integrate with the existing storage services
    console.log(`Applying conflict resolution for ${conflict.collection}:${conflict.documentId}`);
  }

  private async scheduleRetry(request: BatchSyncRequest): Promise<void> {
    request.retryCount++;

    let delay = this.retryStrategy.baseDelay * Math.pow(this.retryStrategy.backoffFactor, request.retryCount - 1);

    if (this.retryStrategy.jitter) {
      delay += Math.random() * delay * 0.1;
    }

    setTimeout(() => {
      this.processBatch(request.id);
    }, delay);
  }

  private updateProgress(batchId: string, progress: SyncProgress): void {
    const callback = this.progressCallbacks.get(batchId);
    if (callback) {
      callback(progress);
    }
  }

  private estimateRemainingTime(operationsCount: number): number {
    // Rough estimation based on average operation time
    const avgTimePerOperation = 50; // milliseconds
    return operationsCount * avgTimePerOperation;
  }

  private estimateConflictResolutionTime(conflictsCount: number): number {
    const avgTimePerConflict = 200; // milliseconds
    return conflictsCount * avgTimePerConflict;
  }

  private async compressPayload(payload: any): Promise<string> {
    // Simple compression using built-in compression stream
    const jsonString = JSON.stringify(payload);

    if (typeof CompressionStream !== 'undefined') {
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(new TextEncoder().encode(jsonString));
      writer.close();

      const chunks: Uint8Array[] = [];
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }

      return btoa(String.fromCharCode(...new Uint8Array(chunks.flat())));
    }

    return jsonString; // Fallback to uncompressed
  }

  private getClientId(): string {
    // Generate or retrieve persistent client ID
    let clientId = localStorage.getItem('courtmaster-client-id');
    if (!clientId) {
      clientId = nanoid();
      localStorage.setItem('courtmaster-client-id', clientId);
    }
    return clientId;
  }

  /**
   * Integration methods for existing services
   */

  /**
   * Create batch sync operations from tournament service calls
   */
  static createTournamentOperations(
    tournaments: any[],
    type: 'create' | 'update' | 'delete'
  ): BatchSyncOperation[] {
    return tournaments.map(tournament => ({
      id: nanoid(),
      type,
      collection: 'tournaments',
      documentId: tournament.$id || tournament.id,
      data: tournament,
      timestamp: Date.now(),
      priority: 'high' as const
    }));
  }

  /**
   * Create batch sync operations from match service calls
   */
  static createMatchOperations(
    matches: any[],
    type: 'create' | 'update' | 'delete'
  ): BatchSyncOperation[] {
    return matches.map(match => ({
      id: nanoid(),
      type,
      collection: 'matches',
      documentId: match.$id || match.id,
      data: match,
      timestamp: Date.now(),
      priority: type === 'update' ? 'critical' : 'high' as const
    }));
  }

  /**
   * Create batch sync operations from registration service calls
   */
  static createRegistrationOperations(
    registrations: any[],
    type: 'create' | 'update' | 'delete'
  ): BatchSyncOperation[] {
    return registrations.map(registration => ({
      id: nanoid(),
      type,
      collection: 'registrations',
      documentId: registration.$id || registration.id,
      data: registration,
      timestamp: Date.now(),
      priority: 'medium' as const
    }));
  }
}

export type {
  BatchSyncOperation,
  BatchSyncOptions,
  BatchSyncResult,
  SyncProgress,
  ConflictInfo
};