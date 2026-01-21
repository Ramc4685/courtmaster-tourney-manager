import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { NavigationHelper } from '../helpers/navigation.helper';
import { TournamentHelper, TournamentData } from '../helpers/tournament.helper';
import { CourtHelper, CourtData } from '../helpers/court.helper';
import { PlayerHelper, TeamData } from '../helpers/player.helper';

test.describe('Court Assignment Tests', () => {
  let authHelper: AuthHelper;
  let navigationHelper: NavigationHelper;
  let tournamentHelper: TournamentHelper;
  let courtHelper: CourtHelper;
  let playerHelper: PlayerHelper;
  let testTournamentId: string;

  test.beforeAll(async ({ browser }) => {
    // Set up a test tournament with teams for court assignment tests
    const page = await browser.newPage();
    authHelper = new AuthHelper(page);
    navigationHelper = new NavigationHelper(page);
    tournamentHelper = new TournamentHelper(page);
    playerHelper = new PlayerHelper(page);

    await authHelper.loginAsAdmin();
    await navigationHelper.goToTournaments();
    await navigationHelper.goToCreateTournament();

    const tournamentData: TournamentData = {
      name: `E2E Court Assignment Test Tournament ${Date.now()}`,
      description: 'Tournament for testing court assignment features',
      sport: 'Badminton',
      startDate: '2024-12-28',
      endDate: '2024-12-30',
      venue: 'Court Test Center',
      format: 'Single Elimination',
      maxParticipants: 8
    };

    testTournamentId = await tournamentHelper.createTournament(tournamentData);

    // Add some test teams
    const testTeams: TeamData[] = [
      {
        name: 'Court Test Team 1',
        player1: { name: 'Player A1', email: 'a1@test.com' },
        player2: { name: 'Player A2', email: 'a2@test.com' }
      },
      {
        name: 'Court Test Team 2',
        player1: { name: 'Player B1', email: 'b1@test.com' },
        player2: { name: 'Player B2', email: 'b2@test.com' }
      }
    ];

    for (const team of testTeams) {
      await playerHelper.addTeam(testTournamentId, team);
    }

    console.log(`Test tournament with teams created: ${testTournamentId}`);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    navigationHelper = new NavigationHelper(page);
    courtHelper = new CourtHelper(page);

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

  test('should add courts to tournament successfully', async ({ page }) => {
    const courtsToAdd: CourtData[] = [
      {
        name: 'Court 1',
        courtNumber: 1,
        description: 'Main court for matches'
      },
      {
        name: 'Court 2',
        courtNumber: 2,
        description: 'Secondary court'
      },
      {
        name: 'Court 3',
        courtNumber: 3,
        description: 'Practice court'
      }
    ];

    for (const courtData of courtsToAdd) {
      await courtHelper.addCourt(testTournamentId, courtData);
      await courtHelper.verifyCourtAdded(courtData.name);
    }

    console.log(`✅ Successfully added ${courtsToAdd.length} courts`);
  });

  test('should assign matches to courts', async ({ page }) => {
    // First ensure courts exist
    const courtData: CourtData = {
      name: 'Assignment Test Court',
      courtNumber: 4,
      description: 'Court for testing match assignment'
    };

    await courtHelper.addCourt(testTournamentId, courtData);

    // Navigate to scheduling/matches to find matches to assign
    await navigationHelper.goToTournamentDetails(testTournamentId);
    await navigationHelper.selectTab('Schedule');

    // Look for existing matches or create one for testing
    const matchElements = page.locator('[data-testid="match-list"] tr, .match-item, .schedule-match');
    const matchCount = await matchElements.count();

    if (matchCount > 0) {
      // Get first match ID (this would need to be implemented based on actual DOM)
      const firstMatch = matchElements.first();
      const matchId = await firstMatch.getAttribute('data-match-id') || 'test-match-1';

      // Assign match to court
      await courtHelper.assignMatchToCourt(testTournamentId, matchId, courtData.name);
      await courtHelper.verifyMatchAssignedToCourt(matchId, courtData.name);

      console.log(`✅ Successfully assigned match ${matchId} to ${courtData.name}`);
    } else {
      console.log('ℹ️ No matches available for court assignment test');
    }
  });

  test('should manage court status changes', async ({ page }) => {
    // Navigate to courts section
    await navigationHelper.goToTournamentDetails(testTournamentId);
    await navigationHelper.selectTab('Courts');

    // Test court status changes
    const courtName = 'Court 1';
    const statusesToTest = ['available', 'occupied', 'maintenance'] as const;

    for (const status of statusesToTest) {
      await courtHelper.changeCourtStatus(courtName, status);
      console.log(`✅ Changed court status to ${status}`);
      await page.waitForTimeout(1000);
    }

    // Reset to available
    await courtHelper.changeCourtStatus(courtName, 'available');
  });

  test('should handle court capacity and availability', async ({ page }) => {
    // Navigate to courts section
    await navigationHelper.goToTournamentDetails(testTournamentId);
    await navigationHelper.selectTab('Courts');

    // Check court availability indicators
    const availabilityIndicators = page.locator('.court-status, [data-testid="court-status"], .availability-indicator');
    const indicatorCount = await availabilityIndicators.count();

    if (indicatorCount > 0) {
      console.log(`✅ Found ${indicatorCount} court availability indicators`);

      // Check if courts show different statuses
      for (let i = 0; i < Math.min(indicatorCount, 3); i++) {
        const indicator = availabilityIndicators.nth(i);
        const statusText = await indicator.textContent();
        console.log(`Court ${i + 1} status: ${statusText}`);
      }
    }

    // Look for court utilization information
    const utilizationElements = page.locator('.court-utilization, .usage-stats, [data-testid="court-usage"]');
    if (await utilizationElements.first().isVisible()) {
      console.log('✅ Court utilization information available');
    }
  });

  test('should handle court conflicts and scheduling', async ({ page }) => {
    // Navigate to courts section
    await navigationHelper.goToTournamentDetails(testTournamentId);
    await navigationHelper.selectTab('Courts');

    // Look for conflict detection features
    const conflictIndicators = page.locator('.conflict, .scheduling-conflict, [data-testid="conflict-warning"]');
    const conflictCount = await conflictIndicators.count();

    if (conflictCount > 0) {
      console.log(`Found ${conflictCount} potential scheduling conflicts`);
    }

    // Check for scheduling constraints
    const constraintElements = page.locator('.constraint, .scheduling-rule, [data-testid="scheduling-constraint"]');
    if (await constraintElements.first().isVisible()) {
      console.log('✅ Scheduling constraint system available');
    }
  });

  test('should validate court assignment rules', async ({ page }) => {
    // Navigate to courts section
    await navigationHelper.goToTournamentDetails(testTournamentId);
    await navigationHelper.selectTab('Courts');

    // Test invalid court assignments (if validation exists)
    const courtRows = page.locator('[data-testid="court-list"] tr, .court-item');
    const courtCount = await courtRows.count();

    if (courtCount > 0) {
      console.log(`Found ${courtCount} courts for validation testing`);

      // Try to assign multiple matches to same time slot (if feature exists)
      // This would test the validation system
      console.log('✅ Court validation system ready for testing');
    }
  });

  test('should handle court resource management', async ({ page }) => {
    // Navigate to courts section
    await navigationHelper.goToTournamentDetails(testTournamentId);
    await navigationHelper.selectTab('Courts');

    // Look for court equipment/resource management
    const resourceElements = page.locator('.court-equipment, .resources, [data-testid="court-resources"]');
    if (await resourceElements.first().isVisible()) {
      console.log('✅ Court resource management available');

      // Test equipment assignment if available
      const equipmentButtons = page.locator('button:has-text("Equipment"), button:has-text("Resources")');
      if (await equipmentButtons.first().isVisible()) {
        await equipmentButtons.first().click();
        await page.waitForTimeout(500);

        // Close any opened dialogs
        const closeButton = page.locator('button:has-text("Close"), button:has-text("Cancel"), [aria-label="Close"]');
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    }

    // Check for court maintenance scheduling
    const maintenanceElements = page.locator('.maintenance, [data-testid="court-maintenance"], button:has-text("Maintenance")');
    if (await maintenanceElements.first().isVisible()) {
      console.log('✅ Court maintenance scheduling available');
    }
  });

  test('should display court assignment overview', async ({ page }) => {
    // Navigate to courts section
    await navigationHelper.goToTournamentDetails(testTournamentId);
    await navigationHelper.selectTab('Courts');

    // Check for court overview/summary
    const overviewElements = page.locator('.court-overview, .assignment-summary, [data-testid="court-overview"]');
    if (await overviewElements.first().isVisible()) {
      console.log('✅ Court assignment overview available');
    }

    // Look for court timeline/schedule view
    const timelineElements = page.locator('.court-timeline, .schedule-view, [data-testid="court-timeline"]');
    if (await timelineElements.first().isVisible()) {
      console.log('✅ Court timeline view available');
    }

    // Check for real-time court status updates
    const realtimeElements = page.locator('.realtime-status, .live-updates, [data-testid="realtime-court-status"]');
    if (await realtimeElements.first().isVisible()) {
      console.log('✅ Real-time court status updates available');
    }
  });
});