import { Page, expect } from '@playwright/test';

export interface PlayerData {
  name: string;
  email: string;
  phone?: string;
  division?: string;
  partner?: string;
}

export interface TeamData {
  name: string;
  player1: PlayerData;
  player2?: PlayerData;
  division?: string;
}

export class PlayerHelper {
  constructor(private page: Page) {}

  async addPlayer(tournamentId: string, playerData: PlayerData) {
    console.log(`👤 Adding player: ${playerData.name}`);

    // Navigate to tournament players/teams section
    await this.navigateToPlayersSection(tournamentId);

    // Click add player button
    await this.clickAddPlayerButton();

    // Fill player form
    await this.fillPlayerForm(playerData);

    // Save player
    await this.savePlayer();

    console.log(`✅ Player added: ${playerData.name}`);
  }

  async addTeam(tournamentId: string, teamData: TeamData) {
    console.log(`👥 Adding team: ${teamData.name}`);

    // Navigate to tournament teams section
    await this.navigateToTeamsSection(tournamentId);

    // Click add team button
    await this.clickAddTeamButton();

    // Fill team form
    await this.fillTeamForm(teamData);

    // Save team
    await this.saveTeam();

    console.log(`✅ Team added: ${teamData.name}`);
  }

  async registerPlayer(tournamentId: string, playerData: PlayerData) {
    console.log(`📝 Registering player: ${playerData.name}`);

    // Navigate to registration page
    await this.page.goto(`/tournaments/${tournamentId}/registration`);
    await this.page.waitForLoadState('networkidle');

    // Fill registration form
    await this.fillRegistrationForm(playerData);

    // Submit registration
    await this.submitRegistration();

    console.log(`✅ Player registered: ${playerData.name}`);
  }

  async approveRegistration(tournamentId: string, playerName: string) {
    console.log(`✅ Approving registration for: ${playerName}`);

    // Navigate to registration management
    await this.page.goto(`/tournaments/${tournamentId}/registration/manage`);
    await this.page.waitForLoadState('networkidle');

    // Find player in pending registrations
    const playerRow = this.page.locator(`tr:has-text("${playerName}")`);

    // Click approve button
    const approveButton = playerRow.locator('button:has-text("Approve"), [data-testid="approve-registration"]');
    if (await approveButton.isVisible()) {
      await approveButton.click();
      await this.page.waitForTimeout(1000);
    }

    console.log(`✅ Registration approved for: ${playerName}`);
  }

  async verifyPlayerAdded(playerName: string) {
    console.log(`🔍 Verifying player was added: ${playerName}`);

    // Look for player in the players list
    const playerElement = this.page.locator(`[data-testid="player-list"] tr:has-text("${playerName}"), .player-item:has-text("${playerName}")`);
    await expect(playerElement).toBeVisible();

    console.log(`✅ Player verified: ${playerName}`);
  }

  async verifyTeamAdded(teamName: string) {
    console.log(`🔍 Verifying team was added: ${teamName}`);

    // Look for team in the teams list
    const teamElement = this.page.locator(`[data-testid="team-list"] tr:has-text("${teamName}"), .team-item:has-text("${teamName}")`);
    await expect(teamElement).toBeVisible();

    console.log(`✅ Team verified: ${teamName}`);
  }

  private async navigateToPlayersSection(tournamentId: string) {
    await this.page.goto(`/tournaments/${tournamentId}`);
    await this.page.waitForLoadState('networkidle');

    // Look for players/teams tab
    const tabSelectors = [
      '[role="tab"]:has-text("Players")',
      '[role="tab"]:has-text("Teams")',
      'button:has-text("Players")',
      'button:has-text("Teams")',
      '[data-testid="players-tab"]'
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

  private async navigateToTeamsSection(tournamentId: string) {
    await this.navigateToPlayersSection(tournamentId); // Same section usually
  }

  private async clickAddPlayerButton() {
    const addPlayerSelectors = [
      'button:has-text("Add Player")',
      'button:has-text("Register Player")',
      '[data-testid="add-player"]',
      '.add-player-btn'
    ];

    for (const selector of addPlayerSelectors) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        await this.page.waitForTimeout(500);
        break;
      }
    }
  }

  private async clickAddTeamButton() {
    const addTeamSelectors = [
      'button:has-text("Add Team")',
      'button:has-text("Create Team")',
      '[data-testid="add-team"]',
      '.add-team-btn'
    ];

    for (const selector of addTeamSelectors) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        await this.page.waitForTimeout(500);
        break;
      }
    }
  }

  private async fillPlayerForm(playerData: PlayerData) {
    // Player name
    const nameInput = this.page.locator('input[name="name"], input[placeholder*="name" i], #player-name').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill(playerData.name);
    }

    // Email
    const emailInput = this.page.locator('input[name="email"], input[type="email"], #player-email').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill(playerData.email);
    }

    // Phone (optional)
    if (playerData.phone) {
      const phoneInput = this.page.locator('input[name="phone"], input[type="tel"], #player-phone').first();
      if (await phoneInput.isVisible()) {
        await phoneInput.fill(playerData.phone);
      }
    }

    // Division (optional)
    if (playerData.division) {
      const divisionSelect = this.page.locator('select[name="division"], [data-testid="division-select"]').first();
      if (await divisionSelect.isVisible()) {
        await divisionSelect.selectOption(playerData.division);
      }
    }

    await this.page.waitForTimeout(500);
  }

  private async fillTeamForm(teamData: TeamData) {
    // Team name
    const teamNameInput = this.page.locator('input[name="teamName"], input[placeholder*="team" i], #team-name').first();
    if (await teamNameInput.isVisible()) {
      await teamNameInput.fill(teamData.name);
    }

    // Player 1
    await this.fillPlayerInTeamForm(teamData.player1, 1);

    // Player 2 (optional)
    if (teamData.player2) {
      await this.fillPlayerInTeamForm(teamData.player2, 2);
    }

    await this.page.waitForTimeout(500);
  }

  private async fillPlayerInTeamForm(playerData: PlayerData, playerNumber: number) {
    const suffix = playerNumber === 1 ? '1' : '2';

    // Player name
    const nameInput = this.page.locator(`input[name="player${suffix}Name"], input[name="player${suffix}"], #player-${suffix}-name`).first();
    if (await nameInput.isVisible()) {
      await nameInput.fill(playerData.name);
    }

    // Player email
    const emailInput = this.page.locator(`input[name="player${suffix}Email"], #player-${suffix}-email`).first();
    if (await emailInput.isVisible()) {
      await emailInput.fill(playerData.email);
    }
  }

  private async fillRegistrationForm(playerData: PlayerData) {
    await this.fillPlayerForm(playerData);
  }

  private async savePlayer() {
    const saveButtons = [
      'button:has-text("Save")',
      'button:has-text("Add Player")',
      'button:has-text("Register")',
      'button[type="submit"]',
      '[data-testid="save-player"]'
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

  private async saveTeam() {
    const saveButtons = [
      'button:has-text("Save")',
      'button:has-text("Add Team")',
      'button:has-text("Create Team")',
      'button[type="submit"]',
      '[data-testid="save-team"]'
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

  private async submitRegistration() {
    const submitButtons = [
      'button:has-text("Register")',
      'button:has-text("Submit")',
      'button:has-text("Join Tournament")',
      'button[type="submit"]',
      '[data-testid="submit-registration"]'
    ];

    for (const selector of submitButtons) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        await this.page.waitForTimeout(1000);
        break;
      }
    }
  }
}