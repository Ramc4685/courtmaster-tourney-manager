import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global E2E test teardown...');
  
  // You can add global teardown logic here, such as:
  // - Cleaning up test databases
  // - Removing test files
  // - Stopping test services
  // - Generating test reports
  
  console.log('✅ Global E2E test teardown completed');
}

export default globalTeardown;
