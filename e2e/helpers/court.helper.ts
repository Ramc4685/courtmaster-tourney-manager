import { Page, expect } from '@playwright/test';

export interface CourtData {
  name: string;
  courtNumber: number;
  description?: string;
}

export class CourtHelper {
  constructor(private page: Page) {}

  async addCourt(tournamentId: string, courtData: CourtData) {
    console.log(`🏟️ Adding court: ${courtData.name}`);

    // Navigate to courts section
    await this.navigateToCourtsSection(tournamentId);

    // Click add court button
    await this.clickAddCourtButton();

    // Fill court form
    await this.fillCourtForm(courtData);

    // Save court
    await this.saveCourt();

    console.log(`✅ Court added: ${courtData.name}`);
  }

  async assignMatchToCourt(tournamentId: string, matchId: string, courtName: string) {
    console.log(`🏸 Assigning match ${matchId} to court ${courtName}`);

    // Navigate to courts or scheduling section
    await this.navigateToSchedulingSection(tournamentId);

    // Find the match
    const matchElement = this.page.locator(`[data-match-id="${matchId}"], tr:has-text("${matchId}")`);

    // Look for court assignment dropdown or button
    const courtAssignmentSelectors = [
      `select[name="court"]`,
      `[data-testid="court-select"]`,
      `button:has-text("Assign Court")`,
      `.court-assignment`
    ];

    for (const selector of courtAssignmentSelectors) {
      const element = matchElement.locator(selector).or(this.page.locator(selector));
      if (await element.isVisible()) {
        if (selector.includes('select')) {
          await element.selectOption(courtName);
        } else {
          await element.click();
          await this.page.waitForTimeout(500);
          // Look for court option in dropdown
          const courtOption = this.page.locator(`option:has-text("${courtName}"), li:has-text("${courtName}")`);
          if (await courtOption.isVisible()) {
            await courtOption.click();
          }
        }
        break;
      }
    }

    // Save assignment
    const saveButton = this.page.locator('button:has-text("Save"), button:has-text("Assign")');
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await this.page.waitForTimeout(1000);
    }

    console.log(`✅ Match assigned to court: ${matchId} → ${courtName}`);
  }

  async verifyCourtAdded(courtName: string) {
    console.log(`🔍 Verifying court was added: ${courtName}`);

    // Look for court in the courts list
    const courtElement = this.page.locator(`[data-testid="court-list"] tr:has-text("${courtName}"), .court-item:has-text("${courtName}")`);
    await expect(courtElement).toBeVisible();

    console.log(`✅ Court verified: ${courtName}`);
  }

  async verifyMatchAssignedToCourt(matchId: string, courtName: string) {
    console.log(`🔍 Verifying match assignment: ${matchId} → ${courtName}`);

    // Look for match-court assignment in schedule or court view
    const assignmentSelectors = [
      `[data-match-id="${matchId}"] [data-court="${courtName}"]`,
      `tr:has-text("${matchId}") td:has-text("${courtName}")`,
      `.match-${matchId}:has-text("${courtName}")`,
      `.court-${courtName.replace(/\s+/g, '-')}:has-text("${matchId}")`
    ];

    let found = false;
    for (const selector of assignmentSelectors) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        found = true;
        break;
      }
    }

    expect(found).toBeTruthy();
    console.log(`✅ Match assignment verified: ${matchId} → ${courtName}`);
  }

  async changeCourtStatus(courtName: string, status: 'available' | 'occupied' | 'maintenance') {
    console.log(`🔄 Changing court status: ${courtName} → ${status}`);

    // Find court in the list
    const courtRow = this.page.locator(`tr:has-text("${courtName}"), .court-item:has-text("${courtName}")`);

    // Look for status dropdown or button
    const statusElement = courtRow.locator('select[name="status"], [data-testid="court-status"]');
    if (await statusElement.isVisible()) {
      await statusElement.selectOption(status);
    } else {
      // Look for status buttons
      const statusButton = courtRow.locator(`button:has-text("${status}")`, { hasText: new RegExp(status, 'i') });
      if (await statusButton.isVisible()) {
        await statusButton.click();
      }
    }

    await this.page.waitForTimeout(1000);
    console.log(`✅ Court status changed: ${courtName} → ${status}`);
  }

  private async navigateToCourtsSection(tournamentId: string) {
    await this.page.goto(`/tournaments/${tournamentId}`);
    await this.page.waitForLoadState('networkidle');

    // Look for courts tab
    const tabSelectors = [
      '[role="tab"]:has-text("Courts")',
      'button:has-text("Courts")',
      '[data-testid="courts-tab"]',
      'a[href*="courts"]'
    ];

    for (const selector of tabSelectors) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        await this.page.waitForTimeout(500);
        break;
      }
    }
  }

  private async navigateToSchedulingSection(tournamentId: string) {
    await this.page.goto(`/tournaments/${tournamentId}`);
    await this.page.waitForLoadState('networkidle');

    // Look for schedule/matches tab
    const tabSelectors = [
      '[role="tab"]:has-text("Schedule")',
      '[role="tab"]:has-text("Matches")',
      'button:has-text("Schedule")',
      'button:has-text("Matches")',
      '[data-testid="schedule-tab"]'
    ];

    for (const selector of tabSelectors) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        await this.page.waitForTimeout(500);
        break;
      }
    }
  }

  private async clickAddCourtButton() {
    const addCourtSelectors = [
      'button:has-text("Add Court")',
      'button:has-text("Create Court")',
      '[data-testid="add-court"]',
      '.add-court-btn'
    ];

    for (const selector of addCourtSelectors) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        await this.page.waitForTimeout(500);
        break;
      }
    }
  }

  private async fillCourtForm(courtData: CourtData) {
    // Court name
    const nameInput = this.page.locator('input[name="name"], input[placeholder*="name" i], #court-name').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill(courtData.name);
    }

    // Court number
    const numberInput = this.page.locator('input[name="courtNumber"], input[name="number"], #court-number').first();
    if (await numberInput.isVisible()) {
      await numberInput.fill(courtData.courtNumber.toString());
    }

    // Description (optional)
    if (courtData.description) {
      const descInput = this.page.locator('textarea[name="description"], input[name="description"], #court-description').first();
      if (await descInput.isVisible()) {
        await descInput.fill(courtData.description);
      }
    }

    await this.page.waitForTimeout(500);
  }

  private async saveCourt() {
    const saveButtons = [
      'button:has-text("Save")',
      'button:has-text("Add Court")',
      'button:has-text("Create")',
      'button[type="submit"]',
      '[data-testid="save-court"]'
    ];

    for (const selector of saveButtons) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        await this.page.waitForTimeout(1000);
        break;
      }
    }
  }
}