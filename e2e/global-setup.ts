import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E test setup...');
  
  // You can add global setup logic here, such as:
  // - Starting test databases
  // - Seeding test data
  // - Setting up authentication tokens
  // - Configuring test environment
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the application to be ready
    await page.goto(config.projects[0].use?.baseURL || 'http://localhost:3000');
    await page.waitForLoadState('networkidle');
    console.log('✅ Application is ready for testing');
  } catch (error) {
    console.error('❌ Failed to verify application readiness:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global E2E test setup completed');
}

export default globalSetup;
