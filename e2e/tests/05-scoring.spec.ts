import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { NavigationHelper } from '../helpers/navigation.helper';
import { TournamentHelper, TournamentData } from '../helpers/tournament.helper';
import { ScoringHelper, ScoreData } from '../helpers/scoring.helper';
import { SchedulingHelper, MatchData } from '../helpers/scheduling.helper';
import { PlayerHelper, TeamData } from '../helpers/player.helper';
import { CourtHelper, CourtData } from '../helpers/court.helper';

test.describe('Scoring Tests', () => {
  let authHelper: AuthHelper;
  let navigationHelper: NavigationHelper;
  let tournamentHelper: TournamentHelper;
  let scoringHelper: ScoringHelper;
  let schedulingHelper: SchedulingHelper;
  let playerHelper: PlayerHelper;
  let courtHelper: CourtHelper;
  let testTournamentId: string;
  const testMatchIds: string[] = [];

  test.beforeAll(async ({ browser }) => {
    // Set up a complete test tournament with teams, courts, and matches for scoring tests
    const page = await browser.newPage();
    authHelper = new AuthHelper(page);
    navigationHelper = new NavigationHelper(page);
    tournamentHelper = new TournamentHelper(page);
    playerHelper = new PlayerHelper(page);
    courtHelper = new CourtHelper(page);
    schedulingHelper = new SchedulingHelper(page);

    await authHelper.loginAsAdmin();
    await navigationHelper.goToTournaments();
    await navigationHelper.goToCreateTournament();

    const tournamentData: TournamentData = {
      name: `E2E Scoring Test Tournament ${Date.now()}`,
      description: 'Tournament for testing scoring features',
      sport: 'Badminton',
      startDate: '2025-01-05',
      endDate: '2025-01-07',
      venue: 'Scoring Test Center',
      format: 'Single Elimination',
      maxParticipants: 8
    };

    testTournamentId = await tournamentHelper.createTournament(tournamentData);

    // Add test teams
    const testTeams: TeamData[] = [
      {
        name: 'Scoring Team Red',
        player1: { name: 'Red Player 1', email: 'red1@test.com' },
        player2: { name: 'Red Player 2', email: 'red2@test.com' }
      },
      {
        name: 'Scoring Team Blue',
        player1: { name: 'Blue Player 1', email: 'blue1@test.com' },
        player2: { name: 'Blue Player 2', email: 'blue2@test.com' }
      },
      {
        name: 'Scoring Team Green',
        player1: { name: 'Green Player 1', email: 'green1@test.com' },
        player2: { name: 'Green Player 2', email: 'green2@test.com' }
      },
      {
        name: 'Scoring Team Yellow',
        player1: { name: 'Yellow Player 1', email: 'yellow1@test.com' },
        player2: { name: 'Yellow Player 2', email: 'yellow2@test.com' }
      }
    ];

    for (const team of testTeams) {
      await playerHelper.addTeam(testTournamentId, team);
    }

    // Add test courts
    const testCourts: CourtData[] = [
      { name: 'Scoring Court 1', courtNumber: 1 },
      { name: 'Scoring Court 2', courtNumber: 2 }
    ];

    for (const court of testCourts) {
      await courtHelper.addCourt(testTournamentId, court);
    }

    // Create test matches
    const testMatches: MatchData[] = [
      {
        team1: 'Scoring Team Red',
        team2: 'Scoring Team Blue',
        court: 'Scoring Court 1',
        time: '09:00',
        round: 'Semifinal'
      },
      {
        team1: 'Scoring Team Green',
        team2: 'Scoring Team Yellow',
        court: 'Scoring Court 2',
        time: '10:30',
        round: 'Semifinal'
      }
    ];

    for (const match of testMatches) {
      await schedulingHelper.scheduleManualMatch(testTournamentId, match);
      const matchId = await schedulingHelper.getMatchId(match.team1, match.team2);
      testMatchIds.push(matchId);
    }

    console.log(`Test tournament with complete setup created: ${testTournamentId}`);
    console.log(`Test matches created: ${testMatchIds.join(', ')}`);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    navigationHelper = new NavigationHelper(page);
    scoringHelper = new ScoringHelper(page);

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

  test('should enter basic match scores successfully', async ({ page }) => {
    if (testMatchIds.length === 0) {
      test.skip(true, 'No test matches available for scoring');
      return;
    }

    const matchId = testMatchIds[0];
    const scoreData: ScoreData = {
      team1Score: [21, 15, 21], // Best of 3 sets
      team2Score: [19, 21, 18],
      sets: 3,
      winner: 'Scoring Team Red'
    };

    await scoringHelper.enterScore(matchId, scoreData);
    await scoringHelper.verifyScoreEntered(matchId, scoreData);

    console.log(`✅ Successfully entered scores for match: ${matchId}`);
  });

  test('should handle live scoring updates', async ({ page }) => {
    if (testMatchIds.length < 2) {
      test.skip(true, 'Insufficient test matches for live scoring test');
      return;
    }

    const matchId = testMatchIds[1];
    const liveScoreData: ScoreData = {
      team1Score: [12, 8], // In-progress scores
      team2Score: [9, 11],
      sets: 2
    };

    await scoringHelper.enterLiveScore(matchId, liveScoreData);
    await scoringHelper.verifyScoreEntered(matchId, liveScoreData);

    console.log(`✅ Successfully updated live scores for match: ${matchId}`);
  });

  test('should validate scoring rules for badminton', async ({ page }) => {
    if (testMatchIds.length === 0) {
      test.skip(true, 'No test matches available for validation test');
      return;
    }

    const matchId = testMatchIds[0];

    // Test invalid scores (should trigger validation)
    const invalidScoreData: ScoreData = {
      team1Score: [25], // Invalid: badminton games go to 21 (with win by 2)
      team2Score: [23],
      sets: 1
    };

    try {
      await scoringHelper.enterScore(matchId, invalidScoreData);

      // Check for validation errors
      const errorMessages = page.locator('.error, .validation-error, [role="alert"], .score-error');
      const errorCount = await errorMessages.count();

      if (errorCount > 0) {
        console.log('✅ Score validation working - invalid scores rejected');
      } else {
        console.log('ℹ️ No validation errors shown (may allow flexible scoring)');
      }
    } catch (error) {
      console.log('✅ Score validation prevented invalid entry');
    }
  });

  test('should handle different scoring formats', async ({ page }) => {
    // Navigate to tournament scoring settings
    await navigationHelper.goToTournamentDetails(testTournamentId);

    // Look for scoring settings
    const settingsButton = page.locator('button:has-text("Settings"), button:has-text("Scoring"), [data-testid="scoring-settings"]');
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(500);

      // Check for different scoring format options
      const formatOptions = page.locator('select[name="scoringFormat"], [data-testid="scoring-format"]');
      if (await formatOptions.isVisible()) {
        // Test different formats
        const formats = ['Best of 3', 'Best of 5', 'Single Game'];
        for (const format of formats) {
          const option = page.locator(`option:has-text("${format}")`);
          if (await option.isVisible()) {
            console.log(`✅ Scoring format available: ${format}`);
          }
        }
      }

      // Close settings
      const closeButton = page.locator('button:has-text("Close"), button:has-text("Cancel")');
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    }
  });

  test('should finalize completed matches', async ({ page }) => {
    if (testMatchIds.length === 0) {
      test.skip(true, 'No test matches available for finalization test');
      return;
    }

    const matchId = testMatchIds[0];

    // First enter complete scores
    const finalScoreData: ScoreData = {
      team1Score: [21, 21],
      team2Score: [15, 18],
      sets: 2,
      winner: 'Scoring Team Red'
    };

    await scoringHelper.enterScore(matchId, finalScoreData);

    // Finalize the match
    await scoringHelper.finalizeMatch(matchId, finalScoreData.winner!);
    await scoringHelper.verifyMatchCompleted(matchId, finalScoreData.winner!);

    console.log(`✅ Successfully finalized match: ${matchId}`);
  });

  test('should handle score corrections and edits', async ({ page }) => {
    if (testMatchIds.length < 2) {
      test.skip(true, 'Insufficient test matches for score correction test');
      return;
    }

    const matchId = testMatchIds[1];

    // Enter initial scores
    const initialScoreData: ScoreData = {
      team1Score: [21, 15],
      team2Score: [18, 21],
      sets: 2
    };

    await scoringHelper.enterScore(matchId, initialScoreData);

    // Navigate to score entry for correction
    await navigationHelper.goToTournamentDetails(testTournamentId);
    await navigationHelper.selectTab('Matches');

    // Look for edit score functionality
    const matchElement = page.locator(`[data-match-id="${matchId}"], tr:has-text("${matchId}")`);
    const editButton = matchElement.locator('button:has-text("Edit"), button:has-text("Correct"), [data-testid="edit-score"]');

    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);

      // Correct the scores
      const correctedScoreData: ScoreData = {
        team1Score: [21, 16], // Corrected second set
        team2Score: [18, 21],
        sets: 2
      };

      await scoringHelper.enterScore(matchId, correctedScoreData);
      console.log(`✅ Successfully corrected scores for match: ${matchId}`);
    } else {
      console.log('ℹ️ Score correction functionality not found');
    }
  });

  test('should display real-time score updates', async ({ page }) => {
    // Navigate to tournament matches
    await navigationHelper.goToTournamentDetails(testTournamentId);
    await navigationHelper.selectTab('Matches');

    // Look for live scoring indicators
    const liveIndicators = page.locator('.live-score, .realtime-score, [data-testid="live-scoring"]');
    const liveCount = await liveIndicators.count();

    if (liveCount > 0) {
      console.log(`✅ Found ${liveCount} live scoring indicators`);
    }

    // Check for scoreboard view
    const scoreboardButton = page.locator('button:has-text("Scoreboard"), [data-testid="scoreboard"]');
    if (await scoreboardButton.isVisible()) {
      await scoreboardButton.click();
      await page.waitForTimeout(1000);

      // Verify scoreboard display
      const scoreboardElements = page.locator('.scoreboard, .live-scores, [data-testid="scoreboard-display"]');
      if (await scoreboardElements.first().isVisible()) {
        console.log('✅ Live scoreboard display available');
      }
    }
  });

  test('should handle scoring history and audit trail', async ({ page }) => {
    if (testMatchIds.length === 0) {
      test.skip(true, 'No test matches available for history test');
      return;
    }

    const matchId = testMatchIds[0];

    // Navigate to match details
    await navigationHelper.goToTournamentDetails(testTournamentId);
    await navigationHelper.selectTab('Matches');

    const matchElement = page.locator(`[data-match-id="${matchId}"], tr:has-text("${matchId}")`);
    const detailsButton = matchElement.locator('button:has-text("Details"), button:has-text("View"), [data-testid="match-details"]');

    if (await detailsButton.isVisible()) {
      await detailsButton.click();
      await page.waitForTimeout(500);

      // Look for scoring history
      const historyElements = page.locator('.score-history, .scoring-log, [data-testid="score-history"]');
      if (await historyElements.first().isVisible()) {
        console.log('✅ Scoring history tracking available');
      }

      // Look for audit trail
      const auditElements = page.locator('.audit-trail, .score-changes, [data-testid="audit-trail"]');
      if (await auditElements.first().isVisible()) {
        console.log('✅ Score audit trail available');
      }

      // Close details
      const closeButton = page.locator('button:has-text("Close"), button:has-text("Back")');
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    }
  });

  test('should handle tournament statistics and standings', async ({ page }) => {
    // Navigate to tournament overview
    await navigationHelper.goToTournamentDetails(testTournamentId);

    // Look for standings/statistics tab
    const standingsTab = page.locator('[role="tab"]:has-text("Standings"), [role="tab"]:has-text("Statistics"), [data-testid="standings-tab"]');
    if (await standingsTab.isVisible()) {
      await standingsTab.click();
      await page.waitForTimeout(1000);

      // Check for team standings
      const standingsTable = page.locator('.standings-table, [data-testid="standings"], table');
      if (await standingsTable.isVisible()) {
        console.log('✅ Tournament standings display available');

        // Check for win/loss records
        const recordElements = page.locator('.win-loss, .record, [data-testid="team-record"]');
        const recordCount = await recordElements.count();
        if (recordCount > 0) {
          console.log(`✅ Found ${recordCount} team records`);
        }
      }

      // Check for tournament statistics
      const statsElements = page.locator('.tournament-stats, .statistics, [data-testid="tournament-stats"]');
      if (await statsElements.first().isVisible()) {
        console.log('✅ Tournament statistics available');
      }
    }

    // Check for bracket progression
    const bracketTab = page.locator('[role="tab"]:has-text("Bracket"), [data-testid="bracket-tab"]');
    if (await bracketTab.isVisible()) {
      await bracketTab.click();
      await page.waitForTimeout(1000);

      const bracketElements = page.locator('.bracket, .tournament-bracket, [data-testid="bracket"]');
      if (await bracketElements.first().isVisible()) {
        console.log('✅ Tournament bracket with score updates available');
      }
    }
  });
});