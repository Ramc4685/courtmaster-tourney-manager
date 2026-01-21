import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration with code coverage support
 * This config instruments the application for coverage collection during E2E tests
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Sequential for coverage accuracy
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for coverage collection
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
    ['line']
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Enable coverage collection
    contextOptions: {
      // Collect coverage from all JavaScript files
      recordVideo: {
        mode: 'retain-on-failure',
        size: { width: 1280, height: 720 }
      }
    }
  },

  projects: [
    {
      name: 'chromium-coverage',
      use: {
        ...devices['Desktop Chrome'],
        // Enable code coverage collection
        contextOptions: {
          // This will collect coverage data
          recordTrace: true
        }
      }
    }
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'test',
      VITE_APP_ENV: 'test',
      VITE_APPWRITE_ENDPOINT: '',
      VITE_APPWRITE_PROJECT_ID: '',
      VITE_APPWRITE_DATABASE_ID: '',
      VITE_USE_MOCK_AUTH: 'true',
      VITE_USE_MOCK_DATA: 'true',
      // Enable instrumentation for coverage
      VITE_COVERAGE: 'true'
    },
  },

  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000,
  },

  outputDir: 'test-results/',
});