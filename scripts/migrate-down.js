#!/usr/bin/env node

/**
 * CourtMaster Migration Rollback Script
 * Reverses changes made by setup_collections.js and other migration scripts
 */

import { Client, Databases, Storage, Functions } from 'node-appwrite';
import { config } from 'dotenv';

// Load environment variables
config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  header: (msg) => console.log(`${colors.cyan}${colors.bright}${msg}${colors.reset}`)
};

// Appwrite configuration
const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'http://localhost:8080/v1';
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || 'courtmaster-pilot';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'courtmaster-database';

// Resources to remove (in reverse order of creation)
const COLLECTIONS_TO_REMOVE = [
  'match_sets',
  'match_games', 
  'announcements',
  'notifications',
  'tournament_registrations',
  'matches',
  'brackets',
  'teams',
  'tournaments',
  'user_profiles',
  'players'
];

const BUCKETS_TO_REMOVE = [
  'tournament-assets',
  'player-avatars',
  'match-media'
];

const FUNCTIONS_TO_REMOVE = [
  'tournament-notifications',
  'match-scoring',
  'bracket-generator'
];

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

if (APPWRITE_API_KEY) {
  client.setKey(APPWRITE_API_KEY);
}

const databases = new Databases(client);
const storage = new Storage(client);
const functions = new Functions(client);

