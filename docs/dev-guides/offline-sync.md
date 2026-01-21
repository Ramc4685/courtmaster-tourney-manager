# Offline Synchronization Developer Guide

## Overview

This guide covers the offline synchronization system in CourtMaster, including conflict resolution strategies, data versioning, and implementation patterns for reliable offline operation.

## Architecture

### Offline Sync Components

| Operation Queue | Conflict Resolution | Sync Engine |
| ---------------- | ------------------- | ----------- |
| - Store operations<br>- Retry logic<br>- Persistence | - Detect conflicts<br>- Select strategies<br>- Capture user input | - Reconcile updates<br>- Merge records<br>- Validate results |


## Core Interfaces

### Versioning System

```ts
interface EntityVersion {
  id: string;
  version: number;
  timestamp: string; // ISO 8601 UTC
  checksum: string;
  lastModifiedBy: string;
  conflicts?: ConflictMarker[];
}

interface ConflictMarker {
  field: string;
  localValue: any;
  remoteValue: any;
  timestamp: string;
  strategy?: ConflictStrategy;
}

interface VersionedEntity<T = any> {
  data: T;
  version: EntityVersion;
  operations: Operation[];
}

enum ConflictStrategy {
  LOCAL_WINS = 'local_wins',
  REMOTE_WINS = 'remote_wins',
  LATEST_TIMESTAMP = 'latest_timestamp',
  MERGE = 'merge',
  MANUAL = 'manual'
}
```

### Operation Queue

```ts
interface Operation {
  id: string;
  type: OperationType;
  entityType: string;
  entityId: string;
  data: any;
  timestamp: string; // ISO 8601 UTC
  version: number;
  dependencies: string[]; // Operation IDs this depends on
  retryCount: number;
  maxRetries: number;
  status: OperationStatus;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  SCORE_UPDATE = 'score_update',
  STATUS_CHANGE = 'status_change'
}

enum OperationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CONFLICT = 'conflict'
}

interface OperationQueue {
  add(operation: Operation): Promise<void>;
  remove(operationId: string): Promise<void>;
  getNext(): Promise<Operation | null>;
  getDependents(operationId: string): Promise<Operation[]>;
  markCompleted(operationId: string): Promise<void>;
  markFailed(operationId: string, error: string): Promise<void>;
  clear(): Promise<void>;
}
```

## Offline Sync Implementation

### Main Sync Service

```ts
class OfflineSyncService {
  private operationQueue: OperationQueue;
  private conflictResolver: ConflictResolver;
  private syncEngine: SyncEngine;
  private isOnline = false;

  constructor() {
    this.operationQueue = new IndexedDBOperationQueue();
    this.conflictResolver = new ConflictResolver();
    this.syncEngine = new SyncEngine();
    this.setupNetworkMonitoring();
  }

  // Queue operations while offline
  async queueOperation(operation: Omit<Operation, 'id' | 'timestamp'>): Promise<string> {
    const fullOperation: Operation = {
      ...operation,
      id: generateUniqueId(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3,
      status: OperationStatus.PENDING
    };

    await this.operationQueue.add(fullOperation);

    // Try immediate sync if online
    if (this.isOnline) {
      this.processPendingOperations();
    }

    return fullOperation.id;
  }

  // Process queued operations when coming back online
  async processPendingOperations(): Promise<SyncResult> {
    const results: OperationResult[] = [];
    let operation: Operation | null;

    while ((operation = await this.operationQueue.getNext()) !== null) {
      try {
        const result = await this.processOperation(operation);
        results.push(result);

        if (result.success) {
          await this.operationQueue.markCompleted(operation.id);
        } else if (result.conflict) {
          await this.handleConflict(operation, result.conflict);
        } else {
          await this.handleOperationFailure(operation, result.error);
        }
      } catch (error) {
        await this.handleOperationFailure(operation, error as Error);
      }
    }

    return {
      processedOperations: results.length,
      successfulOperations: results.filter(r => r.success).length,
      conflicts: results.filter(r => r.conflict).length,
      failures: results.filter(r => !r.success && !r.conflict).length
    };
  }

  private async processOperation(operation: Operation): Promise<OperationResult> {
    // Get current server state
    const serverEntity = await this.fetchServerEntity(
      operation.entityType,
      operation.entityId
    );

    // Check for conflicts
    const conflict = this.detectConflict(operation, serverEntity);
    if (conflict) {
      return {
        success: false,
        conflict,
        operationId: operation.id
      };
    }

    // Apply operation to server
    try {
      const result = await this.applyOperationToServer(operation);
      return {
        success: true,
        result,
        operationId: operation.id
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        operationId: operation.id
      };
    }
  }
}
```

