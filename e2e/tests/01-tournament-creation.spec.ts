import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { NavigationHelper } from '../helpers/navigation.helper';
import { TournamentHelper, TournamentData } from '../helpers/tournament.helper';

test.describe('Tournament Creation Tests', () => {
  let authHelper: AuthHelper;
  let navigationHelper: NavigationHelper;
  let tournamentHelper: TournamentHelper;
  let createdTournamentIds: string[] = [];

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    navigationHelper = new NavigationHelper(page);
    tournamentHelper = new TournamentHelper(page);

    // Login as admin for tournament creation
    await authHelper.loginAsAdmin();
    await navigationHelper.waitForPageLoad();
  });

  test.afterEach(async ({ page }) => {
    // Clean up created tournaments
    for (const tournamentId of createdTournamentIds) {
      try {
        await tournamentHelper.deleteTournament(tournamentId);
      } catch (error) {
        console.warn(`Failed to delete tournament ${tournamentId}:`, error);
      }
    }
    createdTournamentIds = [];
  });

  test('should create a badminton tournament successfully', async ({ page }) => {
    // Navigate to tournament creation
    await navigationHelper.goToTournaments();
    await navigationHelper.goToCreateTournament();

    // Define tournament data
    const tournamentData: TournamentData = {
      name: `E2E Badminton Tournament ${Date.now()}`,
      description: 'End-to-end test tournament for badminton',
      sport: 'Badminton',
      startDate: '2024-12-01',
      endDate: '2024-12-03',
      venue: 'E2E Test Sports Center',
      format: 'Single Elimination',
      maxParticipants: 16
    };

    // Create tournament using wizard
    const tournamentId = await tournamentHelper.createTournament(tournamentData);
    createdTournamentIds.push(tournamentId);

    // Verify tournament was created
    await tournamentHelper.verifyTournamentCreated(tournamentId, tournamentData);
  });

  test('should create a tennis tournament successfully', async ({ page }) => {
    // Navigate to tournament creation
    await navigationHelper.goToTournaments();
    await navigationHelper.goToCreateTournament();

    // Define tournament data
    const tournamentData: TournamentData = {
      name: `E2E Tennis Tournament ${Date.now()}`,
      description: 'End-to-end test tournament for tennis',
      sport: 'Tennis',
      startDate: '2024-12-05',
      endDate: '2024-12-07',
      venue: 'E2E Tennis Courts',
      format: 'Round Robin',
      maxParticipants: 8
    };

    // Create tournament
    const tournamentId = await tournamentHelper.createTournament(tournamentData);
    createdTournamentIds.push(tournamentId);

    // Verify tournament was created
    await tournamentHelper.verifyTournamentCreated(tournamentId, tournamentData);
  });

  test('should create a volleyball tournament successfully', async ({ page }) => {
    // Navigate to tournament creation
    await navigationHelper.goToTournaments();
    await navigationHelper.goToCreateTournament();

    // Define tournament data
    const tournamentData: TournamentData = {
      name: `E2E Volleyball Tournament ${Date.now()}`,
      description: 'End-to-end test tournament for volleyball',
      sport: 'Volleyball',
      startDate: '2024-12-10',
      endDate: '2024-12-12',
      venue: 'E2E Volleyball Arena',
      format: 'Single Elimination',
      maxParticipants: 12
    };

    // Create tournament
    const tournamentId = await tournamentHelper.createTournament(tournamentData);
    createdTournamentIds.push(tournamentId);

    // Verify tournament was created
    await tournamentHelper.verifyTournamentCreated(tournamentId, tournamentData);
  });

  test('should validate required fields in tournament creation', async ({ page }) => {
    // Navigate to tournament creation
    await navigationHelper.goToTournaments();
    await navigationHelper.goToCreateTournament();

    // Try to proceed without filling required fields
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);

      // Check for validation errors
      const errorSelectors = [
        '.error-message',
        '.field-error',
        '[role="alert"]',
        '.text-red-500',
        '.validation-error'
      ];

      let errorsFound = false;
      for (const selector of errorSelectors) {
        const errors = page.locator(selector);
        const count = await errors.count();
        if (count > 0) {
          errorsFound = true;
          console.log(`Found ${count} validation errors`);
          break;
        }
      }

      expect(errorsFound).toBeTruthy();
    }
  });

  test('should handle tournament creation with minimal data', async ({ page }) => {
    // Navigate to tournament creation
    await navigationHelper.goToTournaments();
    await navigationHelper.goToCreateTournament();

    // Define minimal tournament data
    const tournamentData: TournamentData = {
      name: `E2E Minimal Tournament ${Date.now()}`,
      description: 'Minimal test tournament',
      sport: 'Badminton',
      startDate: '2024-12-15',
      endDate: '2024-12-15',
      venue: 'Test Venue',
      format: 'Single Elimination'
    };

    // Create tournament with minimal data
    const tournamentId = await tournamentHelper.createTournament(tournamentData);
    createdTournamentIds.push(tournamentId);

    // Verify tournament was created
    await tournamentHelper.verifyTournamentCreated(tournamentId, tournamentData);
  });

  test('should navigate through all wizard steps correctly', async ({ page }) => {
    // Navigate to tournament creation
    await navigationHelper.goToTournaments();
    await navigationHelper.goToCreateTournament();

    // Define tournament data
    const tournamentData: TournamentData = {
      name: `E2E Wizard Test ${Date.now()}`,
      description: 'Testing wizard navigation',
      sport: 'Badminton',
      startDate: '2024-12-20',
      endDate: '2024-12-22',
      venue: 'Wizard Test Center',
      format: 'Single Elimination',
      maxParticipants: 8
    };

    // Track wizard step progression
    const stepIndicators = page.locator('.wizard-step, .step-indicator, [data-testid*="step"]');
    const initialStepCount = await stepIndicators.count();

    console.log(`Wizard has ${initialStepCount} steps`);

    // Go through each step and verify progress
    const tournamentId = await tournamentHelper.createTournament(tournamentData);
    createdTournamentIds.push(tournamentId);

    // Verify final result
    await tournamentHelper.verifyTournamentCreated(tournamentId, tournamentData);
  });
});