// Helper functions
const confirmAction = async (message) => {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${message} (y/N): ${colors.reset}`, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
};

// Remove collections
const removeCollections = async () => {
  log.info('Removing collections...');
  
  try {
    // First, check if database exists
    try {
      await databases.get(DATABASE_ID);
    } catch (error) {
      if (error.code === 404) {
        log.warning(`Database ${DATABASE_ID} not found, skipping collection removal`);
        return;
      }
      throw error;
    }
    
    let removedCount = 0;
    
    for (const collectionId of COLLECTIONS_TO_REMOVE) {
      try {
        await databases.deleteCollection(DATABASE_ID, collectionId);
        log.success(`  ✓ Removed collection: ${collectionId}`);
        removedCount++;
      } catch (error) {
        if (error.code === 404) {
          log.info(`  ○ Collection not found: ${collectionId}`);
        } else {
          log.error(`  ✗ Failed to remove collection ${collectionId}: ${error.message}`);
        }
      }
    }
    
    // Remove the database itself if it's empty
    try {
      const collections = await databases.listCollections(DATABASE_ID);
      if (collections.collections.length === 0) {
        const shouldRemoveDb = await confirmAction(`Remove empty database ${DATABASE_ID}?`);
        if (shouldRemoveDb) {
          await databases.delete(DATABASE_ID);
          log.success(`  ✓ Removed database: ${DATABASE_ID}`);
        }
      }
    } catch (error) {
      log.warning(`Could not check database status: ${error.message}`);
    }
    
    log.success(`Collections removal completed (${removedCount} removed)`);
    
  } catch (error) {
    log.error(`Failed to remove collections: ${error.message}`);
    throw error;
  }
};

// Remove storage buckets
const removeBuckets = async () => {
  log.info('Removing storage buckets...');
  
  let removedCount = 0;
  
  for (const bucketId of BUCKETS_TO_REMOVE) {
    try {
      await storage.deleteBucket(bucketId);
      log.success(`  ✓ Removed bucket: ${bucketId}`);
      removedCount++;
    } catch (error) {
      if (error.code === 404) {
        log.info(`  ○ Bucket not found: ${bucketId}`);
      } else {
        log.error(`  ✗ Failed to remove bucket ${bucketId}: ${error.message}`);
      }
    }
  }
  
  log.success(`Buckets removal completed (${removedCount} removed)`);
};

// Remove functions
const removeFunctions = async () => {
  log.info('Removing functions...');
  
  let removedCount = 0;
  
  for (const functionId of FUNCTIONS_TO_REMOVE) {
    try {
      await functions.delete(functionId);
      log.success(`  ✓ Removed function: ${functionId}`);
      removedCount++;
    } catch (error) {
      if (error.code === 404) {
        log.info(`  ○ Function not found: ${functionId}`);
      } else {
        log.error(`  ✗ Failed to remove function ${functionId}: ${error.message}`);
      }
    }
  }
  
  log.success(`Functions removal completed (${removedCount} removed)`);
};

// List current resources
const listResources = async () => {
  log.info('Current Appwrite resources:');
  
  try {
    // List databases
    const databasesList = await databases.list();
    log.info(`\nDatabases (${databasesList.databases.length}):`);
    databasesList.databases.forEach(db => {
      log.info(`  • ${db.$id} - ${db.name}`);
    });
    
    // List collections in our database
    try {
      const collections = await databases.listCollections(DATABASE_ID);
      log.info(`\nCollections in ${DATABASE_ID} (${collections.collections.length}):`);
      collections.collections.forEach(collection => {
        log.info(`  • ${collection.$id} - ${collection.name}`);
      });
    } catch (error) {
      if (error.code === 404) {
        log.info(`\nDatabase ${DATABASE_ID} not found`);
      }
    }
    
    // List storage buckets
    const buckets = await storage.listBuckets();
    log.info(`\nStorage Buckets (${buckets.buckets.length}):`);
    buckets.buckets.forEach(bucket => {
      log.info(`  • ${bucket.$id} - ${bucket.name}`);
    });
    
    // List functions
    const functionsList = await functions.list();
    log.info(`\nFunctions (${functionsList.functions.length}):`);
    functionsList.functions.forEach(func => {
      log.info(`  • ${func.$id} - ${func.name}`);
    });
    
  } catch (error) {
    log.error(`Failed to list resources: ${error.message}`);
  }
};

// Main rollback function
const rollbackMigrations = async () => {
  try {
    log.header('╔══════════════════════════════════════════════════════════════╗');
    log.header('║              CourtMaster Migration Rollback                 ║');
    log.header('╚══════════════════════════════════════════════════════════════╝');
    
    log.warning('⚠️  This will remove CourtMaster collections, buckets, and functions from Appwrite');
    log.warning('⚠️  All data will be permanently lost!');
    
    const confirmed = await confirmAction('Are you sure you want to proceed with the rollback?');
    if (!confirmed) {
      log.info('Rollback cancelled');
      return;
    }
    
    log.info('Starting migration rollback...');
    log.info(`Endpoint: ${APPWRITE_ENDPOINT}`);
    log.info(`Project: ${APPWRITE_PROJECT_ID}`);
    log.info(`Database: ${DATABASE_ID}`);
    
    // Remove resources in reverse order
    await removeFunctions();
    await removeBuckets();
    await removeCollections();
    
    // Summary
    log.header('\n╔══════════════════════════════════════════════════════════════╗');
    log.header('║                 Rollback Complete                           ║');
    log.header('╚══════════════════════════════════════════════════════════════╝');
    
    log.success('🔄 Migration rollback completed successfully!');
    log.info('📊 All CourtMaster resources have been removed from Appwrite');
    log.info('🚀 You can now run setup_collections.js to recreate the schema');
    
  } catch (error) {
    log.error(`Rollback failed: ${error.message}`);
    process.exit(1);
  }
};

// CLI handling
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'list':
    if (!APPWRITE_API_KEY) {
      log.error('APPWRITE_API_KEY environment variable is required');
      process.exit(1);
    }
    listResources();
    break;
  case 'help':
  case '--help':
  case '-h':
    console.log('CourtMaster Migration Rollback Script');
    console.log('');
    console.log('Usage: node scripts/migrate-down.js [command]');
    console.log('');
    console.log('Commands:');
    console.log('  (none)    Rollback all migrations (removes collections, buckets, functions)');
    console.log('  list      List current Appwrite resources');
    console.log('  help      Show this help message');
    console.log('');
    console.log('Environment Variables:');
    console.log('  VITE_APPWRITE_ENDPOINT     Appwrite server endpoint');
    console.log('  VITE_APPWRITE_PROJECT_ID   Appwrite project ID');
    console.log('  APPWRITE_API_KEY          Appwrite API key (required)');
    console.log('  APPWRITE_DATABASE_ID      Database ID (optional)');
    console.log('');
    console.log('⚠️  WARNING: This script will permanently delete data!');
    break;
  default:
    if (!APPWRITE_API_KEY) {
      log.error('APPWRITE_API_KEY environment variable is required');
      log.info('Please set your Appwrite API key in the environment or .env file');
      process.exit(1);
    }
    rollbackMigrations();
    break;
}