### Conflict Detection and Resolution

```ts
class ConflictResolver {
  detectConflict(operation: Operation, serverEntity: VersionedEntity): Conflict | null {
    if (!serverEntity) {
      // Entity doesn't exist on server
      if (operation.type === OperationType.UPDATE || operation.type === OperationType.DELETE) {
        return {
          type: ConflictType.ENTITY_NOT_FOUND,
          operation,
          serverState: null
        };
      }
      return null;
    }

    // Version conflict
    if (operation.version !== serverEntity.version.version) {
      return {
        type: ConflictType.VERSION_MISMATCH,
        operation,
        serverState: serverEntity,
        localVersion: operation.version,
        serverVersion: serverEntity.version.version
      };
    }

    // Concurrent modification conflict
    if (this.hasConcurrentModifications(operation, serverEntity)) {
      return {
        type: ConflictType.CONCURRENT_MODIFICATION,
        operation,
        serverState: serverEntity,
        conflictingFields: this.findConflictingFields(operation, serverEntity)
      };
    }

    return null;
  }

  async resolveConflict(
    conflict: Conflict,
    strategy: ConflictStrategy = ConflictStrategy.LATEST_TIMESTAMP
  ): Promise<ConflictResolution> {
    switch (strategy) {
      case ConflictStrategy.LOCAL_WINS:
        return this.resolveWithLocalWins(conflict);

      case ConflictStrategy.REMOTE_WINS:
        return this.resolveWithRemoteWins(conflict);

      case ConflictStrategy.LATEST_TIMESTAMP:
        return this.resolveWithLatestTimestamp(conflict);

      case ConflictStrategy.MERGE:
        return this.resolveWithMerge(conflict);

      case ConflictStrategy.MANUAL:
        return this.requestManualResolution(conflict);

      default:
        throw new Error(`Unknown conflict strategy: ${strategy}`);
    }
  }

  private async resolveWithMerge(conflict: Conflict): Promise<ConflictResolution> {
    const { operation, serverState } = conflict;

    // Apply operational transformation
    const mergedData = this.performThreeWayMerge(
      operation.data,
      serverState!.data,
      this.getBaseVersion(operation.entityId)
    );

    // Validate merged result
    const validation = await this.validateMergedData(mergedData, operation.entityType);
    if (!validation.isValid) {
      return {
        success: false,
        requiresManualResolution: true,
        validationErrors: validation.errors
      };
    }

    return {
      success: true,
      mergedData,
      strategy: ConflictStrategy.MERGE
    };
  }

  private performThreeWayMerge(local: any, remote: any, base: any): any {
    const merged = { ...base };

    // Apply changes from both local and remote
    Object.keys(local).forEach(key => {
      if (local[key] !== base[key]) {
        // Local change detected
        if (remote[key] === base[key]) {
          // No remote change, use local
          merged[key] = local[key];
        } else if (local[key] === remote[key]) {
          // Same change in both, use either
          merged[key] = local[key];
        } else {
          // Conflicting changes - mark for manual resolution
          merged[key] = {
            __conflict: true,
            local: local[key],
            remote: remote[key],
            base: base[key]
          };
        }
      } else if (remote[key] !== base[key]) {
        // Only remote change, use remote
        merged[key] = remote[key];
      }
    });

    return merged;
  }
}
```

