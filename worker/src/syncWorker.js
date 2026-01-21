/**
 * CourtMaster Sync Worker
 * Processes offline operations from the Redis queue and syncs them with Appwrite.
 */

const { parentPort, workerData } = require('worker_threads');
const Redis = require('ioredis');
const { Client, Databases, ID } = require('node-appwrite');

const { config } = workerData;

let redis;
let appwrite;
let databases;
let isShuttingDown = false;

// Logging utility
const logger = {
  info: (message, meta = {}) => parentPort.postMessage({ level: 'info', message, ...meta }),
  error: (message, error = {}, meta = {}) => parentPort.postMessage({ level: 'error', message, error: error.message || error, ...meta }),
};

/**
 * Initialize worker services
 */
async function initialize() {
  try {
    // Initialize Redis
    redis = new Redis(config.redis.url, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });
    await redis.connect();
    logger.info('Sync Worker: Redis connected');

    // Initialize Appwrite
    appwrite = new Client()
      .setEndpoint(config.appwrite.endpoint)
      .setProject(config.appwrite.projectId)
      .setKey(config.appwrite.apiKey);
    databases = new Databases(appwrite);
    logger.info('Sync Worker: Appwrite client initialized');

    // Start processing the queue
    processQueue();
  } catch (error) {
    logger.error('Sync Worker: Initialization failed', error);
    process.exit(1);
  }
}

/**
 * Main loop to process the sync queue
 */
async function processQueue() {
  logger.info('Sync Worker: Waiting for sync operations...');

  while (!isShuttingDown) {
    try {
      const operation = await redis.brpop('sync:queue', 5); // 5-second timeout
      if (!operation) continue;

      const syncOp = JSON.parse(operation[1]);
      logger.info('Sync Worker: Processing operation', { operationId: syncOp.id });

      await processSyncOperation(syncOp);

    } catch (error) {
      logger.error('Sync Worker: Error processing queue', error);
      // Wait before retrying to prevent fast-fail loops
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  logger.info('Sync Worker: Queue processing stopped.');
}

/**
 * Process a single sync operation
 */
async function processSyncOperation(operation) {
  try {
    const { operation: op, collection, documentId, data } = operation;

    switch (op) {
      case 'create':
        await databases.createDocument(config.appwrite.databaseId, collection, documentId || ID.unique(), data);
        break;
      case 'update':
        await databases.updateDocument(config.appwrite.databaseId, collection, documentId, data);
        break;
      case 'delete':
        await databases.deleteDocument(config.appwrite.databaseId, collection, documentId);
        break;
      default:
        throw new Error(`Unknown operation: ${op}`);
    }

    logger.info('Sync Worker: Operation successful', { operationId: operation.id });
    await redis.set('sync:last_completed', Date.now());

  } catch (error) {
    logger.error('Sync Worker: Operation failed', error, { operationId: operation.id });
    await handleFailedOperation(operation, error);
  }
}

/**
 * Handle failed sync operations with retry logic
 */
async function handleFailedOperation(operation, error) {
  operation.retries = (operation.retries || 0) + 1;

  if (operation.retries < config.sync.maxRetries) {
    const delay = Math.pow(2, operation.retries) * 1000; // Exponential backoff
    logger.info(`Sync Worker: Retrying operation in ${delay}ms`, { operationId: operation.id, attempt: operation.retries });
    
    setTimeout(async () => {
      await redis.lpush('sync:queue', JSON.stringify(operation));
    }, delay);

  } else {
    logger.error('Sync Worker: Operation failed permanently', error, { operationId: operation.id });
    operation.error = error.message;
    await redis.lpush('sync:failed', JSON.stringify(operation));
  }
}

/**
 * Graceful shutdown
 */
function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info('Sync Worker: Shutting down...');

  redis.quit().then(() => {
    logger.info('Sync Worker: Redis connection closed.');
    process.exit(0);
  }).catch(err => {
    logger.error('Sync Worker: Error closing Redis connection', err);
    process.exit(1);
  });
}

// Initialize and start the worker
initialize();

// Listen for shutdown message from parent
parentPort.on('message', (message) => {
  if (message === 'shutdown') {
    shutdown();
  }
});
