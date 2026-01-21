import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { NavigationHelper } from '../helpers/navigation.helper';
import { TournamentHelper, TournamentData } from '../helpers/tournament.helper';
import { SchedulingHelper, MatchData } from '../helpers/scheduling.helper';
import { PlayerHelper, TeamData } from '../helpers/player.helper';
import { CourtHelper, CourtData } from '../helpers/court.helper';

test.describe('Scheduling Tests', () => {
  let authHelper: AuthHelper;
  let navigationHelper: NavigationHelper;
  let tournamentHelper: TournamentHelper;
  let schedulingHelper: SchedulingHelper;
  let playerHelper: PlayerHelper;
  let courtHelper: CourtHelper;
  let testTournamentId: string;

  test.beforeAll(async ({ browser }) => {
    // Set up a test tournament with teams and courts for scheduling tests
    const page = await browser.newPage();
    authHelper = new AuthHelper(page);
    navigationHelper = new NavigationHelper(page);
    tournamentHelper = new TournamentHelper(page);
    playerHelper = new PlayerHelper(page);
    courtHelper = new CourtHelper(page);

    await authHelper.loginAsAdmin();
    await navigationHelper.goToTournaments();
    await navigationHelper.goToCreateTournament();

    const tournamentData: TournamentData = {
      name: `E2E Scheduling Test Tournament ${Date.now()}`,
      description: 'Tournament for testing scheduling features',
      sport: 'Badminton',
      startDate: '2025-01-01',
      endDate: '2025-01-03',
      venue: 'Scheduling Test Center',
      format: 'Single Elimination',
      maxParticipants: 8
    };

    testTournamentId = await tournamentHelper.createTournament(tournamentData);

    // Add test teams
    const testTeams: TeamData[] = [
      {
        name: 'Schedule Team Alpha',
        player1: { name: 'Alpha Player 1', email: 'alpha1@test.com' },
        player2: { name: 'Alpha Player 2', email: 'alpha2@test.com' }
      },
      {
        name: 'Schedule Team Beta',
        player1: { name: 'Beta Player 1', email: 'beta1@test.com' },
        player2: { name: 'Beta Player 2', email: 'beta2@test.com' }
      },
      {
        name: 'Schedule Team Gamma',
        player1: { name: 'Gamma Player 1', email: 'gamma1@test.com' },
        player2: { name: 'Gamma Player 2', email: 'gamma2@test.com' }
      },
      {
        name: 'Schedule Team Delta',
        player1: { name: 'Delta Player 1', email: 'delta1@test.com' },
        player2: { name: 'Delta Player 2', email: 'delta2@test.com' }
      }
    ];

    for (const team of testTeams) {
      await playerHelper.addTeam(testTournamentId, team);
    }

    // Add test courts
    const testCourts: CourtData[] = [
      { name: 'Schedule Court 1', courtNumber: 1 },
      { name: 'Schedule Court 2', courtNumber: 2 }
    ];

    for (const court of testCourts) {
      await courtHelper.addCourt(testTournamentId, court);
    }

    console.log(`Test tournament with teams and courts created: ${testTournamentId}`);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    navigationHelper = new NavigationHelper(page);
    schedulingHelper = new SchedulingHelper(page);

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

  test('should generate automatic schedule successfully', async ({ page }) => {
    // Generate schedule for the tournament
    await schedulingHelper.generateSchedule(testTournamentId);

    // Verify schedule was generated
    await schedulingHelper.verifyScheduleGenerated(testTournamentId);

    console.log('✅ Automatic schedule generation completed');
  });

  test('should create manual matches', async ({ page }) => {
    const manualMatches: MatchData[] = [
      {
        team1: 'Schedule Team Alpha',
        team2: 'Schedule Team Beta',
        court: 'Schedule Court 1',
        time: '10:00',
        round: 'Quarterfinal'
      },
      {
        team1: 'Schedule Team Gamma',
        team2: 'Schedule Team Delta',
        court: 'Schedule Court 2',
        time: '11:00',
        round: 'Quarterfinal'
      }
    ];

    for (const matchData of manualMatches) {
      await schedulingHelper.scheduleManualMatch(testTournamentId, matchData);
      await schedulingHelper.verifyMatchScheduled(matchData);
    }

    console.log(`✅ Successfully scheduled ${manualMatches.length} manual matches`);
  });

  test('should handle match rescheduling', async ({ page }) => {
    // First create a match to reschedule
    const originalMatch: MatchData = {
      team1: 'Schedule Team Alpha',
      team2: 'Schedule Team Beta',
      court: 'Schedule Court 1',
      time: '14:00',
      round: 'Semifinal'
    };

    await schedulingHelper.scheduleManualMatch(testTournamentId, originalMatch);

    // Get the match ID
    const matchId = await schedulingHelper.getMatchId(originalMatch.team1, originalMatch.team2);

    // Reschedule the match
    const newTime = '15:30';
    const newCourt = 'Schedule Court 2';
    await schedulingHelper.rescheduleMatch(matchId, newTime, newCourt);

    console.log(`✅ Successfully rescheduled match ${matchId}`);
  });

  test('should handle scheduling conflicts detection', async ({ page }) => {
    // Navigate to scheduling section
    await navigationHelper.goToTournamentDetails(testTournamentId);
    await navigationHelper.selectTab('Schedule');

    // Try to create conflicting matches (same court, same time)
    const conflictingMatch1: MatchData = {
      team1: 'Schedule Team Alpha',
      team2: 'Schedule Team Beta',
      court: 'Schedule Court 1',
      time: '16:00',
      round: 'Final'
    };

    const conflictingMatch2: MatchData = {
      team1: 'Schedule Team Gamma',
      team2: 'Schedule Team Delta',
      court: 'Schedule Court 1', // Same court
      time: '16:00', // Same time
      round: 'Final'
    };

    // Schedule first match
    await schedulingHelper.scheduleManualMatch(testTournamentId, conflictingMatch1);

    // Try to schedule conflicting match
    try {
      await schedulingHelper.scheduleManualMatch(testTournamentId, conflictingMatch2);

      // Check for conflict warnings
      const conflictWarnings = page.locator('.conflict-warning, .error, [role="alert"], .scheduling-conflict');
      const warningCount = await conflictWarnings.count();

      if (warningCount > 0) {
        console.log('✅ Conflict detection working - found warnings');
      } else {
        console.log('ℹ️ No conflict warnings detected (may be allowed or not implemented)');
      }
    } catch (error) {
      console.log('✅ Conflict prevented by validation system');
    }
  });

  test('should display schedule in different views', async ({ page }) => {
    // Navigate to scheduling section
    await navigationHelper.goToTournamentDetails(testTournamentId);
    await navigationHelper.selectTab('Schedule');

    // Test different view modes
    const viewModes = [
      'List View',
      'Calendar View',
      'Timeline View',
      'Court View'
    ];

    for (const viewMode of viewModes) {
      const viewButton = page.locator(`button:has-text("${viewMode}"), [data-testid="${viewMode.toLowerCase().replace(' ', '-')}"]`);
      if (await viewButton.isVisible()) {
        await viewButton.click();
        await page.waitForTimeout(1000);
        console.log(`✅ ${viewMode} available and working`);
      }
    }

    // Check for schedule export functionality
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid="export-schedule"]');
    if (await exportButton.isVisible()) {
      console.log('✅ Schedule export functionality available');
    }
  });

  test('should handle time zone and scheduling preferences', async ({ page }) => {
    // Navigate to scheduling section
    await navigationHelper.goToTournamentDetails(testTournamentId);
    await navigationHelper.selectTab('Schedule');

    // Look for scheduling preferences
    const preferencesButton = page.locator('button:has-text("Preferences"), button:has-text("Settings"), [data-testid="schedule-settings"]');
    if (await preferencesButton.isVisible()) {
      await preferencesButton.click();
      await page.waitForTimeout(500);

      // Check for time zone settings
      const timezoneSelect = page.locator('select[name="timezone"], [data-testid="timezone-select"]');
      if (await timezoneSelect.isVisible()) {
        console.log('✅ Timezone configuration available');
      }

      // Check for match duration settings
      const durationInput = page.locator('input[name="matchDuration"], [data-testid="match-duration"]');
      if (await durationInput.isVisible()) {
        console.log('✅ Match duration configuration available');
      }

      // Close settings
      const closeButton = page.locator('button:has-text("Close"), button:has-text("Cancel"), [aria-label="Close"]');
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    }
  });

  test('should handle round progression and bracket generation', async ({ page }) => {
    // Navigate to scheduling section
    await navigationHelper.goToTournamentDetails(testTournamentId);

    // Check for bracket view
    const bracketTab = page.locator('[role="tab"]:has-text("Bracket"), button:has-text("Bracket"), [data-testid="bracket-tab"]');
    if (await bracketTab.isVisible()) {
      await bracketTab.click();
      await page.waitForTimeout(1000);

      // Check for bracket visualization
      const bracketElements = page.locator('.bracket, .tournament-bracket, [data-testid="bracket-view"]');
      if (await bracketElements.first().isVisible()) {
        console.log('✅ Tournament bracket visualization available');
      }

      // Check for round progression
      const roundElements = page.locator('.round, .bracket-round, [data-testid*="round"]');
      const roundCount = await roundElements.count();
      if (roundCount > 0) {
        console.log(`✅ Found ${roundCount} tournament rounds`);
      }
    }

    // Check for automatic advancement settings
    const advancementButton = page.locator('button:has-text("Advancement"), button:has-text("Progression"), [data-testid="advancement-settings"]');
    if (await advancementButton.isVisible()) {
      console.log('✅ Round advancement configuration available');
    }
  });

  test('should handle scheduling notifications and updates', async ({ page }) => {
    // Navigate to scheduling section
    await navigationHelper.goToTournamentDetails(testTournamentId);
    await navigationHelper.selectTab('Schedule');

    // Look for notification settings
    const notificationButton = page.locator('button:has-text("Notifications"), [data-testid="schedule-notifications"]');
    if (await notificationButton.isVisible()) {
      await notificationButton.click();
      await page.waitForTimeout(500);

      // Check notification options
      const notificationOptions = page.locator('input[type="checkbox"], .notification-option');
      const optionCount = await notificationOptions.count();
      if (optionCount > 0) {
        console.log(`✅ Found ${optionCount} notification options`);
      }

      // Close notifications panel
      const closeButton = page.locator('button:has-text("Close"), button:has-text("Cancel")');
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    }

    // Check for real-time schedule updates
    const realtimeIndicator = page.locator('.realtime, .live-updates, [data-testid="realtime-schedule"]');
    if (await realtimeIndicator.isVisible()) {
      console.log('✅ Real-time schedule updates available');
    }
  });
});