import { Page } from '@playwright/test';

export class AuthHelper {
  constructor(private page: Page) {}

  async loginAsAdmin() {
    console.log('🔧 [E2E AUTH BYPASS] Starting authentication bypass for testing');
    
    // Navigate directly to tournaments page - auth bypass should handle authentication
    await this.page.goto('/tournaments');
    await this.page.waitForLoadState('networkidle');
    
    // Wait for auth context to initialize
    await this.page.waitForTimeout(5000);
    
    // Check current URL
    const currentUrl = this.page.url();
    console.log('🔧 [E2E AUTH BYPASS] Current URL after navigation:', currentUrl);
    
    // If we're still on login page, the bypass didn't work
    if (currentUrl.includes('/login')) {
      console.log('❌ [E2E AUTH BYPASS] Failed - still on login page, trying manual navigation');
      
      // Try navigating to home first, then tournaments
      await this.page.goto('/');
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(3000);
      
      // Look for "View Tournaments" button and click it
      const viewTournamentsBtn = this.page.locator('button:has-text("View Tournaments"), button:has-text("Get Started")').first();
      if (await viewTournamentsBtn.isVisible()) {
        console.log('🔧 [E2E AUTH BYPASS] Clicking View Tournaments button');
        await viewTournamentsBtn.click();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(2000);
      }
      
      const finalUrl = this.page.url();
      console.log('🔧 [E2E AUTH BYPASS] Final URL:', finalUrl);
      
      if (finalUrl.includes('/login')) {
        throw new Error(`Authentication bypass completely failed. Still on login page: ${finalUrl}`);
      }
    }
    
    console.log('✅ [E2E AUTH BYPASS] Successfully bypassed authentication');
    return true;
  }

  async loginAsPlayer() {
    console.log('🔧 [E2E AUTH BYPASS] Using same bypass for player login');
    return this.loginAsAdmin(); // Use same bypass logic
  }

  async logout() {
    console.log('🔧 [E2E AUTH BYPASS] Logout not needed with auth bypass');
    // With auth bypass, logout is not necessary for testing
    return true;
  }
}
