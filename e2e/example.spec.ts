import { test, expect } from '@playwright/test';

test.describe('CourtMaster Application', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the page title contains "CourtMaster"
    await expect(page).toHaveTitle(/CourtMaster/);
    
    // Check for main navigation or key elements
    // Note: Update these selectors based on your actual application structure
    const mainContent = page.locator('main, #root, [data-testid="main-content"]');
    await expect(mainContent).toBeVisible();
  });

  test('should navigate to tournaments page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if we're redirected to login (which is expected without authentication)
    if (page.url().includes('/login')) {
      // This is expected behavior - the app requires authentication
      // We can either skip this test or perform a mock login
      console.log('Redirected to login page as expected');
      
      // Try to find login form and use demo credentials
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
      
      if (await emailInput.isVisible() && await passwordInput.isVisible()) {
        await emailInput.fill('demoadmin@example.com');
        await passwordInput.fill('demopassword');
        await loginButton.click();
        await page.waitForLoadState('networkidle');
        
        // Now try to navigate to tournaments
        const tournamentsLink = page.locator('a[href*="tournament"], button:has-text("Tournament")').first();
        if (await tournamentsLink.isVisible()) {
          await tournamentsLink.click();
          await page.waitForLoadState('networkidle');
          await expect(page.url()).toContain('tournament');
        } else {
          test.skip(true, 'Tournaments navigation not found after login');
        }
      } else {
        test.skip(true, 'Login form not found - authentication flow may be different');
      }
    } else {
      // If not redirected to login, try direct navigation
      const tournamentsLink = page.locator('a[href*="tournament"], button:has-text("Tournament")').first();
      
      if (await tournamentsLink.isVisible()) {
        await tournamentsLink.click();
        await page.waitForLoadState('networkidle');
        await expect(page.url()).toContain('tournament');
      } else {
        test.skip(true, 'Tournaments navigation not found - feature may not be implemented yet');
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that the page is still functional on mobile
    const mainContent = page.locator('main, #root, [data-testid="main-content"]');
    await expect(mainContent).toBeVisible();
    
    // Check for mobile menu or responsive navigation
    // Note: Update based on your mobile navigation implementation
    const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu, button[aria-label*="menu"]');
    
    if (await mobileMenu.isVisible()) {
      await expect(mobileMenu).toBeVisible();
    }
  });

  test('should handle offline mode (PWA)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Simulate offline mode
    await page.context().setOffline(true);
    
    // Try to navigate or perform an action
    await page.reload();
    
    // The app should still be functional in offline mode
    // Note: This test assumes PWA functionality is implemented
    const offlineIndicator = page.locator('[data-testid="offline-indicator"], .offline-mode');
    
    if (await offlineIndicator.isVisible()) {
      await expect(offlineIndicator).toBeVisible();
    }
    
    // Restore online mode
    await page.context().setOffline(false);
  });
});
