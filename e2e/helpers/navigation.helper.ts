import { Page, expect } from '@playwright/test';

export class NavigationHelper {
  constructor(private page: Page) { }

  async goToTournaments() {
    const navigationSelectors = [
      'a[href="/tournaments"]',
      'nav a[href="/tournaments"]',
      'nav a:has-text("Tournaments")',
      'button[aria-label="Tournaments"]',
      '[data-testid="tournaments-nav"]'
    ];

    for (const selector of navigationSelectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible()) {
        await element.click();
        await this.page.waitForLoadState('networkidle');
        break;
      }
    }

    // Verify we're on tournaments page
    expect(this.page.url()).toContain('tournament');
    console.log('✅ Navigated to tournaments page');
  }

  async goToCreateTournament() {
    const createSelectors = [
      'a[href="/tournaments/new"]',
      'a[href="/tournaments/wizard"]',
      'button:has-text("Create Tournament")',
      'button:has-text("New Tournament")',
      '[data-testid="create-tournament"]',
      '.create-tournament-btn'
    ];

    for (const selector of createSelectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible()) {
        await element.click();
        await this.page.waitForLoadState('networkidle');
        break;
      }
    }

    // Verify we're on tournament creation page
    const url = this.page.url();
    expect(url).toMatch(/\/(tournaments\/(new|wizard)|create)/);
    console.log('✅ Navigated to tournament creation page');
  }

  async goToTournamentDetails(tournamentId: string) {
    await this.page.goto(`/tournaments/${tournamentId}`);
    await this.page.waitForLoadState('networkidle');
    console.log(`✅ Navigated to tournament details: ${tournamentId}`);
  }

  async goToDashboard() {
    const dashboardSelectors = [
      'a[href="/dashboard"]',
      'nav a:has-text("Dashboard")',
      '[data-testid="dashboard-nav"]'
    ];

    for (const selector of dashboardSelectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible()) {
        await element.click();
        await this.page.waitForLoadState('networkidle');
        break;
      }
    }

    expect(this.page.url()).toContain('dashboard');
    console.log('✅ Navigated to dashboard');
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000); // Additional wait for dynamic content
  }

  async selectTab(tabName: string) {
    const tabSelectors = [
      `[role="tab"]:has-text("${tabName}")`,
      `button:has-text("${tabName}")`,
      `.tab:has-text("${tabName}")`,
      `[data-testid="${tabName.toLowerCase()}-tab"]`
    ];

    for (const selector of tabSelectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible()) {
        await element.click();
        await this.page.waitForTimeout(500);
        console.log(`✅ Selected tab: ${tabName}`);
        return true;
      }
    }

    throw new Error(`Tab "${tabName}" not found`);
  }
}