### Deterministic Merge Rules

```ts
interface MergeRule {
  entityType: string;
  field: string;
  strategy: FieldMergeStrategy;
  validator?: (value: any) => boolean;
}

enum FieldMergeStrategy {
  LATEST_TIMESTAMP = 'latest_timestamp',
  HIGHEST_VALUE = 'highest_value',
  ARRAY_UNION = 'array_union',
  CUSTOM_FUNCTION = 'custom_function'
}

class DeterministicMerger {
  private rules: Map<string, MergeRule[]> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Score merge rules - always use latest timestamp
    this.addRule({
      entityType: 'match',
      field: 'scores',
      strategy: FieldMergeStrategy.LATEST_TIMESTAMP
    });

    // Team registration - union of players
    this.addRule({
      entityType: 'team',
      field: 'players',
      strategy: FieldMergeStrategy.ARRAY_UNION
    });

    // Tournament status - use latest valid transition
    this.addRule({
      entityType: 'tournament',
      field: 'status',
      strategy: FieldMergeStrategy.CUSTOM_FUNCTION,
      validator: this.validateTournamentStatusTransition
    });
  }

  mergeField(
    entityType: string,
    field: string,
    localValue: any,
    remoteValue: any,
    localTimestamp: string,
    remoteTimestamp: string
  ): FieldMergeResult {
    const rules = this.rules.get(entityType) || [];
    const rule = rules.find(r => r.field === field);

    if (!rule) {
      // Default: use latest timestamp
      return {
        value: new Date(localTimestamp) > new Date(remoteTimestamp)
          ? localValue
          : remoteValue,
        strategy: 'default_latest_timestamp'
      };
    }

    switch (rule.strategy) {
      case FieldMergeStrategy.LATEST_TIMESTAMP:
        return {
          value: new Date(localTimestamp) > new Date(remoteTimestamp)
            ? localValue
            : remoteValue,
          strategy: rule.strategy
        };

      case FieldMergeStrategy.HIGHEST_VALUE:
        return {
          value: localValue > remoteValue ? localValue : remoteValue,
          strategy: rule.strategy
        };

      case FieldMergeStrategy.ARRAY_UNION:
        return {
          value: [...new Set([...localValue, ...remoteValue])],
          strategy: rule.strategy
        };

      case FieldMergeStrategy.CUSTOM_FUNCTION:
        return this.applyCustomMerge(rule, localValue, remoteValue);

      default:
        throw new Error(`Unknown merge strategy: ${rule.strategy}`);
    }
  }

  private validateTournamentStatusTransition(
    oldStatus: string,
    newStatus: string
  ): boolean {
    const validTransitions: Record<string, string[]> = {
      'draft': ['published', 'cancelled'],
      'published': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    return validTransitions[oldStatus]?.includes(newStatus) || false;
  }
}
```

### IndexedDB Storage Implementation

