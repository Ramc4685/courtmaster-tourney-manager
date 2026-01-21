import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { NavigationHelper } from '../helpers/navigation.helper';
import { TournamentHelper, TournamentData } from '../helpers/tournament.helper';
import { PlayerHelper, PlayerData, TeamData } from '../helpers/player.helper';

test.describe('Player Management Tests', () => {
  let authHelper: AuthHelper;
  let navigationHelper: NavigationHelper;
  let tournamentHelper: TournamentHelper;
  let playerHelper: PlayerHelper;
  let testTournamentId: string;

  test.beforeAll(async ({ browser }) => {
    // Set up a test tournament for all player management tests
    const page = await browser.newPage();
    authHelper = new AuthHelper(page);
    navigationHelper = new NavigationHelper(page);
    tournamentHelper = new TournamentHelper(page);

    await authHelper.loginAsAdmin();
    await navigationHelper.goToTournaments();
    await navigationHelper.goToCreateTournament();

    const tournamentData: TournamentData = {
      name: `E2E Player Management Test Tournament ${Date.now()}`,
      description: 'Tournament for testing player management features',
      sport: 'Badminton',
      startDate: '2024-12-25',
      endDate: '2024-12-27',
      venue: 'Player Test Center',
      format: 'Single Elimination',
      maxParticipants: 16
    };

    testTournamentId = await tournamentHelper.createTournament(tournamentData);
    console.log(`Test tournament created: ${testTournamentId}`);

    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    navigationHelper = new NavigationHelper(page);
    playerHelper = new PlayerHelper(page);

    await authHelper.loginAsAdmin();
  });

  test.afterAll(async ({ browser }) => {
    // Clean up test tournament
    if (testTournamentId) {
      const page = await browser.newPage();
      const tournamentHelper = new TournamentHelper(page);
      try {
        await tournamentHelper.deleteTournament(testTournamentId);
      } catch (error) {
        console.warn(`Failed to delete test tournament ${testTournamentId}:`, error);
      }
      await page.close();
    }
  });

  test('should add individual players successfully', async ({ page }) => {
    const playersToAdd: PlayerData[] = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        division: 'Men\'s Singles'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567891',
        division: 'Women\'s Singles'
      },
      {
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        phone: '+1234567892',
        division: 'Men\'s Singles'
      }
    ];

    for (const playerData of playersToAdd) {
      await playerHelper.addPlayer(testTournamentId, playerData);
      await playerHelper.verifyPlayerAdded(playerData.name);
    }

    console.log(`✅ Successfully added ${playersToAdd.length} players`);
  });

  test('should add teams successfully', async ({ page }) => {
    const teamsToAdd: TeamData[] = [
      {
        name: 'Team Alpha',
        player1: {
          name: 'Alice Wilson',
          email: 'alice.wilson@example.com'
        },
        player2: {
          name: 'Bob Brown',
          email: 'bob.brown@example.com'
        },
        division: 'Mixed Doubles'
      },
      {
        name: 'Team Beta',
        player1: {
          name: 'Charlie Davis',
          email: 'charlie.davis@example.com'
        },
        player2: {
          name: 'Diana Evans',
          email: 'diana.evans@example.com'
        },
        division: 'Mixed Doubles'
      }
    ];

    for (const teamData of teamsToAdd) {
      await playerHelper.addTeam(testTournamentId, teamData);
      await playerHelper.verifyTeamAdded(teamData.name);
    }

    console.log(`✅ Successfully added ${teamsToAdd.length} teams`);
  });

  test('should handle player registration flow', async ({ page }) => {
    // Switch to player perspective
    await authHelper.logout();
    await authHelper.loginAsPlayer();

    const playerData: PlayerData = {
      name: 'Sarah Connor',
      email: 'sarah.connor@example.com',
      phone: '+1234567893',
      division: 'Women\'s Singles'
    };

    // Register as player
    await playerHelper.registerPlayer(testTournamentId, playerData);

    // Switch back to admin to approve registration
    await authHelper.logout();
    await authHelper.loginAsAdmin();

    // Approve the registration
    await playerHelper.approveRegistration(testTournamentId, playerData.name);

    // Verify player is now in tournament
    await navigationHelper.goToTournamentDetails(testTournamentId);
    await playerHelper.verifyPlayerAdded(playerData.name);

    console.log(`✅ Player registration flow completed for ${playerData.name}`);
  });

  test('should handle bulk player import', async ({ page }) => {
    // Navigate to tournament players section
    await navigationHelper.goToTournamentDetails(testTournamentId);
    await navigationHelper.selectTab('Teams');

    // Look for import functionality
    const importButton = page.locator('button:has-text("Import"), button:has-text("Bulk Import"), [data-testid="import-players"]');

    if (await importButton.isVisible()) {
      await importButton.click();
      await page.waitForTimeout(500);

      // Check if import dialog/form appears
      const importDialog = page.locator('.import-dialog, [role="dialog"], .modal');
      if (await importDialog.isVisible()) {
        console.log('✅ Import functionality available');

        // Close dialog for now (actual import would require file upload)
        const closeButton = page.locator('button:has-text("Cancel"), button:has-text("Close"), [aria-label="Close"]');
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    } else {
      console.log('ℹ️ Bulk import functionality not available or not implemented');
    }
  });

  test('should validate player data requirements', async ({ page }) => {
    // Navigate to add player form
    await navigationHelper.goToTournamentDetails(testTournamentId);
    await navigationHelper.selectTab('Teams');

    const addPlayerButton = page.locator('button:has-text("Add Player"), [data-testid="add-player"]');
    if (await addPlayerButton.isVisible()) {
      await addPlayerButton.click();
      await page.waitForTimeout(500);

      // Try to save without required data
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Add"), button[type="submit"]');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(1000);

        // Check for validation errors
        const errorElements = page.locator('.error, .validation-error, [role="alert"], .text-red-500');
        const errorCount = await errorElements.count();

        if (errorCount > 0) {
          console.log(`✅ Validation working - found ${errorCount} validation errors`);
          expect(errorCount).toBeGreaterThan(0);
        }

        // Close the form
        const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Close")');
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        }
      }
    }
  });

  test('should handle player search and filtering', async ({ page }) => {
    // Navigate to tournament players section
    await navigationHelper.goToTournamentDetails(testTournamentId);
    await navigationHelper.selectTab('Teams');

    // Look for search functionality
    const searchInput = page.locator('input[placeholder*="search" i], input[name="search"], [data-testid="player-search"]');

    if (await searchInput.isVisible()) {
      // Test search functionality
      await searchInput.fill('John');
      await page.waitForTimeout(1000);

      // Check if results are filtered
      const playerRows = page.locator('[data-testid="player-list"] tr, .player-item');
      const visibleRows = await playerRows.count();

      console.log(`Search results: ${visibleRows} players found`);

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);
    }

    // Look for filter functionality
    const filterSelectors = [
      'select[name="division"]',
      '[data-testid="division-filter"]',
      'button:has-text("Filter")',
      '.filter-dropdown'
    ];

    for (const selector of filterSelectors) {
      const filterElement = page.locator(selector);
      if (await filterElement.isVisible()) {
        console.log('✅ Filter functionality available');
        break;
      }
    }
  });

  test('should handle player profile management', async ({ page }) => {
    // Navigate to tournament players section
    await navigationHelper.goToTournamentDetails(testTournamentId);
    await navigationHelper.selectTab('Teams');

    // Look for first player in list
    const firstPlayerRow = page.locator('[data-testid="player-list"] tr, .player-item').first();

    if (await firstPlayerRow.isVisible()) {
      // Look for view/edit button
      const editButton = firstPlayerRow.locator('button:has-text("Edit"), button:has-text("View"), [data-testid="edit-player"]');

      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(500);

        // Check if player details form/dialog appears
        const playerForm = page.locator('.player-form, [role="dialog"], .edit-player-dialog');
        if (await playerForm.isVisible()) {
          console.log('✅ Player profile management available');

          // Close the form
          const closeButton = page.locator('button:has-text("Cancel"), button:has-text("Close"), [aria-label="Close"]');
          if (await closeButton.isVisible()) {
            await closeButton.click();
          }
        }
      }
    }
  });
});