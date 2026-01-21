import { Page, expect } from '@playwright/test';

export interface MatchData {
  team1: string;
  team2: string;
  court?: string;
  time?: string;
  round?: string;
}

export class SchedulingHelper {
  constructor(private page: Page) {}

  async generateSchedule(tournamentId: string) {
    console.log(`📅 Generating schedule for tournament: ${tournamentId}`);

    // Navigate to scheduling section
    await this.navigateToScheduling(tournamentId);

    // Look for auto-generate schedule button
    const generateButtons = [
      'button:has-text("Generate Schedule")',
      'button:has-text("Auto Schedule")',
      'button:has-text("Create Matches")',
      '[data-testid="generate-schedule"]',
      '.auto-schedule-btn'
    ];

    for (const selector of generateButtons) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        await this.page.waitForTimeout(2000); // Schedule generation might take time
        break;
      }
    }

    // Confirm generation if modal appears
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Generate"), button:has-text("Yes")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
      await this.page.waitForTimeout(3000);
    }

    console.log(`✅ Schedule generated for tournament: ${tournamentId}`);
  }

  async scheduleManualMatch(tournamentId: string, matchData: MatchData) {
    console.log(`📝 Scheduling manual match: ${matchData.team1} vs ${matchData.team2}`);

    // Navigate to scheduling section
    await this.navigateToScheduling(tournamentId);

    // Click add/schedule match button
    await this.clickScheduleMatchButton();

    // Fill match details
    await this.fillMatchForm(matchData);

    // Save match
    await this.saveMatch();

    console.log(`✅ Match scheduled: ${matchData.team1} vs ${matchData.team2}`);
  }

  async rescheduleMatch(matchId: string, newTime: string, newCourt?: string) {
    console.log(`🔄 Rescheduling match: ${matchId}`);

    // Find match in schedule
    const matchElement = this.page.locator(`[data-match-id="${matchId}"], tr:has-text("${matchId}")`);

    // Click edit/reschedule button
    const editButton = matchElement.locator('button:has-text("Edit"), button:has-text("Reschedule"), [data-testid="edit-match"]');
    if (await editButton.isVisible()) {
      await editButton.click();
      await this.page.waitForTimeout(500);
    }

    // Update time
    const timeInput = this.page.locator('input[name="time"], input[type="time"], input[type="datetime-local"]');
    if (await timeInput.isVisible()) {
      await timeInput.fill(newTime);
    }

    // Update court if provided
    if (newCourt) {
      const courtSelect = this.page.locator('select[name="court"], [data-testid="court-select"]');
      if (await courtSelect.isVisible()) {
        await courtSelect.selectOption(newCourt);
      }
    }

    // Save changes
    const saveButton = this.page.locator('button:has-text("Save"), button:has-text("Update")');
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await this.page.waitForTimeout(1000);
    }

    console.log(`✅ Match rescheduled: ${matchId}`);
  }

  async verifyScheduleGenerated(tournamentId: string) {
    console.log(`🔍 Verifying schedule was generated`);

    // Navigate to schedule view
    await this.navigateToScheduling(tournamentId);

    // Check for matches in schedule
    const matchSelectors = [
      '[data-testid="match-list"] tr',
      '.match-item',
      '.schedule-match',
      'table tbody tr'
    ];

    let matchesFound = false;
    for (const selector of matchSelectors) {
      const matches = this.page.locator(selector);
      const count = await matches.count();
      if (count > 0) {
        matchesFound = true;
        console.log(`Found ${count} matches in schedule`);
        break;
      }
    }

    expect(matchesFound).toBeTruthy();
    console.log(`✅ Schedule verification completed`);
  }

  async verifyMatchScheduled(matchData: MatchData) {
    console.log(`🔍 Verifying match was scheduled: ${matchData.team1} vs ${matchData.team2}`);

    // Look for match in schedule
    const matchSelectors = [
      `tr:has-text("${matchData.team1}"):has-text("${matchData.team2}")`,
      `.match-item:has-text("${matchData.team1}"):has-text("${matchData.team2}")`,
      `[data-team1="${matchData.team1}"][data-team2="${matchData.team2}"]`
    ];

    let matchFound = false;
    for (const selector of matchSelectors) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        matchFound = true;
        break;
      }
    }

    expect(matchFound).toBeTruthy();
    console.log(`✅ Match verified: ${matchData.team1} vs ${matchData.team2}`);
  }

  async getMatchId(team1: string, team2: string): Promise<string> {
    // Find match element and extract ID
    const matchElement = this.page.locator(`tr:has-text("${team1}"):has-text("${team2}")`);

    // Try to get match ID from data attribute
    const matchId = await matchElement.getAttribute('data-match-id');
    if (matchId) {
      return matchId;
    }

    // Try to extract from other attributes or text content
    const idElement = matchElement.locator('[data-testid*="match-"], .match-id');
    if (await idElement.isVisible()) {
      const idText = await idElement.textContent();
      return idText?.trim() || 'unknown';
    }

    return 'unknown';
  }

  private async navigateToScheduling(tournamentId: string) {
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

  private async clickScheduleMatchButton() {
    const scheduleButtons = [
      'button:has-text("Schedule Match")',
      'button:has-text("Add Match")',
      'button:has-text("Create Match")',
      '[data-testid="schedule-match"]',
      '.schedule-match-btn'
    ];

    for (const selector of scheduleButtons) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        await this.page.waitForTimeout(500);
        break;
      }
    }
  }

  private async fillMatchForm(matchData: MatchData) {
    // Team 1
    const team1Select = this.page.locator('select[name="team1"], [data-testid="team1-select"]');
    if (await team1Select.isVisible()) {
      await team1Select.selectOption(matchData.team1);
    }

    // Team 2
    const team2Select = this.page.locator('select[name="team2"], [data-testid="team2-select"]');
    if (await team2Select.isVisible()) {
      await team2Select.selectOption(matchData.team2);
    }

    // Court (optional)
    if (matchData.court) {
      const courtSelect = this.page.locator('select[name="court"], [data-testid="court-select"]');
      if (await courtSelect.isVisible()) {
        await courtSelect.selectOption(matchData.court);
      }
    }

    // Time (optional)
    if (matchData.time) {
      const timeInput = this.page.locator('input[name="time"], input[type="time"], input[type="datetime-local"]');
      if (await timeInput.isVisible()) {
        await timeInput.fill(matchData.time);
      }
    }

    // Round (optional)
    if (matchData.round) {
      const roundSelect = this.page.locator('select[name="round"], [data-testid="round-select"]');
      if (await roundSelect.isVisible()) {
        await roundSelect.selectOption(matchData.round);
      }
    }

    await this.page.waitForTimeout(500);
  }

  private async saveMatch() {
    const saveButtons = [
      'button:has-text("Save")',
      'button:has-text("Schedule")',
      'button:has-text("Create Match")',
      'button[type="submit"]',
      '[data-testid="save-match"]'
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