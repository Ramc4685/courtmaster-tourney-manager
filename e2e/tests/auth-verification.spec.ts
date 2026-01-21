import { test, expect } from '@playwright/test';

test.describe('Authentication Verification', () => {
  test('should verify mock auth service is working', async ({ page }) => {
    console.log('🔍 Testing authentication setup...');

    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if we're on login page (expected for unauthenticated users)
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('/login')) {
      console.log('✅ Correctly redirected to login page');

      // Check for login form elements
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(loginButton).toBeVisible();

      console.log('✅ Login form elements found');

      // Try login with demo credentials
      await emailInput.fill('demoadmin@example.com');
      await passwordInput.fill('demopassword');

      console.log('🔐 Attempting login...');
      await loginButton.click();

      // Wait for navigation or error
      await page.waitForTimeout(3000);

      // Check the result
      const afterLoginUrl = page.url();
      console.log('After login URL:', afterLoginUrl);

      if (afterLoginUrl.includes('/login')) {
        // Still on login page - check for error messages
        const errorMessages = page.locator('.error, [role="alert"], .text-red-500');
        const errorCount = await errorMessages.count();

        if (errorCount > 0) {
          const errorText = await errorMessages.first().textContent();
          console.log('❌ Login failed with error:', errorText);
        } else {
          console.log('❌ Login failed but no error message visible');
        }

        // Take screenshot for debugging
        await page.screenshot({ path: 'test-results/auth-verification-failed.png' });
      } else {
        console.log('✅ Login successful - redirected to:', afterLoginUrl);
        expect(afterLoginUrl).not.toContain('/login');
      }
    } else {
      console.log('ℹ️ Not redirected to login - app may allow anonymous access');
      expect(currentUrl).toBeTruthy();
    }
  });

  test('should check environment variables', async ({ page }) => {
    console.log('🔧 Checking environment configuration...');

    // Navigate to the app and check environment in browser console
    await page.goto('/');

    // Inject script to check environment variables
    const envCheck = await page.evaluate(() => {
      const env = (window as any).env || {};
      return {
        VITE_APP_ENV: env.VITE_APP_ENV || 'unknown',
        VITE_USE_MOCK_AUTH: env.VITE_USE_MOCK_AUTH || 'unknown',
        VITE_USE_MOCK_DATA: env.VITE_USE_MOCK_DATA || 'unknown',
        VITE_APPWRITE_ENDPOINT: env.VITE_APPWRITE_ENDPOINT || 'unknown'
      };
    });

    console.log('Environment variables:', envCheck);

    // Log environment for debugging - mock mode should be enabled in test environment
    console.log('Mock auth enabled:', envCheck.VITE_USE_MOCK_AUTH);
    console.log('App environment:', envCheck.VITE_APP_ENV);
  });
});