```ts
class IndexedDBOperationQueue implements OperationQueue {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'courtmaster-offline';
  private readonly version = 1;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Operations store
        if (!db.objectStoreNames.contains('operations')) {
          const operationStore = db.createObjectStore('operations', { keyPath: 'id' });
          operationStore.createIndex('status', 'status', { unique: false });
          operationStore.createIndex('timestamp', 'timestamp', { unique: false });
          operationStore.createIndex('entityType', 'entityType', { unique: false });
        }

        // Entity versions store
        if (!db.objectStoreNames.contains('entityVersions')) {
          const versionStore = db.createObjectStore('entityVersions', { keyPath: 'id' });
          versionStore.createIndex('entityType', 'entityType', { unique: false });
        }

        // Sync metadata store
        if (!db.objectStoreNames.contains('syncMeta')) {
          db.createObjectStore('syncMeta', { keyPath: 'key' });
        }
      };
    });
  }

  async add(operation: Operation): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['operations'], 'readwrite');
      const store = transaction.objectStore('operations');
      const request = store.add(operation);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getNext(): Promise<Operation | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['operations'], 'readonly');
      const store = transaction.objectStore('operations');
      const index = store.index('status');
      const request = index.get(OperationStatus.PENDING);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async markCompleted(operationId: string): Promise<void> {
    return this.updateOperationStatus(operationId, OperationStatus.COMPLETED);
  }

  async markFailed(operationId: string, error: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['operations'], 'readwrite');
      const store = transaction.objectStore('operations');
      const getRequest = store.get(operationId);

      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          operation.status = OperationStatus.FAILED;
          operation.retryCount++;
          operation.lastError = error;

          const putRequest = store.put(operation);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          reject(new Error(`Operation ${operationId} not found`));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  private async updateOperationStatus(
    operationId: string,
    status: OperationStatus
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['operations'], 'readwrite');
      const store = transaction.objectStore('operations');
      const getRequest = store.get(operationId);

      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          operation.status = status;
          operation.completedAt = new Date().toISOString();

          const putRequest = store.put(operation);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          reject(new Error(`Operation ${operationId} not found`));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }
}
```

## Testing Offline Sync

### Unit Tests

```ts
describe('OfflineSyncService', () => {
  let syncService: OfflineSyncService;
  let mockQueue: jest.Mocked<OperationQueue>;

  beforeEach(() => {
    mockQueue = createMockOperationQueue();
    syncService = new OfflineSyncService(mockQueue);
  });

  test('should queue operations when offline', async () => {
    const operation = createTestOperation();

    const operationId = await syncService.queueOperation(operation);

    expect(operationId).toBeDefined();
    expect(mockQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        ...operation,
        id: operationId,
        status: OperationStatus.PENDING
      })
    );
  });

  test('should process queued operations when coming online', async () => {
    const operations = [
      createTestOperation({ type: OperationType.UPDATE }),
      createTestOperation({ type: OperationType.CREATE })
    ];

    mockQueue.getNext
      .mockResolvedValueOnce(operations[0])
      .mockResolvedValueOnce(operations[1])
      .mockResolvedValueOnce(null);

    const result = await syncService.processPendingOperations();

    expect(result.processedOperations).toBe(2);
    expect(mockQueue.markCompleted).toHaveBeenCalledTimes(2);
  });
});

describe('ConflictResolver', () => {
  let resolver: ConflictResolver;

  beforeEach(() => {
    resolver = new ConflictResolver();
  });

  test('should detect version conflicts', () => {
    const operation = createTestOperation({ version: 5 });
    const serverEntity = createVersionedEntity({ version: 7 });

    const conflict = resolver.detectConflict(operation, serverEntity);

    expect(conflict).not.toBeNull();
    expect(conflict!.type).toBe(ConflictType.VERSION_MISMATCH);
    expect(conflict!.localVersion).toBe(5);
    expect(conflict!.serverVersion).toBe(7);
  });

  test('should resolve conflicts with latest timestamp strategy', async () => {
    const conflict = createVersionConflict({
      localTimestamp: '2023-01-01T12:00:00Z',
      remoteTimestamp: '2023-01-01T11:00:00Z'
    });

    const resolution = await resolver.resolveConflict(
      conflict,
      ConflictStrategy.LATEST_TIMESTAMP
    );

    expect(resolution.success).toBe(true);
    expect(resolution.strategy).toBe(ConflictStrategy.LATEST_TIMESTAMP);
  });

  test('should handle three-way merge correctly', async () => {
    const base = { name: 'Team A', score: 10, players: ['p1', 'p2'] };
    const local = { name: 'Team Alpha', score: 15, players: ['p1', 'p2'] };
    const remote = { name: 'Team A', score: 12, players: ['p1', 'p2', 'p3'] };

    const conflict = createMergeConflict(base, local, remote);
    const resolution = await resolver.resolveConflict(
      conflict,
      ConflictStrategy.MERGE
    );

    expect(resolution.success).toBe(true);
    expect(resolution.mergedData.name).toBe('Team Alpha'); // Local change
    expect(resolution.mergedData.players).toEqual(['p1', 'p2', 'p3']); // Remote change
    expect(resolution.mergedData.score).toEqual({
      __conflict: true,
      local: 15,
      remote: 12,
      base: 10
    }); // Conflicting field
  });
});
```

