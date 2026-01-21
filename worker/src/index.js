/**
 * CourtMaster Worker Service
 * Background processing for offline sync, notifications, and data processing
 */

const express = require('express');
const cors = require('cors');
const { Worker } = require('worker_threads');
const Redis = require('ioredis');
const { Client, Databases, Query, ID } = require('node-appwrite');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  port: process.env.PORT || 3001,
  appwrite: {
    endpoint: process.env.APPWRITE_ENDPOINT || 'http://appwrite:80/v1',
    projectId: process.env.APPWRITE_PROJECT_ID || 'courtmaster-pilot',
    databaseId: process.env.APPWRITE_DATABASE_ID || 'courtmaster-database',
    apiKey: process.env.APPWRITE_API_KEY
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://redis:6379'
  },
  sync: {
    interval: parseInt(process.env.SYNC_INTERVAL) || 30000,
    maxRetries: parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3,
    conflictStrategy: process.env.CONFLICT_RESOLUTION_STRATEGY || 'last_write_wins'
  },
  notifications: {
    enabled: process.env.NOTIFICATION_ENABLED === 'true'
  }
};

// Global instances
let app;
let server;
let redis;
let appwrite;
let databases;
let syncWorker;
let notificationWorker;

// Logging utility
const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  error: (message, error = {}, meta = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  }
};

/**
 * Initialize services
 */
async function initializeServices() {
  try {
    // Initialize Express app
    app = express();
    app.use(cors());
    app.use(express.json({ limit: '10mb' }));

    // Initialize Redis
    redis = new Redis(CONFIG.redis.url, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    await redis.connect();
    logger.info('Redis connected successfully');

    // Initialize Appwrite
    appwrite = new Client()
      .setEndpoint(CONFIG.appwrite.endpoint)
      .setProject(CONFIG.appwrite.projectId)
      .setKey(CONFIG.appwrite.apiKey);

    databases = new Databases(appwrite);
    logger.info('Appwrite client initialized');

    // Setup routes
    setupRoutes();

    // Initialize background workers
    await initializeWorkers();

    // Setup scheduled tasks
    setupScheduledTasks();

    logger.info('Worker service initialized successfully', { config: CONFIG });
  } catch (error) {
    logger.error('Failed to initialize worker service', error);
    process.exit(1);
  }
}

/**
 * Setup Express routes
 */
function setupRoutes() {
  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        redis: redis.status,
        appwrite: !!databases
      }
    });
  });

  // Sync status
  app.get('/sync/status', async (req, res) => {
    try {
      const pendingCount = await redis.llen('sync:queue');
      const failedCount = await redis.llen('sync:failed');
      const lastSync = await redis.get('sync:last_completed');

      res.json({
        pending: pendingCount,
        failed: failedCount,
        lastSync: lastSync ? new Date(parseInt(lastSync)) : null,
        strategy: CONFIG.sync.conflictStrategy
      });
    } catch (error) {
      logger.error('Failed to get sync status', error);
      res.status(500).json({ error: 'Failed to get sync status' });
    }
  });

  // Trigger manual sync
  app.post('/sync/trigger', async (req, res) => {
    try {
      await triggerSync();
      res.json({ message: 'Sync triggered successfully' });
    } catch (error) {
      logger.error('Failed to trigger sync', error);
      res.status(500).json({ error: 'Failed to trigger sync' });
    }
  });

  // Queue operation for sync
  app.post('/sync/queue', async (req, res) => {
    try {
      const { operation, collection, documentId, data } = req.body;

      if (!operation || !collection) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const syncOperation = {
        id: ID.unique(),
        operation,
        collection,
        documentId,
        data,
        timestamp: Date.now(),
        retries: 0
      };

      await redis.lpush('sync:queue', JSON.stringify(syncOperation));
      logger.info('Operation queued for sync', { operationId: syncOperation.id, operation, collection });

      res.json({
        id: syncOperation.id,
        message: 'Operation queued successfully'
      });
    } catch (error) {
      logger.error('Failed to queue operation', error);
      res.status(500).json({ error: 'Failed to queue operation' });
    }
  });

  // Notification endpoints
  app.post('/notifications/send', async (req, res) => {
    try {
      const { type, message, data, recipients } = req.body;

      if (!CONFIG.notifications.enabled) {
        return res.status(503).json({ error: 'Notifications are disabled' });
      }

      await sendNotification({ type, message, data, recipients });
      res.json({ message: 'Notification sent successfully' });
    } catch (error) {
      logger.error('Failed to send notification', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  // Conflict resolution
  app.post('/conflicts/resolve', async (req, res) => {
    try {
      const { conflictId, strategy, resolution } = req.body;
      await resolveConflict(conflictId, strategy, resolution);
      res.json({ message: 'Conflict resolved successfully' });
    } catch (error) {
      logger.error('Failed to resolve conflict', error);
      res.status(500).json({ error: 'Failed to resolve conflict' });
    }
  });

  // Get failed operations
  app.get('/sync/failed', async (req, res) => {
    try {
      const failed = await redis.lrange('sync:failed', 0, -1);
      const operations = failed.map(JSON.parse);
      res.json(operations);
    } catch (error) {
      logger.error('Failed to get failed operations', error);
      res.status(500).json({ error: 'Failed to get failed operations' });
    }
  });
}

/**
 * Initialize background workers
 */
async function initializeWorkers() {
  // Sync worker
  syncWorker = new Worker(path.join(__dirname, 'syncWorker.js'), {
    workerData: { config: CONFIG }
  });

  syncWorker.on('message', (message) => {
    logger.info('Sync worker message', message);
  });

  syncWorker.on('error', (error) => {
    logger.error('Sync worker error', error);
  });

  // Notification worker (if enabled)
  if (CONFIG.notifications.enabled) {
    notificationWorker = new Worker(path.join(__dirname, 'notificationWorker.js'), {
      workerData: { config: CONFIG }
    });

    notificationWorker.on('message', (message) => {
      logger.info('Notification worker message', message);
    });

    notificationWorker.on('error', (error) => {
      logger.error('Notification worker error', error);
    });
  }
}

/**
 * Setup scheduled tasks
 */
function setupScheduledTasks() {
  // Periodic sync every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      await triggerSync();
    } catch (error) {
      logger.error('Scheduled sync failed', error);
    }
  });

  // Cleanup old logs every hour
  cron.schedule('0 * * * *', async () => {
    try {
      await cleanupLogs();
    } catch (error) {
      logger.error('Log cleanup failed', error);
    }
  });

  // Health check monitoring every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await performHealthCheck();
    } catch (error) {
      logger.error('Health check failed', error);
    }
  });

  logger.info('Scheduled tasks configured');
}

