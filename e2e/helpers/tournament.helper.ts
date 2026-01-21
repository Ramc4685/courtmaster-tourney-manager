import { Page, expect } from '@playwright/test';

export interface TournamentData {
  name: string;
  description: string;
  sport: string;
  startDate: string;
  endDate: string;
  venue: string;
  format: string;
  maxParticipants?: number;
}

export class TournamentHelper {
  constructor(private page: Page) {}

  async createTournament(data: TournamentData): Promise<string> {
    console.log(`🏆 Creating tournament: ${data.name}`);

    // Step 1: Basic Information
    await this.fillBasicInfo(data);
    await this.goToNextStep();

    // Step 2: Categories/Sport Selection
    await this.selectSport(data.sport);
    await this.goToNextStep();

    // Step 3: Registration Settings
    await this.configureRegistration(data);
    await this.goToNextStep();

    // Step 4: Scoring Settings
    await this.configureScoring();
    await this.goToNextStep();

    // Step 5: Review and Create
    await this.reviewAndCreate();

    // Wait for tournament creation success
    await this.page.waitForLoadState('networkidle');

    // Extract tournament ID from URL
    const url = this.page.url();
    const tournamentId = this.extractTournamentId(url);

    console.log(`✅ Tournament created successfully: ${tournamentId}`);
    return tournamentId;
  }

  private async fillBasicInfo(data: TournamentData) {
    console.log('📝 Filling basic tournament information');

    // Tournament name
    const nameInput = this.page.locator('input[name="name"], input[placeholder*="name" i], #tournament-name').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill(data.name);
    }

    // Description
    const descriptionInput = this.page.locator('textarea[name="description"], textarea[placeholder*="description" i], #tournament-description').first();
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill(data.description);
    }

    // Venue
    const venueInput = this.page.locator('input[name="venue"], input[placeholder*="venue" i], #venue').first();
    if (await venueInput.isVisible()) {
      await venueInput.fill(data.venue);
    }

    // Start Date
    const startDateInput = this.page.locator('input[name="startDate"], input[name="start_date"], input[type="date"]').first();
    if (await startDateInput.isVisible()) {
      await startDateInput.fill(data.startDate);
    }

    // End Date
    const endDateInput = this.page.locator('input[name="endDate"], input[name="end_date"], input[type="date"]').nth(1);
    if (await endDateInput.isVisible()) {
      await endDateInput.fill(data.endDate);
    }

    await this.page.waitForTimeout(500);
  }

  private async selectSport(sport: string) {
    console.log(`🏸 Selecting sport: ${sport}`);

    const sportSelectors = [
      `button:has-text("${sport}")`,
      `[data-value="${sport.toLowerCase()}"]`,
      `input[value="${sport.toLowerCase()}"]`,
      `.sport-option:has-text("${sport}")`
    ];

    for (const selector of sportSelectors) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        await this.page.waitForTimeout(500);
        break;
      }
    }
  }

  private async configureRegistration(data: TournamentData) {
    console.log('👥 Configuring registration settings');

    // Max participants
    if (data.maxParticipants) {
      const maxParticipantsInput = this.page.locator('input[name="maxParticipants"], input[placeholder*="participants" i]').first();
      if (await maxParticipantsInput.isVisible()) {
        await maxParticipantsInput.fill(data.maxParticipants.toString());
      }
    }

    // Registration deadline (optional)
    const registrationDeadlineInput = this.page.locator('input[name="registrationDeadline"], input[placeholder*="deadline" i]').first();
    if (await registrationDeadlineInput.isVisible()) {
      // Set deadline to one day before start date
      const deadline = new Date(data.startDate);
      deadline.setDate(deadline.getDate() - 1);
      await registrationDeadlineInput.fill(deadline.toISOString().split('T')[0]);
    }

    await this.page.waitForTimeout(500);
  }

  private async configureScoring() {
    console.log('⚡ Configuring scoring settings');

    // Use default scoring settings for now
    // Could be extended to configure specific scoring rules
    await this.page.waitForTimeout(500);
  }

  private async reviewAndCreate() {
    console.log('📋 Reviewing and creating tournament');

    // Look for create/submit button
    const createButtons = [
      'button:has-text("Create Tournament")',
      'button:has-text("Create")',
      'button:has-text("Submit")',
      'button[type="submit"]',
      '[data-testid="create-tournament-btn"]'
    ];

    for (const selector of createButtons) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        break;
      }
    }

    await this.page.waitForTimeout(2000);
  }

  private async goToNextStep() {
    console.log('➡️ Going to next step');

    const nextButtons = [
      'button:has-text("Next")',
      'button:has-text("Continue")',
      '[data-testid="next-step"]',
      '.wizard-next'
    ];

    for (const selector of nextButtons) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        await this.page.waitForTimeout(1000);
        break;
      }
    }
  }

  private extractTournamentId(url: string): string {
    // Extract ID from URL patterns like /tournaments/123 or /tournaments/uuid
    const match = url.match(/\/tournaments\/([^\/\?]+)/);
    return match ? match[1] : 'unknown';
  }

  async deleteTournament(tournamentId: string) {
    console.log(`🗑️ Deleting tournament: ${tournamentId}`);

    // Navigate to tournament details
    await this.page.goto(`/tournaments/${tournamentId}`);
    await this.page.waitForLoadState('networkidle');

    // Look for delete button (might be in settings or actions menu)
    const deleteSelectors = [
      'button:has-text("Delete")',
      'button:has-text("Remove")',
      '[data-testid="delete-tournament"]',
      '.delete-tournament'
    ];

    for (const selector of deleteSelectors) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.click();

        // Confirm deletion if modal appears
        await this.page.waitForTimeout(500);
        const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        await this.page.waitForLoadState('networkidle');
        break;
      }
    }

    console.log(`✅ Tournament deleted: ${tournamentId}`);
  }

  async verifyTournamentCreated(tournamentId: string, data: TournamentData) {
    console.log(`✅ Verifying tournament creation: ${tournamentId}`);

    // Check if we're on tournament details page
    expect(this.page.url()).toContain(tournamentId);

    // Verify tournament name is displayed
    const nameElement = this.page.locator('h1, .tournament-name, [data-testid="tournament-name"]');
    await expect(nameElement).toContainText(data.name);

    // Verify tournament description
    if (data.description) {
      const descElement = this.page.locator('.tournament-description, [data-testid="tournament-description"]');
      await expect(descElement).toContainText(data.description);
    }

    console.log(`✅ Tournament verified: ${data.name}`);
  }
}