### Integration Tests

```ts
describe('Offline Sync Integration', () => {
  let app: TestApp;
  let networkSimulator: NetworkSimulator;

  beforeEach(async () => {
    app = await createTestApp();
    networkSimulator = new NetworkSimulator();
  });

  test('should handle complete offline-to-online cycle', async () => {
    // Start offline
    networkSimulator.goOffline();

    // Perform operations while offline
    const matchId = await app.createMatch({
      teams: ['team1', 'team2'],
      court: 'court1'
    });

    await app.updateScore(matchId, { team: 'team1', points: 5 });
    await app.updateScore(matchId, { team: 'team2', points: 3 });

    // Verify operations are queued
    const queuedOps = await app.getQueuedOperations();
    expect(queuedOps).toHaveLength(3); // create + 2 score updates

    // Go back online
    networkSimulator.goOnline();

    // Wait for sync to complete
    await app.waitForSync();

    // Verify all operations were applied
    const serverMatch = await app.fetchFromServer(`/matches/${matchId}`);
    expect(serverMatch.scores.team1).toBe(5);
    expect(serverMatch.scores.team2).toBe(3);

    // Verify queue is empty
    const remainingOps = await app.getQueuedOperations();
    expect(remainingOps).toHaveLength(0);
  });

  test('should handle concurrent modifications during offline period', async () => {
    const matchId = 'existing-match';

    // Both clients start with same state
    networkSimulator.simulateSplit();

    // Client A updates score
    await app.updateScore(matchId, { team: 'team1', points: 10 });

    // Client B (simulated) updates score differently
    await networkSimulator.simulateRemoteUpdate(matchId, {
      team: 'team1',
      points: 8,
      team: 'team2',
      points: 5
    });

    // Reconnect and sync
    networkSimulator.reconnect();
    const syncResult = await app.waitForSync();

    // Verify conflict was detected and resolved
    expect(syncResult.conflicts).toBeGreaterThan(0);
    expect(syncResult.successfulOperations).toBeGreaterThan(0);

    // Verify final state is consistent
    const finalMatch = await app.fetchFromServer(`/matches/${matchId}`);
    expect(finalMatch.scores).toBeDefined();
  });
});
```

## Performance Optimization

### Batch Operations

```ts
class BatchProcessor {
  private batchSize = 10;
  private batchTimeout = 1000; // ms

  async processBatch(operations: Operation[]): Promise<BatchResult> {
    const batches = this.createBatches(operations);
    const results: OperationResult[] = [];

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(op => this.processOperation(op))
      );

      results.push(...batchResults.map((result, index) => ({
        operation: batch[index],
        success: result.status === 'fulfilled',
        result: result.status === 'fulfilled' ? result.value : undefined,
        error: result.status === 'rejected' ? result.reason : undefined
      })));
    }

    return {
      total: operations.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  private createBatches(operations: Operation[]): Operation[][] {
    const batches: Operation[][] = [];

    for (let i = 0; i < operations.length; i += this.batchSize) {
      batches.push(operations.slice(i, i + this.batchSize));
    }

    return batches;
  }
}
```

This offline sync developer guide provides comprehensive information for implementing reliable offline functionality with conflict resolution in the CourtMaster Tournament Management System.