/**
 * Trigger synchronization process
 * Signal the sync worker to process the queue instead of processing directly
 */
async function triggerSync() {
  try {
    logger.info('Triggering sync process');

    // Signal the sync worker to process any pending operations
    // The actual processing is handled by syncWorker.js to avoid duplicate consumers
    await redis.publish('sync:trigger', Date.now().toString());

    logger.info('Sync trigger sent to worker');
    return { message: 'Sync triggered' };
  } catch (error) {
    logger.error('Failed to trigger sync', error);
    throw error;
  }
}

/**
 * Process individual sync operation
 */
async function processSyncOperation(operation) {
  const { operation: op, collection, documentId, data } = operation;

  switch (op) {
    case 'create':
      await databases.createDocument(
        CONFIG.appwrite.databaseId,
        collection,
        documentId || ID.unique(),
        data
      );
      break;

    case 'update':
      await databases.updateDocument(
        CONFIG.appwrite.databaseId,
        collection,
        documentId,
        data
      );
      break;

    case 'delete':
      await databases.deleteDocument(
        CONFIG.appwrite.databaseId,
        collection,
        documentId
      );
      break;

    default:
      throw new Error(`Unknown operation: ${op}`);
  }
}

/**
 * Send notification
 */
async function sendNotification({ type, message, data, recipients }) {
  if (!CONFIG.notifications.enabled) return;

  const notification = {
    id: ID.unique(),
    type,
    message,
    data,
    recipients,
    timestamp: Date.now()
  };

  await redis.lpush('notifications:queue', JSON.stringify(notification));
  logger.info('Notification queued', { notificationId: notification.id, type });
}

/**
 * Resolve conflict
 */
async function resolveConflict(conflictId, strategy, resolution) {
  logger.info('Resolving conflict', { conflictId, strategy });

  // Get conflict data
  const conflictData = await redis.get(`conflict:${conflictId}`);
  if (!conflictData) {
    throw new Error('Conflict not found');
  }

  const conflict = JSON.parse(conflictData);

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

    case 'manual':
      resolvedData = resolution;
      break;

    default:
      throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
  }

  // Apply resolution
  await processSyncOperation({
    operation: 'update',
    collection: conflict.collection,
    documentId: conflict.documentId,
    data: resolvedData
  });

  // Remove conflict
  await redis.del(`conflict:${conflictId}`);

  logger.info('Conflict resolved successfully', { conflictId, strategy });
}

/**
 * Cleanup old logs
 */
async function cleanupLogs() {
  try {
    const logDir = '/app/logs';
    const files = await fs.readdir(logDir);
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days

    for (const file of files) {
      const filePath = path.join(logDir, file);
      const stats = await fs.stat(filePath);

      if (stats.mtime.getTime() < cutoff) {
        await fs.unlink(filePath);
        logger.info('Deleted old log file', { file });
      }
    }
  } catch (error) {
    logger.error('Failed to cleanup logs', error);
  }
}

/**
 * Perform health check
 */
async function performHealthCheck() {
  try {
    // Check Redis
    await redis.ping();

    // Check Appwrite
    await databases.listDocuments(CONFIG.appwrite.databaseId, 'healthcheck', [Query.limit(1)]);

    // Check disk space
    const stats = await fs.stat('/app/data');
    // Basic health monitoring

    logger.info('Health check passed');
  } catch (error) {
    logger.error('Health check failed', error);
  }
}

/**
 * Graceful shutdown
 */
function setupGracefulShutdown() {
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down gracefully`);

    try {
      // Close workers
      if (syncWorker) {
        await syncWorker.terminate();
      }
      if (notificationWorker) {
        await notificationWorker.terminate();
      }

      // Close Redis connection
      if (redis) {
        await redis.quit();
      }

      // Close Express server
      if (server) {
        server.close();
      }

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Start the worker service
 */
async function start() {
  try {
    await initializeServices();
    setupGracefulShutdown();

    server = app.listen(CONFIG.port, '0.0.0.0', () => {
      logger.info('Worker service started', {
        port: CONFIG.port,
        environment: process.env.NODE_ENV || 'pilot'
      });
    });

    // Set server timeout for long-running requests
    server.timeout = 60000;

  } catch (error) {
    logger.error('Failed to start worker service', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Start the service
start();