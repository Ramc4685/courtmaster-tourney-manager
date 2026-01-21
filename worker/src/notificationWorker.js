/**
 * CourtMaster Notification Worker
 * Processes notifications from the Redis queue for push, email, and SMS.
 */

const { parentPort, workerData } = require('worker_threads');
const Redis = require('ioredis');
const { Client, Users } = require('node-appwrite');

const { config } = workerData;

let redis;
let appwrite;
let users;
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
  if (!config.notifications.enabled) {
    logger.info('Notification Worker: Disabled by configuration.');
    return;
  }

  try {
    // Initialize Redis
    redis = new Redis(config.redis.url, { lazyConnect: true });
    await redis.connect();
    logger.info('Notification Worker: Redis connected');

    // Initialize Appwrite
    appwrite = new Client()
      .setEndpoint(config.appwrite.endpoint)
      .setProject(config.appwrite.projectId)
      .setKey(config.appwrite.apiKey);
    users = new Users(appwrite);
    logger.info('Notification Worker: Appwrite client initialized');

    // Start processing the queue
    processQueue();
  } catch (error) {
    logger.error('Notification Worker: Initialization failed', error);
    process.exit(1);
  }
}

/**
 * Main loop to process the notification queue
 */
async function processQueue() {
  logger.info('Notification Worker: Waiting for notification jobs...');

  while (!isShuttingDown) {
    try {
      const job = await redis.brpop('notifications:queue', 5); // 5-second timeout
      if (!job) continue;

      const notification = JSON.parse(job[1]);
      logger.info('Notification Worker: Processing notification', { notificationId: notification.id });

      await processNotification(notification);

    } catch (error) {
      logger.error('Notification Worker: Error processing queue', error);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Prevent fast-fail loops
    }
  }
  logger.info('Notification Worker: Queue processing stopped.');
}

/**
 * Process a single notification job
 */
async function processNotification(notification) {
  try {
    // In a real app, you'd fetch user preferences here
    // const userPreferences = await getUserPreferences(notification.recipients);

    // TODO: Implement a template system for messages
    const message = getTemplatedMessage(notification);

    // Send notifications based on type
    if (notification.type === 'push' || notification.type === 'all') {
      await sendPushNotification(notification.recipients, message);
    }
    if (notification.type === 'email' || notification.type === 'all') {
      await sendEmailNotification(notification.recipients, message);
    }
    if (notification.type === 'sms' || notification.type === 'all') {
      await sendSmsNotification(notification.recipients, message);
    }

    logger.info('Notification Worker: Notification processed successfully', { notificationId: notification.id });
    // TODO: Add delivery tracking logic here

  } catch (error) {
    logger.error('Notification Worker: Failed to process notification', error, { notificationId: notification.id });
    await handleFailedNotification(notification, error);
  }
}

/**
 * Handle failed notification jobs with retry logic
 */
async function handleFailedNotification(notification, error) {
  notification.retries = (notification.retries || 0) + 1;

  if (notification.retries < (config.notifications.maxRetries || 3)) {
    const delay = Math.pow(2, notification.retries) * 1000;
    logger.info(`Notification Worker: Retrying notification in ${delay}ms`, { notificationId: notification.id, attempt: notification.retries });
    
    setTimeout(async () => {
      await redis.lpush('notifications:queue', JSON.stringify(notification));
    }, delay);

  } else {
    logger.error('Notification Worker: Notification failed permanently', error, { notificationId: notification.id });
    notification.error = error.message;
    await redis.lpush('notifications:failed', JSON.stringify(notification));
  }
}

// --- Placeholder Notification Senders ---

async function sendPushNotification(recipients, message) {
  // TODO: Integrate with a Web Push service (e.g., web-push library)
  logger.info('Sending PUSH notification (placeholder)', { recipients, message });
  // 1. Fetch push subscriptions for recipients from Appwrite/DB
  // 2. Use web-push to send notifications to each subscription
  // 3. Handle expired/invalid subscriptions
  return Promise.resolve();
}

async function sendEmailNotification(recipients, message) {
  // TODO: Integrate with an email service (e.g., Nodemailer + SendGrid/Mailgun)
  logger.info('Sending EMAIL notification (placeholder)', { recipients, message });
  // 1. Fetch email addresses for recipients
  // 2. Use Nodemailer to send the email
  // 3. Track delivery status
  return Promise.resolve();
}

async function sendSmsNotification(recipients, message) {
  // TODO: Integrate with an SMS service (e.g., Twilio)
  logger.info('Sending SMS notification (placeholder)', { recipients, message });
  // 1. Fetch phone numbers for recipients
  // 2. Use Twilio client to send SMS
  // 3. Handle delivery receipts
  return Promise.resolve();
}

function getTemplatedMessage(notification) {
  // TODO: Implement a proper template engine (e.g., Handlebars)
  return `Subject: ${notification.data.subject || 'CourtMaster Notification'}\nBody: ${notification.message}`;
}

/**
 * Graceful shutdown
 */
function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info('Notification Worker: Shutting down...');

  if (redis) {
    redis.quit().then(() => {
      logger.info('Notification Worker: Redis connection closed.');
      process.exit(0);
    }).catch(err => {
      logger.error('Notification Worker: Error closing Redis connection', err);
      process.exit(1);
    });
  } else {
    process.exit(0);
  }
}

// Initialize and start the worker
initialize();

// Listen for shutdown message from parent
parentPort.on('message', (message) => {
  if (message === 'shutdown') {
    shutdown();
  }
});
